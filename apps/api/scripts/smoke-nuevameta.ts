/**
 * Smoke: create goal + ensureFresh + formatAnalysisForChat (path de /nuevameta).
 *
 * Uso: npx tsx apps/api/scripts/smoke-nuevameta.ts
 */
import { randomUUID } from "node:crypto";
import { services, getGoalAnalysisService } from "../src/container.js";
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
  const userId = randomUUID();
  await services().repos.profiles.ensure(userId);

  console.log("1. create goal");
  const goal = await services().goals.create(userId, {
    name: "Smoke Laptop NuevaMeta",
    target_amount_bobs: 8500,
    target_months: 10,
    base_monthly_bobs: 850,
  });
  check("goal creada", Boolean(goal.id), goal.id);

  console.log("2. ensureFresh análisis (puede tardar)");
  const analysis = await getGoalAnalysisService().ensureFresh(goal, {
    force: true,
  });
  check("análisis ready o failed (no pending eterno)", analysis.status !== "pending", analysis.status);

  if (analysis.status === "ready" && analysis.content) {
    const text = formatAnalysisForChat(goal, analysis);
    console.log("---\n" + text.slice(0, 500) + "\n---");
    check("incluye plan", text.includes("Mi plan para vos"));
    check("menciona la meta", text.includes(goal.name));
  } else {
    console.log("   análisis no ready:", analysis.status);
    check(
      "al menos no crasheó",
      analysis.status === "failed" || analysis.status === "ready",
    );
  }

  console.log(`\n${failures === 0 ? "SMOKE NUEVAMETA OK" : `SMOKE CON ${failures} FALLOS`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("smoke falló", err);
  process.exit(1);
});
