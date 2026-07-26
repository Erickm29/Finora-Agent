import { z } from "zod";
import type {
  DomainRepos,
  EconomicSource,
  Goal,
  InvestmentAnalysis,
  InvestmentAnalysisContent,
} from "@finora/domain";
import { ai } from "../ai/index.js";
import { env } from "../env.js";
import {
  collectEconomicContext,
  type EconomicResearchResult,
} from "./economic-research.js";

const AI_TIMEOUT_MS = 45_000;

/** Aporte mínimo con sentido: por debajo asumimos que el modelo se confundió. */
const MIN_RECOMMENDED_BOBS = 5;

/**
 * El modelo inventa cadencias fuera del enum ("semestral", "periódico"). Antes
 * eso invalidaba el análisis entero, así que normalizamos y caemos a null.
 */
const CadenceSchema = z.unknown().transform((v) => {
  const raw = typeof v === "string" ? v.toLowerCase().trim() : "";
  if (!raw) return null;
  if (raw.startsWith("seman")) return "semanal" as const;
  if (raw.startsWith("quincen")) return "quincenal" as const;
  if (raw.startsWith("mensual") || raw.startsWith("mes")) return "mensual" as const;
  if (raw.startsWith("unica") || raw.startsWith("única") || raw.includes("una vez")) {
    return "unica" as const;
  }
  return null;
});

const AmountSchema = z
  .union([z.number(), z.string()])
  .nullish()
  .transform((v) => {
    if (v === null || v === undefined || v === "") return null;
    const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d.-]/g, ""));
    if (!Number.isFinite(n) || n < MIN_RECOMMENDED_BOBS) return null;
    return Math.round(n);
  });

const ScenarioSchema = z.object({
  name: z.string().min(1),
  likelihood: z.enum(["alta", "media", "baja"]).catch("media"),
  description: z.string().min(1),
  impactOnGoal: z.string().min(1),
});

const RecommendationSchema = z.object({
  action: z.string().min(1),
  rationale: z.string().min(1),
  amountBobs: AmountSchema,
  cadence: CadenceSchema,
});

const AiContentSchema = z.object({
  economicSummary: z.string().min(1),
  scenarios: z.array(ScenarioSchema).min(1).max(5),
  recommendations: z.array(RecommendationSchema).min(1).max(6),
  risks: z.array(z.string().min(1)).max(6).default([]),
  confidence: z.enum(["alta", "media", "baja"]).catch("media"),
});

const SYSTEM_PROMPT = `Sos el analista de inversiones de Finora, un mentor financiero para Bolivia.
Trabajás en pesos bolivianos (Bs / BOB) y con la realidad económica boliviana.

Tu trabajo tiene tres partes:
1. ANALIZAR la situación económica a partir de las fuentes entregadas: comportamiento
   reciente del dólar, inflación, tasas, mercados, riesgos. Razoná sobre las noticias,
   no las resumas.
2. PROYECTAR entre 2 y 4 escenarios futuros probables (el boliviano se deprecia
   frente al dólar, el tipo de cambio se estabiliza, la inflación se acelera,
   hay volatilidad). Son ESCENARIOS, nunca hechos: usá lenguaje condicional
   ("si se mantiene", "es probable que", "en caso de").
   "impactOnGoal" es una frase completa que explica el efecto concreto sobre ESTA
   meta, citando el monto o el plazo. Nunca respondas con una sola palabra como
   "Negativo" o "Positivo".
3. RECOMENDAR entre 2 y 4 acciones concretas para la meta del usuario: ahorrar en
   bolivianos, convertir parte a dólares, cadencia semanal o mensual, diversificar,
   mantener liquidez, esperar una fecha. Cada recomendación lleva SU razonamiento
   atado al análisis económico.

Contexto local que no podés confundir:
- Bs = pesos bolivianos (BOB). El riesgo cambiario acá es que el boliviano pierda
  valor frente al dólar: si el dólar sube, tu meta en Bs compra menos y los bienes
  importados se encarecen. Nunca digas lo contrario.

Reglas duras:
- No inventes cifras, precios ni tipos de cambio que no estén en las fuentes.
- "amountBobs" es el MONTO en bolivianos del aporte (por ejemplo 1500), nunca una
  cantidad de veces ni un porcentaje. Si no corresponde un monto, poné null.
- "cadence" solo admite: unica, semanal, quincenal o mensual. Si ninguna aplica, null.
- Si no hay fuentes recientes, decilo explícitamente y basá el plan en la aritmética
  de la meta y en principios financieros generales.
- Preparás recomendaciones; nunca ejecutás dinero. Toda conversión necesita
  confirmación humana posterior.
- Nada de paternalismo: informás impacto y dejás la decisión al usuario.

Respondé ÚNICAMENTE con un objeto JSON válido, sin markdown ni texto alrededor:
{
  "economicSummary": "análisis razonado de la situación, 3-5 frases",
  "scenarios": [{ "name": "...", "likelihood": "alta|media|baja", "description": "...", "impactOnGoal": "cómo afecta esta meta puntual" }],
  "recommendations": [{ "action": "...", "rationale": "...", "amountBobs": 500, "cadence": "unica|semanal|quincenal|mensual" }],
  "risks": ["..."],
  "confidence": "alta|media|baja"
}`;

