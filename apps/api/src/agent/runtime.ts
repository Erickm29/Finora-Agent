import OpenAI from "openai";
import type { AgentTurnInput } from "@finora/shared";
import { FinoraError } from "@finora/shared";
import { services } from "../container.js";
import { env } from "../env.js";
import {
  generateVoiceSummary,
  researchMacroContext,
  researchProductPrice,
} from "../integrations/market.js";

export type AgentReply = {
  type: "text";
  text: string;
  buttons?: { label: string; callbackData: string }[];
};

const HISTORY_LIMIT = 16;

async function resolveSession(input: AgentTurnInput) {
  return services().repos.conversations.getOrCreateSession({
    userId: input.userId,
    channel: input.channel,
    externalChatId: input.externalChatId ?? input.userId,
  });
}

async function persistTurn(
  sessionId: string,
  userText: string | null | undefined,
  replies: AgentReply[],
) {
  const rows: {
    role: "user" | "assistant";
    content: string;
  }[] = [];
  if (userText?.trim()) {
    rows.push({ role: "user", content: userText.trim() });
  }
  for (const reply of replies) {
    rows.push({ role: "assistant", content: reply.text });
  }
  if (!rows.length) return;
  await services().repos.conversations.appendMessages(sessionId, rows);
}

async function loadHistoryForLlm(
  sessionId: string,
): Promise<OpenAI.Chat.Completions.ChatCompletionMessageParam[]> {
  const history = await services().repos.conversations.listRecentMessages(
    sessionId,
    HISTORY_LIMIT,
  );
  return history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
}

