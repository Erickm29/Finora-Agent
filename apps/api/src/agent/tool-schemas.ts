import type OpenAI from "openai";
import { z } from "zod";

/**
 * Los proveedores OpenAI-compatibles (Groq entre ellos) validan los argumentos
 * de las tool calls contra estos schemas del lado del servidor y devuelven 400
 * si el modelo emite un monto como string ("850" en lugar de 850). Aceptamos
 * ambas formas en el JSON Schema y normalizamos con Zod en `validateToolArgs`,
 * que es la única frontera donde los datos del modelo se vuelven confiables.
 */
const numberOrString = ["number", "string"] as const;

const amountBobs = z.coerce
  .number({ invalid_type_error: "debe ser un monto numérico en Bs" })
  .finite("debe ser un monto finito")
  .positive("debe ser mayor a 0");

const months = z.coerce
  .number({ invalid_type_error: "debe ser un número de meses" })
  .int("debe ser un número entero de meses")
  .positive("debe ser mayor a 0")
  .max(600, "no puede superar 600 meses");

const nonEmptyText = z.string().trim().min(1, "no puede estar vacío");

const goalId = z
  .string()
  .trim()
  .uuid("debe ser el id (uuid) de una meta existente; usá get_active_goal para obtenerlo");

const schemas = {
  research_product_price: z.object({ query: nonEmptyText }),
  research_macro_context: z.object({ query: nonEmptyText }),
  create_or_update_goal: z.object({
    name: nonEmptyText,
    target_amount_bobs: amountBobs,
    target_months: months,
    // Opcional a propósito: si el modelo no la manda, se deriva del monto y el
    // plazo en lugar de fallar el turno.
    base_monthly_bobs: amountBobs.optional(),
  }),
  get_active_goal: z.object({}),
  suggest_microsaving: z.object({
    goal_id: goalId,
    amount_bobs: amountBobs,
    note: nonEmptyText.optional(),
  }),
  evaluate_withdrawal_guardrail: z.object({
    goal_id: goalId,
    amount_bobs: amountBobs,
  }),
  prepare_wallbit_conversion: z.object({
    goal_id: goalId.nullish(),
    amount_bobs: amountBobs,
    to: nonEmptyText.default("USD"),
  }),
  lookup_asset_price: z.object({
    symbol: z
      .string()
      .trim()
      .min(1, "indicá el ticker")
      .max(16, "ticker demasiado largo")
      .transform((s) => s.toUpperCase().replace(/[^A-Z0-9.\-]/g, ""))
      .refine((s) => s.length > 0, "indicá un ticker válido (ej. NVDA)"),
  }),
  generate_voice_summary: z.object({ text: nonEmptyText }),
} satisfies Record<string, z.ZodTypeAny>;

export type ToolName = keyof typeof schemas;

export type ToolArgs<N extends ToolName> = z.infer<(typeof schemas)[N]>;

export function isKnownTool(name: string): name is ToolName {
  return Object.hasOwn(schemas, name);
}

export type ToolValidation =
  | { ok: true; name: ToolName; args: Record<string, unknown> }
  | { ok: false; error: string };

/**
 * Valida y normaliza los argumentos que emitió el modelo. Devuelve un error
 * legible en lugar de lanzar, para que el runtime pueda dárselo al LLM como
 * resultado de tool y darle la oportunidad de corregirse.
 */
export function validateToolArgs(
  name: string,
  raw: unknown,
): ToolValidation {
  if (!isKnownTool(name)) {
    return { ok: false, error: `La herramienta "${name}" no existe.` };
  }
  const parsed = schemas[name].safeParse(raw ?? {});
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(raíz)"}: ${i.message}`)
      .join("; ");
    return { ok: false, error: `Argumentos inválidos para ${name} — ${detail}` };
  }
  return { ok: true, name, args: parsed.data as Record<string, unknown> };
}

export const agentTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
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
          target_amount_bobs: {
            type: numberOrString,
            description: "Monto total de la meta en Bs (ej. 8500)",
          },
          target_months: {
            type: numberOrString,
            description: "Plazo en meses (ej. 10)",
          },
          base_monthly_bobs: {
            type: numberOrString,
            description:
              "Cuota mensual base en Bs. Si la omitís se calcula como monto / meses.",
          },
        },
        required: ["name", "target_amount_bobs", "target_months"],
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
          goal_id: { type: "string", description: "uuid de la meta" },
          amount_bobs: {
            type: numberOrString,
            description: "Monto del microahorro en Bs (ej. 200)",
          },
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
          goal_id: { type: "string", description: "uuid de la meta" },
          amount_bobs: {
            type: numberOrString,
            description: "Monto del retiro en Bs",
          },
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
          goal_id: { type: "string", description: "uuid de la meta (opcional)" },
          amount_bobs: {
            type: numberOrString,
            description: "Monto a convertir en Bs",
          },
          to: { type: "string", description: "Divisa destino (default USD)" },
        },
        required: ["amount_bobs"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_asset_price",
      description:
        "Cotización de una acción/ETF vía Wallbit (solo lectura). Usala cuando el usuario pregunta el precio de un ticker (NVDA, AAPL, etc.).",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "Ticker bursátil, ej. NVDA o AAPL",
          },
        },
        required: ["symbol"],
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