function buildUserPrompt(
  goal: Goal,
  research: EconomicResearchResult,
): string {
  const monthly = Math.max(
    1,
    Math.ceil(
      (goal.targetAmountBobs - goal.accumulatedBobs) /
        Math.max(1, goal.targetMonths),
    ),
  );

  const sourcesBlock = research.sources.length
    ? research.sources
        .map(
          (s, i) =>
            `${i + 1}. [${s.provider}] ${s.title}${s.url ? ` (${s.url})` : ""}${
              s.snippet ? `\n   ${s.snippet}` : ""
            }`,
        )
        .join("\n")
    : "NO SE PUDO OBTENER INFORMACIÓN ECONÓMICA RECIENTE. Declaralo explícitamente en economicSummary, marcá confidence en \"baja\" y armá el plan solo con la aritmética de la meta y principios financieros generales.";

  return `META DEL USUARIO
- Nombre: ${goal.name}
- Monto objetivo: Bs ${goal.targetAmountBobs.toLocaleString("es-BO")}
- Ya acumulado: Bs ${goal.accumulatedBobs.toLocaleString("es-BO")}
- Plazo: ${goal.targetMonths} meses
- Aporte mensual base declarado: Bs ${goal.baseMonthlyBobs.toLocaleString("es-BO")}
- Aporte mensual necesario según aritmética simple: Bs ${monthly.toLocaleString("es-BO")}
- Perfil / notas: ${JSON.stringify(goal.metadata ?? {})}

COBERTURA DE DATOS: ${research.coverage}

FUENTES ECONÓMICAS RECIENTES
${sourcesBlock}`;
}

function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced?.[1]?.trim() ?? trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return body;
  return body.slice(start, end + 1);
}

/**
 * Plan determinista de respaldo: si la IA no responde el usuario igual recibe
 * un plan honesto en vez de un error.
 */
function buildFallbackContent(
  goal: Goal,
  research: EconomicResearchResult,
): InvestmentAnalysisContent {
  const remaining = Math.max(0, goal.targetAmountBobs - goal.accumulatedBobs);
  const months = Math.max(1, goal.targetMonths);
  const monthly = Math.max(1, Math.ceil(remaining / months));
  const weekly = Math.max(1, Math.ceil(monthly / 4));

  return {
    economicSummary:
      "No pudimos completar el análisis económico automático en este momento, así que este plan se basa únicamente en la aritmética de tu meta. Lo vamos a actualizar apenas tengamos datos recientes del dólar y la inflación.",
    scenarios: [
      {
        name: "Escenario base",
        likelihood: "media",
        description:
          "Si el tipo de cambio y los precios se mantienen estables, el aporte constante alcanza para llegar en el plazo previsto.",
        impactOnGoal: `Necesitás sostener Bs ${monthly.toLocaleString("es-BO")} por mes durante ${months} meses.`,
      },
      {
        name: "Escenario de inflación",
        likelihood: "media",
        description:
          "Si los precios suben, el monto objetivo podría quedarse corto frente al costo real de tu meta.",
        impactOnGoal:
          "Conviene revisar el monto objetivo cada dos meses y ajustar el aporte si el precio se movió.",
      },
    ],
    recommendations: [
      {
        action: `Apartar Bs ${monthly.toLocaleString("es-BO")} cada mes`,
        rationale: `Es lo que hace falta para cubrir los Bs ${remaining.toLocaleString("es-BO")} que te quedan en ${months} meses.`,
        amountBobs: monthly,
        cadence: "mensual",
      },
      {
        action: `Dividirlo en microahorros de Bs ${weekly.toLocaleString("es-BO")} por semana`,
        rationale:
          "Repartir el esfuerzo en aportes chicos duele menos que un solo débito grande a fin de mes.",
        amountBobs: weekly,
        cadence: "semanal",
      },
    ],
    risks: [
      "El plan no considera noticias económicas recientes porque no pudimos consultarlas.",
    ],
    confidence: "baja",
    dataCoverage: research.coverage,
  };
}

export type AnalysisNotifier = (
  analysis: InvestmentAnalysis,
  goal: Goal,
) => void | Promise<void>;

/**
 * Pipeline único de análisis de inversión, consumido tanto por el bot de
 * Telegram como por el dashboard web. Nunca propaga errores al llamador:
 * el peor caso es un análisis de respaldo o un registro en estado `failed`.
 */
export class GoalInvestmentAnalysisService {
  /** Evita disparar dos veces el mismo pipeline para una meta. */
  private readonly inFlight = new Set<string>();

  constructor(private readonly repos: DomainRepos) {}

  async get(userId: string, goalId: string) {
    return this.repos.goalAnalyses.getByGoal(userId, goalId);
  }

