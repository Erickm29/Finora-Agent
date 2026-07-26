import type { AgentTurnInput } from "@finora/shared";
import { FinoraError } from "@finora/shared";
import type OpenAI from "openai";
import type { Goal } from "@finora/domain";
import { getGoalAnalysisService, services } from "../container.js";
import { env } from "../env.js";
import { ai, AllProvidersFailedError } from "../ai/index.js";
import { formatAnalysisForChat } from "../analysis/format.js";
import {
  generateVoiceSummary,
  researchMacroContext,
  researchProductPrice,
} from "../integrations/market.js";
import { notifyChannel } from "./notifier.js";
import { agentTools, validateToolArgs } from "./tool-schemas.js";

export type AgentReply = {
  type: "text";
  text: string;
  buttons?: { label: string; callbackData: string }[];
};

const HISTORY_LIMIT = 16;

/** Presupuesto total del turno; evita que un proveedor colgado cuelgue el bot. */
const TURN_BUDGET_MS = 45_000;
/** Techo por llamada individual a un proveedor. */
const PROVIDER_TIMEOUT_MS = 30_000;

async function resolveSession(input: AgentTurnInput) {
  return services().repos.conversations.getOrCreateSession({
    userId: input.userId,
    channel: input.channel,
    externalChatId: input.externalChatId ?? input.userId,
  });
}

async function persistUserMessage(
  sessionId: string,
  userText: string | null | undefined,
) {
  if (!userText?.trim()) return;
  await services().repos.conversations.appendMessages(sessionId, [
    { role: "user", content: userText.trim() },
  ]);
}

