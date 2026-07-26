import {
  FinoraError,
  type Channel,
  type PendingActionKind,
} from "@finora/shared";
import { randomUUID } from "node:crypto";
import type { DomainRepos, PendingAction } from "./types.js";

function expiresInHours(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export type ConfirmResult = {
  action: PendingAction;
  /** True si ya estaba resuelta: no se reaplicó el efecto. */
  idempotent?: boolean;
  /** Detalle de Wallbit (stub o execute real). */
  execution?: {
    stub?: boolean;
    message?: string;
    result?: Record<string, unknown>;
  };
};

export class PendingActionsService {
  constructor(private readonly repos: DomainRepos) {}

  listPending(userId: string) {
    return this.repos.pendingActions.listPending(userId);
  }

  async prepare(params: {
    userId: string;
    goalId?: string | null;
    kind: PendingActionKind;
    payload: Record<string, unknown>;
    channel: Channel;
  }): Promise<PendingAction> {
    return this.repos.pendingActions.create({
      userId: params.userId,
      goalId: params.goalId ?? null,
      kind: params.kind,
      payload: params.payload,
      channelCreated: params.channel,
      confirmToken: randomUUID(),
      expiresAt: expiresInHours(24),
    });
  }

  async prepareWallbitConvert(params: {
    userId: string;
    goalId?: string | null;
    amountBobs: number;
    toCurrency?: string;
    channel: Channel;
  }) {
    return this.prepare({
      userId: params.userId,
      goalId: params.goalId,
      kind: "wallbit_convert",
      payload: {
        amount_bobs: params.amountBobs,
        to: params.toCurrency ?? "USD",
      },
      channel: params.channel,
    });
  }

  async confirm(userId: string, actionId: string): Promise<ConfirmResult> {
    const action = await this.repos.pendingActions.getById(userId, actionId);
    if (!action) {
      throw new FinoraError("ACTION_NOT_FOUND", "Acción no encontrada", 404);
    }

    // Idempotente: confirmar dos veces no vuelve a mover dinero ni a llamar Wallbit.
    if (action.status === "confirmed" || action.status === "cancelled") {
      return { action, idempotent: true };
    }

    if (action.status !== "pending") {
      throw new FinoraError(
        "ACTION_CONFLICT",
        "La acción ya no está pendiente",
        409,
      );
    }
    if (new Date(action.expiresAt).getTime() < Date.now()) {
      await this.repos.pendingActions.updateStatus(userId, actionId, "expired");
      throw new FinoraError(
        "ACTION_EXPIRED",
        "Esta acción ya expiró. Pedile al agente que la prepare de nuevo.",
        410,
      );
    }

    let execution: ConfirmResult["execution"];

    if (action.kind === "apply_microsaving") {
      await this.applyMicrosaving(action);
    } else if (action.kind === "confirm_withdrawal") {
      await this.applyWithdrawal(action);
    } else if (action.kind === "wallbit_convert") {
      const exec = await this.repos.wallbit.executeConvert(action.payload);
      if (!exec.ok) {
        await this.repos.pendingActions.updateStatus(userId, actionId, "failed");
        throw new FinoraError(
          "WALLBIT_FAILED",
          exec.error ?? "Falló la conversión en Wallbit",
          502,
        );
      }
      const result = exec.result ?? {};
      const stub = Boolean(result.stub);
      execution = {
        stub,
        message:
          typeof result.message === "string"
            ? result.message
            : stub
              ? "Preparación confirmada; la conversión real queda pendiente de cuenta Wallbit."
              : undefined,
        result,
      };
    }

    const confirmed = await this.repos.pendingActions.updateStatus(
      userId,
      actionId,
      "confirmed",
      new Date().toISOString(),
    );
    return { action: confirmed, execution };
  }

  async cancel(userId: string, actionId: string) {
    const action = await this.repos.pendingActions.getById(userId, actionId);
    if (!action) {
      throw new FinoraError("ACTION_NOT_FOUND", "Acción no encontrada", 404);
    }
    if (action.status === "cancelled" || action.status === "confirmed") {
      return action;
    }
    if (action.status !== "pending") {
      throw new FinoraError(
        "ACTION_CONFLICT",
        "La acción ya no está pendiente",
        409,
      );
    }
    return this.repos.pendingActions.updateStatus(userId, actionId, "cancelled");
  }

  private async applyMicrosaving(action: PendingAction) {
    if (!action.goalId) {
      throw new FinoraError("GOAL_REQUIRED", "La acción requiere una meta", 400);
    }
    const amount = Number(action.payload.amount_bobs);
    const source =
      (action.payload.source as "microsaving" | "salary_margin" | "change") ??
      "microsaving";
    const note = (action.payload.note as string | null) ?? null;
    const goal = await this.repos.goals.getById(action.userId, action.goalId);
    if (!goal) throw new FinoraError("GOAL_NOT_FOUND", "Meta no encontrada", 404);

    await this.repos.goals.addTransaction({
      goalId: action.goalId,
      userId: action.userId,
      type: "contribution",
      amountBobs: amount,
      source,
      note,
    });
    await this.repos.goals.update(action.userId, action.goalId, {
      accumulatedBobs: goal.accumulatedBobs + amount,
    });
  }

  private async applyWithdrawal(action: PendingAction) {
    if (!action.goalId) {
      throw new FinoraError("GOAL_REQUIRED", "La acción requiere una meta", 400);
    }
    const amount = Number(action.payload.amount_bobs);
    const goal = await this.repos.goals.getById(action.userId, action.goalId);
    if (!goal) throw new FinoraError("GOAL_NOT_FOUND", "Meta no encontrada", 404);
    if (amount > goal.accumulatedBobs) {
      throw new FinoraError(
        "INSUFFICIENT_FUNDS",
        "No hay suficiente acumulado",
        400,
      );
    }
    await this.repos.goals.addTransaction({
      goalId: action.goalId,
      userId: action.userId,
      type: "withdrawal",
      amountBobs: amount,
      source: "manual",
      note: (action.payload.note as string | null) ?? null,
    });
    await this.repos.goals.update(action.userId, action.goalId, {
      accumulatedBobs: goal.accumulatedBobs - amount,
    });
  }
}
