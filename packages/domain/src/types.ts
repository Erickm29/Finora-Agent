import type {
  Channel,
  CreateGoalInput,
  GoalStatus,
  PatchGoalInput,
  PendingActionKind,
  PendingActionStatus,
  TransactionSource,
  TransactionType,
} from "@finora/shared";

export type Goal = {
  id: string;
  userId: string;
  name: string;
  targetAmountBobs: number;
  targetMonths: number;
  baseMonthlyBobs: number;
  accumulatedBobs: number;
  status: GoalStatus;
  productUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type GoalTransaction = {
  id: string;
  goalId: string;
  userId: string;
  type: TransactionType;
  amountBobs: number;
  source: TransactionSource;
  note: string | null;
  createdAt: string;
};

export type PendingAction = {
  id: string;
  userId: string;
  goalId: string | null;
  kind: PendingActionKind;
  payload: Record<string, unknown>;
  status: PendingActionStatus;
  channelCreated: Channel;
  confirmToken: string;
  expiresAt: string;
  confirmedAt: string | null;
  createdAt: string;
};

export type Profile = {
  id: string;
  displayName: string | null;
  telegramUserId: number | null;
  locale: string;
  currency: string;
};

export interface GoalsRepo {
  listByUser(userId: string): Promise<Goal[]>;
  getById(userId: string, goalId: string): Promise<Goal | null>;
  create(userId: string, input: CreateGoalInput): Promise<Goal>;
  update(
    userId: string,
    goalId: string,
    patch: PatchGoalInput & { accumulatedBobs?: number },
  ): Promise<Goal>;
  listTransactions(userId: string, goalId: string): Promise<GoalTransaction[]>;
  addTransaction(
    tx: Omit<GoalTransaction, "id" | "createdAt"> & { id?: string },
  ): Promise<GoalTransaction>;
}

export interface PendingActionsRepo {
  listPending(userId: string): Promise<PendingAction[]>;
  getById(userId: string, id: string): Promise<PendingAction | null>;
  create(
    action: Omit<PendingAction, "id" | "createdAt" | "confirmedAt" | "status"> & {
      status?: PendingActionStatus;
    },
  ): Promise<PendingAction>;
  updateStatus(
    userId: string,
    id: string,
    status: PendingActionStatus,
    confirmedAt?: string | null,
  ): Promise<PendingAction>;
}

export interface ProfilesRepo {
  getById(id: string): Promise<Profile | null>;
  getByTelegramId(telegramUserId: number): Promise<Profile | null>;
  ensure(userId: string): Promise<Profile>;
  upsertTelegramProfile(input: {
    id: string;
    telegramUserId: number;
    displayName?: string | null;
  }): Promise<Profile>;
  linkTelegram(userId: string, telegramUserId: number): Promise<Profile>;
}

export type ConversationSession = {
  id: string;
  userId: string;
  channel: Channel;
  externalChatId: string;
  activeGoalId: string | null;
  updatedAt: string;
};

export type ConversationMessage = {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  toolName: string | null;
  createdAt: string;
};

export interface ConversationsRepo {
  getOrCreateSession(input: {
    userId: string;
    channel: Channel;
    externalChatId: string;
  }): Promise<ConversationSession>;
  listRecentMessages(
    sessionId: string,
    limit?: number,
  ): Promise<ConversationMessage[]>;
  appendMessages(
    sessionId: string,
    messages: {
      role: ConversationMessage["role"];
      content: string;
      toolName?: string | null;
    }[],
  ): Promise<ConversationMessage[]>;
  touchSession(sessionId: string, activeGoalId?: string | null): Promise<void>;
}

export interface WallbitClient {
  /** Execute conversion only after human confirm. Stub until Paso 7. */
  executeConvert(payload: Record<string, unknown>): Promise<{
    ok: boolean;
    result?: Record<string, unknown>;
    error?: string;
  }>;
}

export type DomainRepos = {
  goals: GoalsRepo;
  pendingActions: PendingActionsRepo;
  profiles: ProfilesRepo;
  conversations: ConversationsRepo;
  wallbit: WallbitClient;
};
