import { z } from "zod";

export const GoalStatusSchema = z.enum([
  "active",
  "paused",
  "completed",
  "cancelled",
]);
export type GoalStatus = z.infer<typeof GoalStatusSchema>;

export const TransactionTypeSchema = z.enum([
  "contribution",
  "withdrawal",
  "adjustment",
]);
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export const TransactionSourceSchema = z.enum([
  "microsaving",
  "manual",
  "salary_margin",
  "change",
]);
export type TransactionSource = z.infer<typeof TransactionSourceSchema>;

export const PendingActionKindSchema = z.enum([
  "wallbit_convert",
  "apply_microsaving",
  "confirm_withdrawal",
]);
export type PendingActionKind = z.infer<typeof PendingActionKindSchema>;

export const PendingActionStatusSchema = z.enum([
  "pending",
  "confirmed",
  "cancelled",
  "expired",
  "failed",
]);
export type PendingActionStatus = z.infer<typeof PendingActionStatusSchema>;

export const ChannelSchema = z.enum(["telegram", "web"]);
export type Channel = z.infer<typeof ChannelSchema>;

export const CreateGoalInputSchema = z.object({
  name: z.string().min(1),
  target_amount_bobs: z.number().positive(),
  target_months: z.number().int().positive(),
  base_monthly_bobs: z.number().positive(),
  product_url: z.string().url().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateGoalInput = z.infer<typeof CreateGoalInputSchema>;

export const PatchGoalInputSchema = z.object({
  name: z.string().min(1).optional(),
  status: GoalStatusSchema.optional(),
  target_months: z.number().int().positive().optional(),
  base_monthly_bobs: z.number().positive().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type PatchGoalInput = z.infer<typeof PatchGoalInputSchema>;

/** Horarios preset del digest Wallbit (MVP). */
export const DigestLocalTimeSchema = z.enum([
  "08:00",
  "12:00",
  "18:00",
  "21:00",
]);
export type DigestLocalTime = z.infer<typeof DigestLocalTimeSchema>;

export const DigestPreferencesSchema = z.object({
  digest_enabled: z.boolean().default(false),
  digest_local_time: DigestLocalTimeSchema.default("08:00"),
  timezone: z.string().min(1).default("America/La_Paz"),
  /** YYYY-MM-DD en timezone del usuario; evita dobles digests el mismo día. */
  last_digest_date: z.string().nullable().optional(),
});
export type DigestPreferences = z.infer<typeof DigestPreferencesSchema>;

export const PatchPreferencesInputSchema = z.object({
  digest_enabled: z.boolean().optional(),
  digest_local_time: DigestLocalTimeSchema.optional(),
  timezone: z.string().min(1).optional(),
  last_digest_date: z.string().nullable().optional(),
});
export type PatchPreferencesInput = z.infer<typeof PatchPreferencesInputSchema>;

export function normalizeDigestPreferences(
  raw: unknown,
): DigestPreferences {
  const parsed = DigestPreferencesSchema.safeParse(raw ?? {});
  if (parsed.success) return parsed.data;
  return DigestPreferencesSchema.parse({});
}

export const AgentTurnInputSchema = z.object({
  userId: z.string().uuid(),
  channel: ChannelSchema,
  text: z.string().nullable().optional(),
  callbackData: z.string().nullable().optional(),
  externalChatId: z.string().optional(),
});
export type AgentTurnInput = z.infer<typeof AgentTurnInputSchema>;

export class FinoraError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "FinoraError";
  }
}

export function progressRatio(accumulated: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(1, Math.max(0, accumulated / target));
}

/** Delay in months if withdrawing `amount` given remaining savings pace. */
export function withdrawalDelayMonths(params: {
  amountBobs: number;
  remainingBobs: number;
  baseMonthlyBobs: number;
}): number {
  const { amountBobs, remainingBobs, baseMonthlyBobs } = params;
  if (baseMonthlyBobs <= 0) return 0;
  const before = Math.max(0, remainingBobs) / baseMonthlyBobs;
  const after =
    Math.max(0, remainingBobs + amountBobs) / baseMonthlyBobs;
  return Math.max(0, Math.ceil(after - before));
}
