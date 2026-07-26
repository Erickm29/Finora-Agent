/**
 * Smoke Track C: market context Wallbit + setPrimary + soft cancel.
 *
 * Uso: npx tsx apps/api/scripts/smoke-market-wallbit.ts
 */
import { randomUUID } from "node:crypto";
import { services } from "../src/container.js";
import { getMarketContext } from "../src/analysis/market-context.js";

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
  console.log("1. GET market context (Wallbit + macro)");
  const ctx = await getMarketContext();
  console.log(
    `   source=${ctx.source} stub=${ctx.stub} insights=${ctx.insights.length} wallbitErrors=${ctx.wallbit.errors.length}`,
  );
  check("devolvió insights", ctx.insights.length > 0);
  check("objeto wallbit presente", Boolean(ctx.wallbit));

  console.log("\n2. setPrimary + getPrimary");
  const svc = services();
  const userId = randomUUID();
  await svc.repos.profiles.ensure(userId);
  const g1 = await svc.goals.create(userId, {
    name: "Meta A",
    target_amount_bobs: 1000,
    target_months: 2,
    base_monthly_bobs: 500,
  });
  const g2 = await svc.goals.create(userId, {
    name: "Meta B",
    target_amount_bobs: 2000,
    target_months: 4,
    base_monthly_bobs: 500,
  });
  await svc.goals.setPrimary(userId, g2.id);
  const primary = await svc.goals.getPrimary(userId);
  check("primary es Meta B", primary?.id === g2.id, primary?.name);
  const listed = await svc.goals.list(userId);
  const a = listed.find((g) => g.id === g1.id);
  check("Meta A ya no es primary", !a?.metadata?.is_primary);

  console.log("\n3. soft cancel");
  await svc.goals.cancel(userId, g1.id);
  const cancelled = await svc.goals.get(userId, g1.id);
  check("status cancelled", cancelled.status === "cancelled");
  const primaryAfter = await svc.goals.getPrimary(userId);
  check("primary sigue siendo B", primaryAfter?.id === g2.id);

  console.log(`\n${failures === 0 ? "SMOKE OK" : `SMOKE CON ${failures} FALLOS`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("smoke falló", err);
  process.exit(1);
});
