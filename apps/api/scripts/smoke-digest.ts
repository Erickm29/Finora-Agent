/**
 * Smoke Track B: preferencias → digest force → pending rico → confirm ×2.
 *
 * Uso: npx tsx apps/api/scripts/smoke-digest.ts
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { services } from "../src/container.js";
import { runDigestPass } from "../src/jobs/digest-scheduler.js";

const userId = randomUUID();

async function main() {
  const svc = services();
  await svc.repos.profiles.ensure(userId);

  console.log("1. PATCH preferencias digest");
  const prefs = await svc.preferences.patch(userId, {
    digest_enabled: true,
    digest_local_time: "08:00",
    timezone: "America/La_Paz",
  });
  assert.equal(prefs.digest_enabled, true);
  console.log("  ok   preferences", prefs.digest_local_time);

  console.log("2. Crear meta primaria");
  const goal = await svc.goals.create(userId, {
    name: "Smoke Laptop",
    target_amount_bobs: 8500,
    target_months: 10,
    base_monthly_bobs: 850,
  });
  await svc.goals.setPrimary(userId, goal.id);
  console.log("  ok   goal", goal.id);

  console.log("3. Forzar digest");
  const run = await runDigestPass({ userId, force: true });
  assert.ok(run.prepared >= 1, `expected prepared>=1 got ${JSON.stringify(run)}`);
  const actionId = run.actionIds[0];
  assert.ok(actionId);
  console.log("  ok   action", actionId);

  const pending = await svc.pendingActions.listPending(userId);
  const action = pending.find((a) => a.id === actionId);
  assert.ok(action);
  assert.equal(action.payload.digest, true);
  assert.ok(typeof action.payload.rationale === "string");
  assert.ok(Array.isArray(action.payload.risks));
  assert.ok(Array.isArray(action.payload.benefits));
  console.log("  ok   payload rico", action.kind, action.payload.title);

  console.log("4. Confirm ×2 (idempotente)");
  const first = await svc.pendingActions.confirm(userId, actionId);
  const second = await svc.pendingActions.confirm(userId, actionId);
  const settled =
    ("alreadySettled" in second && second.alreadySettled) ||
    ("idempotent" in second && Boolean((second as { idempotent?: boolean }).idempotent));
  assert.ok(settled, "segunda confirmación debe ser idempotente");
  assert.ok(first.action.status === "confirmed" || first.action);
  console.log("  ok   confirm idempotente");

  console.log("SMOKE_DIGEST OK");
}

main().catch((err) => {
  console.error("SMOKE_DIGEST FAIL", err);
  process.exit(1);
});