  private isFresh(analysis: InvestmentAnalysis | null): boolean {
    if (!analysis || analysis.status !== "ready" || !analysis.generatedAt) {
      return false;
    }
    const age = Date.now() - new Date(analysis.generatedAt).getTime();
    return age <= env.analysisTtlMs;
  }

  /**
   * Punto de entrada de ambos canales: no bloquea la creación de la meta.
   * El resultado se persiste y el dashboard lo consulta cuando esté listo.
   */
  schedule(goal: Goal, notify?: AnalysisNotifier): void {
    if (!env.goalAnalysisEnabled) {
      console.info("[Analysis] Deshabilitado por GOAL_ANALYSIS_ENABLED=false.");
      return;
    }
    void this.ensureFresh(goal, { notify }).catch((err) => {
      console.error("[Analysis] Fallo no controlado en el pipeline:", err);
    });
  }

  /** Reutiliza el análisis reciente (Paso 6) o corre el pipeline completo. */
  async ensureFresh(
    goal: Goal,
    options: { force?: boolean; notify?: AnalysisNotifier } = {},
  ): Promise<InvestmentAnalysis | null> {
    if (this.inFlight.has(goal.id)) {
      console.info(`[Analysis] Ya hay un análisis en curso para ${goal.id}.`);
      return this.get(goal.userId, goal.id);
    }

    if (!options.force) {
      const existing = await this.get(goal.userId, goal.id).catch(() => null);
      if (this.isFresh(existing)) {
        console.info(
          `[Analysis] Reutilizando análisis reciente de la meta ${goal.id}.`,
        );
        return existing;
      }
    }

    this.inFlight.add(goal.id);
    try {
      await this.markPending(goal);
      const analysis = await this.run(goal);
      if (analysis && options.notify) {
        await Promise.resolve(options.notify(analysis, goal)).catch((err) => {
          console.warn("[Analysis] No se pudo notificar el análisis:", err);
        });
      }
      return analysis;
    } finally {
      this.inFlight.delete(goal.id);
    }
  }

  private async markPending(goal: Goal) {
    try {
      const existing = await this.repos.goalAnalyses.getByGoal(
        goal.userId,
        goal.id,
      );
      // Conservamos el análisis anterior mientras se regenera.
      if (existing?.status === "ready") return;
      await this.repos.goalAnalyses.upsert({
        goalId: goal.id,
        userId: goal.userId,
        status: "pending",
      });
    } catch (err) {
      console.warn("[Analysis] No se pudo marcar el análisis como pendiente:", err);
    }
  }

  private async run(goal: Goal): Promise<InvestmentAnalysis | null> {
    console.info(`[Analysis] Iniciando análisis para la meta "${goal.name}".`);

    // Pasos 1 y 2.
    const research = await collectEconomicContext(this.repos).catch((err) => {
      console.error("[Analysis] Investigación económica falló por completo:", err);
      return {
        sources: [] as EconomicSource[],
        coverage: "sin-fuentes" as const,
        usedProviders: [],
        cachedProviders: [],
        failures: [],
      } satisfies EconomicResearchResult;
    });

    // Pasos 3, 4 y 5.
    const generated = await this.reason(goal, research);

    const content: InvestmentAnalysisContent =
      generated?.content ?? buildFallbackContent(goal, research);

    console.info("[Analysis] Recommendation generated.");

    try {
      return await this.repos.goalAnalyses.upsert({
        goalId: goal.id,
        userId: goal.userId,
        status: "ready",
        content,
        sources: research.sources,
        provider: generated?.provider ?? null,
        model: generated?.model ?? null,
        error: generated ? null : "El análisis con IA no estuvo disponible.",
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[Analysis] No se pudo guardar el análisis:", err);
      return null;
    }
  }

  /** Pasos 3-5: el agente razona y arma el plan. Devuelve null si no pudo. */
  private async reason(
    goal: Goal,
    research: EconomicResearchResult,
  ): Promise<
    { content: InvestmentAnalysisContent; provider: string; model: string } | null
  > {
    if (!ai.hasAnyProvider()) {
      console.warn("[Analysis] Sin proveedores de IA configurados.");
      return null;
    }

    console.info("[Analysis] AI reasoning...");
    try {
      const result = await ai.chat(
        [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(goal, research) },
        ],
        { signal: AbortSignal.timeout(AI_TIMEOUT_MS) },
      );

      const raw = result.message.content;
      const text = typeof raw === "string" ? raw : "";
      if (!text.trim()) {
        console.warn("[Analysis] La IA devolvió una respuesta vacía.");
        return null;
      }

      const parsed = AiContentSchema.safeParse(JSON.parse(stripJsonFences(text)));
      if (!parsed.success) {
        console.warn(
          "[Analysis] JSON de la IA fuera de contrato:",
          parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
        );
        return null;
      }

      return {
        content: { ...parsed.data, dataCoverage: research.coverage },
        provider: result.provider,
        model: result.model,
      };
    } catch (err) {
      console.warn(
        "[Analysis] El razonamiento con IA falló:",
        err instanceof Error ? err.message : err,
      );
      return null;
    }
  }
}
