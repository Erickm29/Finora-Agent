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

  /** Soft-delete: la meta deja de contar como activa pero no se borra. */
  async cancel(userId: string, goalId: string) {
    return this.patch(userId, goalId, { status: "cancelled" });
  }

  /**
   * Marca `goalId` como prioritaria y limpia el flag en el resto de las
   * metas del usuario, para que solo haya una `is_primary: true` a la vez.
   */
  async setPrimary(userId: string, goalId: string) {
    const goals = await this.list(userId);
    await Promise.all(
      goals
        .filter((g) => g.id !== goalId && g.metadata?.is_primary === true)
        .map((g) => this.patch(userId, g.id, { metadata: { is_primary: false } })),
    );
    return this.patch(userId, goalId, { metadata: { is_primary: true } });
  }

  async transactions(userId: string, goalId: string) {
    await this.get(userId, goalId);
    return this.repos.goals.listTransactions(userId, goalId);
  }
}
