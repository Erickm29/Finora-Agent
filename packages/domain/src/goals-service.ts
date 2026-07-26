import {
  FinoraError,
  progressRatio,
  type CreateGoalInput,
  type PatchGoalInput,
} from "@finora/shared";
import type { DomainRepos, Goal } from "./types.js";

export class GoalsService {
  constructor(private readonly repos: DomainRepos) {}

  async list(userId: string) {
    const goals = await this.repos.goals.listByUser(userId);
    return goals.map((g) => ({
      ...g,
      progressRatio: progressRatio(g.accumulatedBobs, g.targetAmountBobs),
    }));
  }

  async get(userId: string, goalId: string) {
    const goal = await this.repos.goals.getById(userId, goalId);
    if (!goal) throw new FinoraError("GOAL_NOT_FOUND", "Meta no encontrada", 404);
    return {
      ...goal,
      progressRatio: progressRatio(goal.accumulatedBobs, goal.targetAmountBobs),
    };
  }

  async create(userId: string, input: CreateGoalInput): Promise<Goal> {
    return this.repos.goals.create(userId, input);
  }

  async patch(userId: string, goalId: string, patch: PatchGoalInput) {
    const current = await this.get(userId, goalId);
    // `metadata` se mergea con lo existente: un patch parcial (p. ej. solo
    // `is_primary`) no debe borrar `category`/`currency` u otras claves ya
    // guardadas ahí.
    const merged: PatchGoalInput =
      patch.metadata !== undefined
        ? { ...patch, metadata: { ...current.metadata, ...patch.metadata } }
        : patch;
    return this.repos.goals.update(userId, goalId, merged);
  }

  /** Soft-delete: la meta deja de aparecer como activa. */
  async cancel(userId: string, goalId: string) {
    return this.patch(userId, goalId, { status: "cancelled" });
  }

  /**
   * Marca una meta como prioritaria en metadata y limpia el flag en las demás.
   * No toca metas ya cancelled.
   */
  async setPrimary(userId: string, goalId: string) {
    const target = await this.get(userId, goalId);
    if (target.status === "cancelled") {
      throw new FinoraError(
        "GOAL_CONFLICT",
        "No se puede priorizar una meta eliminada",
        409,
      );
    }

    const all = await this.repos.goals.listByUser(userId);
    for (const goal of all) {
      if (goal.status === "cancelled") continue;
      const meta = { ...(goal.metadata ?? {}) };
      const shouldBePrimary = goal.id === goalId;
      if (Boolean(meta.is_primary) === shouldBePrimary) continue;
      if (shouldBePrimary) meta.is_primary = true;
      else delete meta.is_primary;
      await this.repos.goals.update(userId, goal.id, { metadata: meta });
    }

    return this.get(userId, goalId);
  }

  /** Misma regla que usan Telegram y el dashboard. */
  async getPrimary(userId: string) {
    const goals = await this.list(userId);
    const active = goals.filter((g) => g.status !== "cancelled");
    const marked = active.find((g) => Boolean(g.metadata?.is_primary));
    if (marked) return marked;
    return active.find((g) => g.status === "active") ?? active[0] ?? null;
  }

  async transactions(userId: string, goalId: string) {
    await this.get(userId, goalId);
    return this.repos.goals.listTransactions(userId, goalId);
  }
}