async function persistAssistantReplies(
  sessionId: string,
  replies: AgentReply[],
) {
  const rows = replies.map((reply) => ({
    role: "assistant" as const,
    content: reply.text,
  }));
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
Preferí microahorros indoloros (vuelto, % ingreso, margen post-sueldo).

Reglas al usar herramientas:
- Nunca menciones nombres de herramientas, ids internos ni tu proceso interno,
  ni uses las palabras "función", "herramienta" o "invocar". Si hace falta una
  herramienta, usala; no anuncies que vas a usarla ni pidas permiso.
- Para ofrecerle algo al usuario, hablale de lo que puede pedirte en lenguaje
  natural (por ejemplo "pedime tu progreso"), no de cómo lo resolvés vos.
- Los montos van como número, sin comillas ni separadores de miles.
- Nunca inventes un goal_id. Si necesitás uno y no lo tenés en esta conversación,
  llamá primero a get_active_goal y usá el id exacto que devuelve.
- Una acción preparada queda PENDIENTE: no digas que se aplicó, se acreditó ni que
  fue exitosa. Decí que quedó lista y que se aplica cuando el usuario confirme.
- El saldo acumulado de la meta no cambia hasta que el usuario confirma.`;

/**
 * Dispara el pipeline de análisis de inversión sin bloquear el turno. Cuando
 * el análisis queda listo, el usuario recibe el plan como mensaje de
 * seguimiento en el mismo canal donde creó la meta.
 */
function scheduleGoalAnalysis(
  goal: Goal,
  channel: "telegram" | "web",
  externalChatId?: string | null,
) {
  getGoalAnalysisService().schedule(goal, async (analysis, analyzedGoal) => {
    if (!externalChatId) return;
    await notifyChannel(
      channel,
      externalChatId,
      formatAnalysisForChat(analyzedGoal, analysis),
    );
  });
}

async function runTool(
  userId: string,
  channel: "telegram" | "web",
  name: string,
  args: Record<string, unknown>,
  externalChatId?: string | null,
) {
  const svc = services();
  switch (name) {
    case "research_product_price":
      return researchProductPrice(args.query as string);
    case "research_macro_context":
      return researchMacroContext(args.query as string);
    case "create_or_update_goal": {
      const targetAmountBobs = args.target_amount_bobs as number;
      const targetMonths = args.target_months as number;
      const baseMonthlyBobs =
        (args.base_monthly_bobs as number | undefined) ??
        Math.ceil(targetAmountBobs / targetMonths);
      const goal = await svc.goals.create(userId, {
        name: args.name as string,
        target_amount_bobs: targetAmountBobs,
        target_months: targetMonths,
        base_monthly_bobs: baseMonthlyBobs,
      });
      scheduleGoalAnalysis(goal, channel, externalChatId);
      return goal;
    }
    case "get_active_goal":
      return svc.goals.list(userId);
    case "suggest_microsaving": {
      const action = await svc.microsavings.suggest({
        userId,
        goalId: args.goal_id as string,
        amountBobs: args.amount_bobs as number,
        note: (args.note as string | undefined) ?? undefined,
        channel,
      });
      return {
        ...action,
        confirmCallback: `action:confirm:${action.id}`,
        cancelCallback: `action:cancel:${action.id}`,
      };
    }
    case "evaluate_withdrawal_guardrail": {
      const goalId = args.goal_id as string;
      const amountBobs = args.amount_bobs as number;
      const evaluation = await svc.guardrails.evaluateWithdrawal({
        userId,
        goalId,
        amountBobs,
      });
      const action = await svc.pendingActions.prepare({
        userId,
        goalId,
        kind: "confirm_withdrawal",
        payload: { amount_bobs: amountBobs },
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
        goalId: (args.goal_id as string | null | undefined) ?? null,
        amountBobs: args.amount_bobs as number,
        toCurrency: args.to as string,
        channel,
      });
      return {
        ...action,
        confirmCallback: `action:confirm:${action.id}`,
        cancelCallback: `action:cancel:${action.id}`,
        dashboardUrl: `${env.webAppUrl}/actions`,
      };
    }
    case "generate_voice_summary": {
      const audio = await generateVoiceSummary(args.text as string);
      if (!audio.ok) return audio;
      // El base64 del MP3 no vuelve al contexto del LLM: son cientos de KB de
      // tokens por ronda y puede desbordar la ventana de contexto.
      return { ok: true, contentType: audio.contentType, bytes: audio.bytes };
    }
    default:
      return { error: "unknown_tool", message: `No existe la tool ${name}.` };
  }
}

/**
 * Ejecuta una tool call del modelo convirtiendo cualquier fallo en un resultado
 * de tool. Así el turno sobrevive a JSON malformado, argumentos inválidos o
 * errores de dominio, y el LLM recibe la información necesaria para corregirse.
 */
async function executeToolCall(
  input: AgentTurnInput,
  name: string,
  rawArgs: string | undefined,
): Promise<unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawArgs || "{}");
  } catch {
    return {
      error: "invalid_arguments",
      message: `El JSON de argumentos de ${name} no es válido. Reintentá con JSON bien formado.`,
    };
  }

  const validation = validateToolArgs(name, parsed);
  if (!validation.ok) {
    console.warn(`[finora] tool ${name} rechazada: ${validation.error}`);
    return { error: "invalid_arguments", message: validation.error };
  }

  try {
    return await runTool(
      input.userId,
      input.channel,
      validation.name,
      validation.args,
      input.externalChatId,
    );
  } catch (err) {
    if (err instanceof FinoraError) {
      return { error: err.code, message: err.message };
    }
    console.error(`[finora] tool ${name} falló`, err);
    return {
      error: "tool_failed",
      message: `La herramienta ${name} no está disponible ahora. Seguí sin ella y avisale al usuario.`,
    };
  }
}

/**
 * Los proveedores OpenAI-compatibles devuelven 400 cuando el modelo no logra
 * emitir una tool call válida. No es un fallo de infraestructura, así que la
 * capa de failover no reintenta: lo resolvemos acá repitiendo la llamada sin
 * tools para que el usuario reciba siempre una respuesta en texto.
 */
function isToolCallRejection(err: unknown): boolean {
  const msg = (
    err instanceof Error ? err.message : String(err)
  ).toLowerCase();
  return (
    msg.includes("tool call validation failed") ||
    msg.includes("failed to call a function") ||
    msg.includes("tool_use_failed")
  );
}

function extractButtons(
  content: string,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
): AgentReply["buttons"] {
  const buttons: { label: string; callbackData: string }[] = [];
  const seen = new Set<string>();
  const add = (label: string, callbackData: string) => {
    if (seen.has(callbackData)) return;
    seen.add(callbackData);
    buttons.push({ label, callbackData });
  };

  for (const m of messages.slice().reverse()) {
    if (m.role !== "tool" || typeof m.content !== "string") continue;
    try {
      const parsed = JSON.parse(m.content) as {
        confirmCallback?: string;
        cancelCallback?: string;
      };
      if (parsed.confirmCallback) add("Confirmar", parsed.confirmCallback);
      if (parsed.cancelCallback) add("Cancelar", parsed.cancelCallback);
      if (buttons.length) break;
    } catch {
      /* resultado de tool no serializado como objeto; se ignora */
    }
  }

  const confirmMatch = content.match(/action:confirm:[0-9a-f-]+/i);
  if (confirmMatch) add("Confirmar", confirmMatch[0]);
  const cancelMatch = content.match(/action:cancel:[0-9a-f-]+/i);
  if (cancelMatch) add("Cancelar", cancelMatch[0]);

  return buttons.length ? buttons : undefined;
}

/** Heuristic mentor when no AI provider is available or every provider failed. */
async function heuristicTurn(
  input: AgentTurnInput,
  sessionId: string,
): Promise<{ replies: AgentReply[]; sessionId: string }> {
  const text = (input.text ?? "").toLowerCase();
  const svc = services();
  const goals = await svc.goals.list(input.userId);
  const active = goals[0];

  const finish = async (replies: AgentReply[]) => {
    await persistAssistantReplies(sessionId, replies);
    return { sessionId, replies };
  };

  if (active && /microahorro|ahorrar|aporte/.test(text)) {
    const amountMatch = text.match(/(\d+(?:[.,]\d+)?)/);
    const parsedAmount = amountMatch
      ? Number(amountMatch[1].replace(",", "."))
      : NaN;
    const amountBobs =
      Number.isFinite(parsedAmount) && parsedAmount > 0
        ? parsedAmount
        : Math.max(1, Math.min(200, Math.ceil(active.baseMonthlyBobs * 0.2)));
    const action = await svc.microsavings.suggest({
      userId: input.userId,
      goalId: active.id,
      amountBobs,
      channel: input.channel,
      note: "Sugerencia local (sin IA)",
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
    const parsedAmount = amountMatch
      ? Number(amountMatch[1].replace(",", "."))
      : NaN;
    const amountBobs =
      Number.isFinite(parsedAmount) && parsedAmount > 0
        ? parsedAmount
        : Math.max(1, Math.min(500, active.accumulatedBobs || 300));
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
    scheduleGoalAnalysis(goal, input.channel, input.externalChatId);
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
    } else {
      replies = [
        {
          type: "text",
          text: "No reconozco esa acción. Pedime que la prepare de nuevo.",
        },
      ];
    }
    await persistUserMessage(session.id, input.callbackData);
    await persistAssistantReplies(session.id, replies);
    return { sessionId: session.id, replies };
  }

  if (!ai.hasAnyProvider()) {
    await persistUserMessage(session.id, input.text);
    return heuristicTurn(input, session.id);
  }

  // El historial se lee antes de persistir el mensaje nuevo para no duplicarlo.
  const prior = await loadHistoryForLlm(session.id);
  await persistUserMessage(session.id, input.text);

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...prior,
    { role: "user", content: input.text ?? "" },
  ];

  const finish = async (content: string) => {
    const replies: AgentReply[] = [
      {
        type: "text",
        text: content,
        buttons: extractButtons(content, messages),
      },
    ];
    await persistAssistantReplies(session.id, replies);
    return { sessionId: session.id, replies };
  };

  const deadline = Date.now() + TURN_BUDGET_MS;
  const remainingBudget = () =>
    Math.max(1_000, Math.min(PROVIDER_TIMEOUT_MS, deadline - Date.now()));

  const maxRounds = 4;
  let toolsEnabled = true;

  try {
    for (let round = 0; round < maxRounds; round++) {
      let completion;
      try {
        completion = await ai.chat(messages, {
          tools: toolsEnabled ? agentTools : undefined,
          signal: AbortSignal.timeout(remainingBudget()),
        });
      } catch (err) {
        if (toolsEnabled && isToolCallRejection(err)) {
          console.warn(
            "[finora] el proveedor rechazó la tool call; reintento sin tools",
          );
          toolsEnabled = false;
          continue;
        }
        throw err;
      }

      const msg = completion.message;
      if (!msg) break;

      if (msg.tool_calls?.length) {
        messages.push(msg);
        for (const call of msg.tool_calls) {
          if (call.type !== "function") continue;
          const result = await executeToolCall(
            input,
            call.function.name,
            call.function.arguments,
          );
          messages.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify(result),
          });
        }
        continue;
      }

      const content =
        typeof msg.content === "string" && msg.content.trim()
          ? msg.content
          : msg.content
            ? JSON.stringify(msg.content)
            : "Listo.";
      return finish(content);
    }

    // Se agotaron las rondas sin respuesta en texto (o el completion vino
    // vacío). Forzamos una última llamada sin tools para que el usuario reciba
    // el resultado de lo que ya se preparó en este turno.
    const closing = await ai.chat(
      [
        ...messages,
        {
          role: "user",
          content:
            "Resumí en español, en dos frases y sin usar herramientas, qué dejaste preparado y qué necesitás de mí.",
        },
      ],
      { signal: AbortSignal.timeout(remainingBudget()) },
    );
    const closingText =
      typeof closing.message.content === "string" &&
      closing.message.content.trim()
        ? closing.message.content
        : "Dejé la acción preparada. Confirmala cuando quieras.";
    return finish(closingText);
  } catch (err) {
    // Último recurso: mentor heurístico local. Es preferible una respuesta útil
    // sin IA que devolverle un error al usuario en Telegram o en la web.
    const detail =
      err instanceof AllProvidersFailedError
        ? `ningún proveedor respondió: ${err.message.slice(0, 280)}`
        : err instanceof Error
          ? err.message.slice(0, 280)
          : "error desconocido";
    console.error(`[finora] IA no disponible (${detail}); uso mentor heurístico`);
    return heuristicTurn(input, session.id);
  }
}
