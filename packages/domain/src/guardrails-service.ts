import { FinoraError, withdrawalDelayMonths } from "@finora/shared";
import type { DomainRepos } from "./types.js";

export class GuardrailsService {
  constructor(private readonly repos: DomainRepos) {}

  async evaluateWithdrawal(params: {
    userId: string;
    goalId: string;
    amountBobs: number;
  }) {
    const goal = await this.repos.goals.getById(params.userId, params.goalId);
    if (!goal) throw new FinoraError("GOAL_NOT_FOUND", "Meta no encontrada", 404);
    if (params.amountBobs > goal.accumulatedBobs) {
      throw new FinoraError(
        "INSUFFICIENT_FUNDS",
        "No hay suficiente acumulado en la meta para ese retiro",
        400,
      );
    }
    const remaining = goal.targetAmountBobs - goal.accumulatedBobs;
    const delayMonths = withdrawalDelayMonths({
      amountBobs: params.amountBobs,
      remainingBobs: remaining,
      baseMonthlyBobs: goal.baseMonthlyBobs,
    });
    return {
      goalId: goal.id,
      amountBobs: params.amountBobs,
      delayMonths,
      message: `Esa decisión retrasará tu objetivo aproximadamente ${delayMonths} mes(es). ¿Deseas continuar?`,
    };
  }
}
