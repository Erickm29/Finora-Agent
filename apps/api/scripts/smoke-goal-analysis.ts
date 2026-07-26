/**
 * Smoke del pipeline de análisis de inversión.
 *
 * Cubre los seis pasos: búsqueda paralela en Firecrawl/Exa, normalización y
 * dedupe, razonamiento del agente, escenarios, plan justificado y caché.
 * También comprueba que un segundo análisis reutilice el snapshot cacheado.
 *
 * Uso: npx tsx apps/api/scripts/smoke-goal-analysis.ts
 */
import { randomUUID } from "node:crypto";
import { getGoalAnalysisService, services } from "../src/container.js";
import { formatAnalysisForChat } from "../src/analysis/format.js";

let failures = 0;

function check(label: string, condition: boolean, detail?: unknown) {
  if (condition) {
    console.log(`  ok   ${label}`);
    return;
  }
  failures++;
  console.error(`  FAIL ${label}`, detail ?? "");
}

async function main() {
  const svc = services();
  const analysisService = getGoalAnalysisService();
  const userId = randomUUID();

  console.log("1. Se crea la meta (como lo haría la web o el bot)");
  await svc.repos.profiles.ensure(userId);
  const goal = await svc.goals.create(userId, {
    name: "Laptop para la universidad",
    target_amount_bobs: 12000,
    target_months: 8,
    base_monthly_bobs: 1500,
  });
  check("la meta se creó", Boolean(goal.id));

  console.log("\n2. Primera corrida del pipeline (sin caché)");
  const started = Date.now();
  const first = await analysisService.ensureFresh(goal, { force: true });
  const firstMs = Date.now() - started;
  console.log(`   duró ${(firstMs / 1000).toFixed(1)}s`);

  check("devolvió un análisis", Boolean(first));
  check("quedó en estado ready", first?.status === "ready", first?.status);
  check("tiene contenido", Boolean(first?.content));
  check(
    "razonó sobre la economía",
    Boolean(first?.content?.economicSummary?.length),
  );
  check(
    "proyectó al menos un escenario",
    (first?.content?.scenarios.length ?? 0) > 0,
  );
  check(
    "cada recomendación trae su razonamiento",
    (first?.content?.recommendations.length ?? 0) > 0 &&
      (first?.content?.recommendations ?? []).every((r) => r.rationale.trim().length > 0),
  );
  console.log(
    `   cobertura: ${first?.content?.dataCoverage}, fuentes: ${first?.sources.length}, proveedor: ${first?.provider ?? "fallback"}`,
  );

  console.log("\n3. Segunda meta: debe reutilizar los snapshots cacheados");
  const goal2 = await svc.goals.create(userId, {
    name: "Fondo de emergencia",
    target_amount_bobs: 6000,
    target_months: 6,
    base_monthly_bobs: 1000,
  });
  const secondStart = Date.now();
  const second = await analysisService.ensureFresh(goal2, { force: true });
  const secondMs = Date.now() - secondStart;
  console.log(`   duró ${(secondMs / 1000).toFixed(1)}s`);
  check("la segunda meta también tiene análisis", second?.status === "ready");

  console.log("\n4. Reutilización sin regenerar (Paso 6)");
  const cachedStart = Date.now();
  const cached = await analysisService.ensureFresh(goal);
  const cachedMs = Date.now() - cachedStart;
  check(
    "el análisis reciente se reutiliza en vez de regenerarse",
    cachedMs < 1000,
    `${cachedMs}ms`,
  );
  check(
    "es el mismo análisis",
    cached?.generatedAt === first?.generatedAt,
  );

  console.log("\n5. Lectura desde el dashboard");
  const fromDashboard = await analysisService.get(userId, goal.id);
  check("el dashboard lee el análisis guardado", Boolean(fromDashboard?.content));

  if (first) {
    console.log("\n--- mensaje que recibiría el usuario en Telegram ---");
    console.log(formatAnalysisForChat(goal, first));
    console.log("--- fin del mensaje ---");
  }

  console.log(`\n${failures === 0 ? "SMOKE OK" : `SMOKE CON ${failures} FALLOS`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("smoke falló", err);
  process.exit(1);
});
