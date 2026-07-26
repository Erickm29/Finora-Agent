import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { withdrawalDelayMonths } from "@finora/shared";
import { GuardrailsService } from "./guardrails-service.js";
import { GoalsService } from "./goals-service.js";
import { MicrosavingsService } from "./microsavings-service.js";
import { PendingActionsService } from "./pending-actions-service.js";
import { createInMemoryRepos } from "./memory.js";

describe("withdrawalDelayMonths", () => {
  it("estimates delay when withdrawing from progress", () => {
    const delay = withdrawalDelayMonths({
      amountBobs: 1700,
      remainingBobs: 7300,
      baseMonthlyBobs: 850,
    });
    assert.equal(delay, 2);
  });
});

describe("PendingActionsService", () => {
  it("confirms microsaving and updates accumulated", async () => {
    const repos = createInMemoryRepos();
    const goals = new GoalsService(repos);
    const pending = new PendingActionsService(repos);
    const micro = new MicrosavingsService(repos);
    const userId = "11111111-1111-1111-1111-111111111111";

    const goal = await goals.create(userId, {
      name: "Laptop",
      target_amount_bobs: 8500,
      target_months: 10,
      base_monthly_bobs: 850,
    });

    const action = await micro.suggest({
      userId,
      goalId: goal.id,
      amountBobs: 200,
      channel: "telegram",
      note: "Margen post-sueldo",
    });

    await pending.confirm(userId, action.id);
    const updated = await goals.get(userId, goal.id);
    assert.equal(updated.accumulatedBobs, 200);
    assert.equal(updated.progressRatio, 200 / 8500);

    // Segunda confirmación: no debe duplicar el aporte.
    const second = await pending.confirm(userId, action.id);
    assert.equal(second.idempotent, true);
    const still = await goals.get(userId, goal.id);
    assert.equal(still.accumulatedBobs, 200);
  });

  it("wallbit confirm reports stub without moving goal balance", async () => {
    const repos = createInMemoryRepos();
    const goals = new GoalsService(repos);
    const pending = new PendingActionsService(repos);
    const userId = "44444444-4444-4444-4444-444444444444";
    const goal = await goals.create(userId, {
      name: "Fondo",
      target_amount_bobs: 3000,
      target_months: 3,
      base_monthly_bobs: 1000,
    });
    const action = await pending.prepareWallbitConvert({
      userId,
      goalId: goal.id,
      amountBobs: 500,
      channel: "telegram",
    });
    const result = await pending.confirm(userId, action.id);
    assert.equal(result.action.status, "confirmed");
    assert.equal(result.execution?.stub, true);
    const still = await goals.get(userId, goal.id);
    assert.equal(still.accumulatedBobs, 0);
  });

  it("cancels pending action without changing balance", async () => {
    const repos = createInMemoryRepos();
    const goals = new GoalsService(repos);
    const pending = new PendingActionsService(repos);
    const userId = "22222222-2222-2222-2222-222222222222";
    const goal = await goals.create(userId, {
      name: "Viaje",
      target_amount_bobs: 5000,
      target_months: 5,
      base_monthly_bobs: 1000,
    });
    const action = await pending.prepareWallbitConvert({
      userId,
      goalId: goal.id,
      amountBobs: 300,
      channel: "web",
    });
    await pending.cancel(userId, action.id);
    const still = await goals.get(userId, goal.id);
    assert.equal(still.accumulatedBobs, 0);
  });
});

describe("GuardrailsService", () => {
  it("returns delay message for withdrawal", async () => {
    const repos = createInMemoryRepos();
    const goals = new GoalsService(repos);
    const guardrails = new GuardrailsService(repos);
    const userId = "33333333-3333-3333-3333-333333333333";
    const goal = await goals.create(userId, {
      name: "MacBook",
      target_amount_bobs: 8500,
      target_months: 10,
      base_monthly_bobs: 850,
    });
    await repos.goals.update(userId, goal.id, { accumulatedBobs: 1200 });
    const result = await guardrails.evaluateWithdrawal({
      userId,
      goalId: goal.id,
      amountBobs: 850,
    });
    assert.ok(result.delayMonths >= 1);
    assert.match(result.message, /retrasará/);
  });
});