const SYSTEM_PROMPT = `Sos Finora, mentor financiero activo para Bolivia.
Usás pesos bolivianos (Bs / BOB). Informás impacto; no bloqueás de forma paternalista.
Nunca ejecutes dinero: solo preparás acciones que requieren confirmación humana.
No inventes precios ni tipo de cambio si faltan datos de herramientas.
Preferí microahorros indoloros (vuelto, % ingreso, margen post-sueldo).`;

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "research_product_price",
      description: "Investiga precio de un producto (Firecrawl o fixture local)",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "research_macro_context",
      description: "Contexto macro Bolivia (Exa o fixture)",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_or_update_goal",
      description: "Crea una meta de ahorro en Bs",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          target_amount_bobs: { type: "number" },
          target_months: { type: "number" },
          base_monthly_bobs: { type: "number" },
        },
        required: [
          "name",
          "target_amount_bobs",
          "target_months",
          "base_monthly_bobs",
        ],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_active_goal",
      description: "Lista metas del usuario",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "suggest_microsaving",
      description: "Prepara microahorro pendiente de confirmación",
      parameters: {
        type: "object",
        properties: {
          goal_id: { type: "string" },
          amount_bobs: { type: "number" },
          note: { type: "string" },
        },
        required: ["goal_id", "amount_bobs"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "evaluate_withdrawal_guardrail",
      description: "Calcula impacto de un retiro",
      parameters: {
        type: "object",
        properties: {
          goal_id: { type: "string" },
          amount_bobs: { type: "number" },
        },
        required: ["goal_id", "amount_bobs"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "prepare_wallbit_conversion",
      description: "Prepara conversión Wallbit (requiere confirmación)",
      parameters: {
        type: "object",
        properties: {
          goal_id: { type: "string" },
          amount_bobs: { type: "number" },
          to: { type: "string" },
        },
        required: ["amount_bobs"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_voice_summary",
      description: "Genera audio del resumen (ElevenLabs)",
      parameters: {
        type: "object",
        properties: { text: { type: "string" } },
        required: ["text"],
      },
    },
  },
];

async function runTool(
  userId: string,
  channel: "telegram" | "web",
  name: string,
  args: Record<string, unknown>,
) {
  const svc = services();
  switch (name) {
    case "research_product_price":
      return researchProductPrice(String(args.query ?? ""));
    case "research_macro_context":
      return researchMacroContext(String(args.query ?? ""));
    case "create_or_update_goal":
      return svc.goals.create(userId, {
        name: String(args.name),
        target_amount_bobs: Number(args.target_amount_bobs),
        target_months: Number(args.target_months),
        base_monthly_bobs: Number(args.base_monthly_bobs),
      });
    case "get_active_goal":
      return svc.goals.list(userId);
    case "suggest_microsaving": {
      const action = await svc.microsavings.suggest({
        userId,
        goalId: String(args.goal_id),
        amountBobs: Number(args.amount_bobs),
        note: args.note ? String(args.note) : undefined,
        channel,
      });
      return {
        ...action,
        confirmCallback: `action:confirm:${action.id}`,
        cancelCallback: `action:cancel:${action.id}`,
      };
    }
    case "evaluate_withdrawal_guardrail": {
      const evaluation = await svc.guardrails.evaluateWithdrawal({
        userId,
        goalId: String(args.goal_id),
        amountBobs: Number(args.amount_bobs),
      });
      const action = await svc.pendingActions.prepare({
        userId,
        goalId: String(args.goal_id),
        kind: "confirm_withdrawal",
        payload: { amount_bobs: Number(args.amount_bobs) },
        channel,
      });
      return {
        ...evaluation,
        actionId: action.id,
        confirmCallback: `action:confirm:${action.id}`,
        cancelCallback: `action:cancel:${action.id}`,
      };
    }
    case "prepare_wallbit_conversion": {
      const action = await svc.pendingActions.prepareWallbitConvert({
        userId,
        goalId: args.goal_id ? String(args.goal_id) : null,
        amountBobs: Number(args.amount_bobs),
        toCurrency: args.to ? String(args.to) : "USD",
        channel,
      });
      return {
        ...action,
        confirmCallback: `action:confirm:${action.id}`,
        cancelCallback: `action:cancel:${action.id}`,
        dashboardUrl: `${env.webAppUrl}/actions`,
      };
    }
    case "generate_voice_summary":
      return generateVoiceSummary(String(args.text ?? ""));
    default:
      return { error: `Unknown tool ${name}` };
  }
}

/** Heuristic mentor when Gemini key is missing / rate-limited (local). */
async function heuristicTurn(
  input: AgentTurnInput,
  sessionId: string,
): Promise<{ replies: AgentReply[]; sessionId: string }> {
  const text = (input.text ?? "").toLowerCase();
  const svc = services();
  const goals = await svc.goals.list(input.userId);
  const active = goals[0];

  const finish = async (replies: AgentReply[]) => {
    await persistTurn(sessionId, input.text, replies);
    return { sessionId, replies };
  };

  if (active && /microahorro|ahorrar|aporte/.test(text)) {
    const amountMatch = text.match(/(\d+(?:[.,]\d+)?)/);
    const amountBobs = amountMatch
      ? Number(amountMatch[1].replace(",", "."))
      : Math.min(200, Math.ceil(active.baseMonthlyBobs * 0.2));
    const action = await svc.microsavings.suggest({
      userId: input.userId,
      goalId: active.id,
      amountBobs,
      channel: input.channel,
      note: "Sugerencia local (sin Gemini)",
    });
    return finish([
      {
        type: "text",
        text:
          `Preparé un microahorro de ${amountBobs.toLocaleString("es-BO")} Bs para “${active.name}”. ` +
          `Confirmalo para aplicarlo (no se mueve nada sin tu OK).`,
        buttons: [
          { label: "Confirmar", callbackData: `action:confirm:${action.id}` },
          { label: "Cancelar", callbackData: `action:cancel:${action.id}` },
        ],
      },
    ]);
  }

  if (active && /wallbit|proteger|convertir|usd/.test(text)) {
    const amountMatch = text.match(/(\d+(?:[.,]\d+)?)/);
    const amountBobs = amountMatch
      ? Number(amountMatch[1].replace(",", "."))
      : Math.min(500, active.accumulatedBobs || 300);
    const action = await svc.pendingActions.prepareWallbitConvert({
      userId: input.userId,
      goalId: active.id,
      amountBobs,
      channel: input.channel,
    });
    return finish([
      {
        type: "text",
        text:
          `Dejé lista una conversión Wallbit de ${amountBobs.toLocaleString("es-BO")} Bs → USD. ` +
          `Solo se ejecuta si confirmás.`,
        buttons: [
          { label: "Confirmar", callbackData: `action:confirm:${action.id}` },
          { label: "Cancelar", callbackData: `action:cancel:${action.id}` },
        ],
      },
    ]);
  }

  if (/laptop|macbook|comprar|nueva meta|crear meta/.test(text)) {
    const price = await researchProductPrice(input.text ?? "laptop");
    if (!price.ok || (!price.amountBobs && !price.amountForeign)) {
      return finish([
        {
          type: "text",
          text:
            `No pude fijar un precio confiable aún` +
            `${price.error ? ` (${price.error})` : ""}. ` +
            `Decime un monto en Bs o un link del producto y armo el plan.`,
        },
      ]);
    }

    const amount = price.amountBobs ?? null;
    if (!amount) {
      return finish([
        {
          type: "text",
          text:
            `Encontré un precio de referencia en ${price.currency}: ` +
            `${price.amountForeign?.toLocaleString("es-BO")} ` +
            `${price.currency}` +
            `${price.title ? ` (${price.title})` : ""}.\n` +
            `No lo convierto a Bs sin tipo de cambio verificado. ` +
            `¿A cuántos Bs querés fijar la meta?`,
        },
      ]);
    }

    const months = 10;
    const monthly = Math.ceil(amount / months);
    const goal = await svc.goals.create(input.userId, {
      name: /macbook/.test(text) ? "MacBook" : "Laptop",
      target_amount_bobs: amount,
      target_months: months,
      base_monthly_bobs: monthly,
    });
    await svc.repos.conversations.touchSession(sessionId, goal.id);
    return finish([
      {
        type: "text",
        text:
          `Armé un plan en pesos bolivianos (Bs):\n` +
          `• Meta: ${goal.name}\n` +
          `• Precio estimado: ${amount.toLocaleString("es-BO")} Bs` +
          `${price.source === "fixture" ? " (ejemplo local)" : ` (${price.source})`}\n` +
          `• Plazo: ${months} meses\n` +
          `• Cuota base: ${monthly.toLocaleString("es-BO")} Bs/mes\n\n` +
          `¿Querés que prepare un microahorro o protección Wallbit?`,
      },
    ]);
  }

  if (active) {
    return finish([
      {
        type: "text",
        text:
          `Tu meta activa: ${active.name} — ${active.accumulatedBobs}/${active.targetAmountBobs} Bs ` +
          `(${Math.round(active.progressRatio * 100)}%). Usá /progreso o pedime un microahorro.`,
      },
    ]);
  }

  // Soft recognition of "meta" / goals without product keywords
  if (/meta|ahorrar|viaje|fondo|emergencia/.test(text)) {
    return finish([
      {
        type: "text",
        text:
          "Dale. Contame el objetivo con más detalle (qué querés, monto en Bs si lo sabés y en cuántos meses). " +
          "Ejemplo: “Quiero un viaje a Santa Cruz de 3000 Bs en 4 meses”.",
      },
    ]);
  }

  return finish([
    {
      type: "text",
      text:
        "Soy Finora, tu mentor financiero en Bolivia (Bs). Contame qué querés lograr, por ejemplo: “Quiero comprar una laptop”.",
    },
  ]);
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

function geminiErrorStatus(err: unknown): number | null {
  if (err && typeof err === "object" && "status" in err) {
    return Number((err as { status: number }).status);
  }
  const msg = err instanceof Error ? err.message : String(err);
  if (/\b429\b/.test(msg) || /rate.?limit/i.test(msg)) return 429;
  return null;
}

/** Serialize Gemini calls + retry on 429 to avoid free-tier stampedes. */
let geminiQueue: Promise<unknown> = Promise.resolve();

async function createGeminiCompletion(
  client: OpenAI,
  params: {
    model: string;
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
    tools: OpenAI.Chat.Completions.ChatCompletionTool[];
  },
) {
  const run = async () => {
    const delaysMs = [0, 2000, 5000, 12000];
    let lastErr: unknown;
    for (let attempt = 0; attempt < delaysMs.length; attempt++) {
      if (delaysMs[attempt] > 0) {
        console.warn(
          `[finora] Gemini retry ${attempt}/${delaysMs.length - 1} in ${delaysMs[attempt]}ms`,
        );
        await sleep(delaysMs[attempt]);
      }
      try {
        return await client.chat.completions.create({
          model: params.model,
          messages: params.messages,
          tools: params.tools,
        });
      } catch (err) {
        lastErr = err;
        const status = geminiErrorStatus(err);
        if (status === 429 && attempt < delaysMs.length - 1) continue;
        throw err;
      }
    }
    throw lastErr;
  };

  const next = geminiQueue.then(run, run);
  geminiQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export async function runAgentTurn(
  input: AgentTurnInput,
): Promise<{ replies: AgentReply[]; sessionId: string }> {
  const session = await resolveSession(input);

  if (input.callbackData?.startsWith("action:")) {
    const [, op, id] = input.callbackData.split(":");
    const svc = services();
    let replies: AgentReply[] = [];
    if (op === "confirm") {
      const action = await svc.pendingActions.confirm(input.userId, id);
      replies = [
        {
          type: "text",
          text: `Listo. Acción ${action.kind} confirmada.`,
        },
      ];
    } else if (op === "cancel") {
      await svc.pendingActions.cancel(input.userId, id);
      replies = [{ type: "text", text: "Acción cancelada. Vos decidís." }];
    }
    if (replies.length) {
      await persistTurn(
        session.id,
        input.callbackData,
        replies,
      );
      return { sessionId: session.id, replies };
    }
  }

  if (!env.geminiApiKey) {
    return heuristicTurn(input, session.id);
  }

  // Gemini via OpenAI-compatible Chat Completions + tool calling
  const client = new OpenAI({
    apiKey: env.geminiApiKey,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  });
  const prior = await loadHistoryForLlm(session.id);
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...prior,
    { role: "user", content: input.text ?? "" },
  ];

  const maxRounds = 4;
  for (let i = 0; i < maxRounds; i++) {
    let completion;
    try {
      completion = await createGeminiCompletion(client, {
        model: env.geminiModel,
        messages,
        tools,
      });
    } catch (err) {
      const status =
        err && typeof err === "object" && "status" in err
          ? Number((err as { status: number }).status)
          : 502;
      if (status === 429) {
        console.warn(
          "[finora] Gemini 429 persistente — usando mentor local (heuristic).",
        );
        const fallback = await heuristicTurn(input, session.id);
        // Prefix only for display; heuristic already persisted the turn.
        return {
          sessionId: session.id,
          replies: fallback.replies.map((r, idx) =>
            idx === 0
              ? {
                  ...r,
                  text:
                    `(Gemini está saturado un momento; te respondo en modo local.)\n\n` +
                    r.text,
                }
              : r,
          ),
        };
      }
      const detail = err instanceof Error ? err.message : "Gemini error";
      throw new FinoraError(
        "GEMINI_ERROR",
        `Gemini falló: ${detail.slice(0, 300)}`,
        502,
      );
    }
    const msg = completion.choices[0]?.message;
    if (!msg) break;

    if (msg.tool_calls?.length) {
      messages.push(msg);
      for (const call of msg.tool_calls) {
        if (call.type !== "function") continue;
        const args = JSON.parse(call.function.arguments || "{}") as Record<
          string,
          unknown
        >;
        const result = await runTool(
          input.userId,
          input.channel,
          call.function.name,
          args,
        );
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
      continue;
    }

    const content = msg.content ?? "Listo.";
    const buttons: AgentReply["buttons"] = [];
    const confirmMatch = content.match(/action:confirm:[0-9a-f-]+/i);
    const cancelMatch = content.match(/action:cancel:[0-9a-f-]+/i);
    // Also scan last tool results in messages for callbacks
    for (const m of messages.slice().reverse()) {
      if (m.role === "tool" && typeof m.content === "string") {
        try {
          const parsed = JSON.parse(m.content) as {
            confirmCallback?: string;
            cancelCallback?: string;
          };
          if (parsed.confirmCallback) {
            buttons.push({
              label: "Confirmar",
              callbackData: parsed.confirmCallback,
            });
          }
          if (parsed.cancelCallback) {
            buttons.push({
              label: "Cancelar",
              callbackData: parsed.cancelCallback,
            });
          }
          if (buttons.length) break;
        } catch {
          /* ignore */
        }
      }
    }
    if (confirmMatch) {
      buttons.push({ label: "Confirmar", callbackData: confirmMatch[0] });
    }
    if (cancelMatch) {
      buttons.push({ label: "Cancelar", callbackData: cancelMatch[0] });
    }

    const replies: AgentReply[] = [
      {
        type: "text",
        text: content,
        buttons: buttons.length ? buttons : undefined,
      },
    ];
    await persistTurn(session.id, input.text, replies);
    return { sessionId: session.id, replies };
  }

  throw new FinoraError("AGENT_FAILED", "El agente no pudo completar el turno", 502);
}
