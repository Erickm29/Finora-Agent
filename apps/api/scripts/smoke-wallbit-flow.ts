/**
 * Smoke del flujo Wallbit prepare → confirm (×2) → stub honesto.
 *
 * Uso: npx tsx apps/api/scripts/smoke-wallbit-flow.ts
 */
import { randomUUID } from "node:crypto";
import { services } from "../src/container.js";

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
  const userId = randomUUID();
  await svc.repos.profiles.ensure(userId);

  console.log("1. Meta + prepare Wallbit");
  const goal = await svc.goals.create(userId, {
    name: "Smoke Wallbit",
    target_amount_bobs: 5000,
    target_months: 5,
    base_monthly_bobs: 1000,
  });
  const action = await svc.pendingActions.prepareWallbitConvert({
    userId,
    goalId: goal.id,
    amountBobs: 400,
    channel: "telegram",
  });
  check("acción pending", action.status === "pending");

  console.log("\n2. Primera confirmación (stub)");
  const first = await svc.pendingActions.confirm(userId, action.id);
  check("quedó confirmed", first.action.status === "confirmed");
  check("marcó stub", first.execution?.stub === true, first.execution);
  check(
    "mensaje honesto",
    Boolean(first.execution?.message?.toLowerCase().includes("pendiente")),
    first.execution?.message,
  );
  const afterFirst = await svc.goals.get(userId, goal.id);
  check("no movió saldo de la meta", afterFirst.accumulatedBobs === 0);

  console.log("\n3. Segunda confirmación (idempotente)");
  const second = await svc.pendingActions.confirm(userId, action.id);
  check("idempotent=true", second.idempotent === true);
  const afterSecond = await svc.goals.get(userId, goal.id);
  check("saldo sigue en 0", afterSecond.accumulatedBobs === 0);

  console.log("\n4. Microahorro: confirmar 2 veces no duplica");
  const micro = await svc.microsavings.suggest({
    userId,
    goalId: goal.id,
    amountBobs: 150,
    channel: "web",
  });
  await svc.pendingActions.confirm(userId, micro.id);
  await svc.pendingActions.confirm(userId, micro.id);
  const afterMicro = await svc.goals.get(userId, goal.id);
  check("aporte una sola vez", afterMicro.accumulatedBobs === 150, afterMicro.accumulatedBobs);

  console.log(`\n${failures === 0 ? "SMOKE OK" : `SMOKE CON ${failures} FALLOS`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("smoke falló", err);
  process.exit(1);
});
