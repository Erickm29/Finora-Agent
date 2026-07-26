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
    await this.get(userId, goalId);
    return this.repos.goals.update(userId, goalId, patch);
  }

  async transactions(userId: string, goalId: string) {
    await this.get(userId, goalId);
    return this.repos.goals.listTransactions(userId, goalId);
  }
}
