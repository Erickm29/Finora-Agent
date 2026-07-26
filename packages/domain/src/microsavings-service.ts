import { FinoraError, type Channel } from "@finora/shared";
import { randomUUID } from "node:crypto";
import type { DomainRepos } from "./types.js";

function expiresInHours(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export class MicrosavingsService {
  constructor(private readonly repos: DomainRepos) {}

  async suggest(params: {
    userId: string;
    goalId: string;
    amountBobs: number;
    source?: "microsaving" | "salary_margin" | "change";
    note?: string;
    channel: Channel;
  }) {
    const goal = await this.repos.goals.getById(params.userId, params.goalId);
    if (!goal) throw new FinoraError("GOAL_NOT_FOUND", "Meta no encontrada", 404);

    return this.repos.pendingActions.create({
      userId: params.userId,
      goalId: params.goalId,
      kind: "apply_microsaving",
      payload: {
        amount_bobs: params.amountBobs,
        source: params.source ?? "microsaving",
        note: params.note ?? null,
      },
      channelCreated: params.channel,
      confirmToken: randomUUID(),
      expiresAt: expiresInHours(24),
    });
  }
}
