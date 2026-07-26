import { randomUUID } from "node:crypto";
import type {
  Channel,
  CreateGoalInput,
  PatchGoalInput,
  PendingActionStatus,
} from "@finora/shared";
import type {
  ConversationMessage,
  ConversationSession,
  ConversationsRepo,
  DomainRepos,
  Goal,
  GoalAnalysisRepo,
  GoalTransaction,
  GoalsRepo,
  InvestmentAnalysis,
  MarketSnapshot,
  MarketSnapshotSource,
  MarketSnapshotsRepo,
  PendingAction,
  PendingActionsRepo,
  Profile,
  ProfilesRepo,
  UpsertInvestmentAnalysisInput,
  WallbitClient,
} from "./types.js";

export class InMemoryGoalsRepo implements GoalsRepo {
  goals = new Map<string, Goal>();
  transactions: GoalTransaction[] = [];

  async listByUser(userId: string) {
    return [...this.goals.values()].filter((g) => g.userId === userId);
  }

  async getById(userId: string, goalId: string) {
    const g = this.goals.get(goalId);
    return g && g.userId === userId ? g : null;
  }

  async create(userId: string, input: CreateGoalInput) {
    const now = new Date().toISOString();
    const goal: Goal = {
      id: randomUUID(),
      userId,
      name: input.name,
      targetAmountBobs: input.target_amount_bobs,
      targetMonths: input.target_months,
      baseMonthlyBobs: input.base_monthly_bobs,
      accumulatedBobs: 0,
      status: "active",
      productUrl: input.product_url ?? null,
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    };
    this.goals.set(goal.id, goal);
    return goal;
  }

  async update(
    userId: string,
    goalId: string,
    patch: PatchGoalInput & { accumulatedBobs?: number },
  ) {
    const goal = await this.getById(userId, goalId);
    if (!goal) throw new Error("not found");
    const next: Goal = {
      ...goal,
      name: patch.name ?? goal.name,
      status: patch.status ?? goal.status,
      targetMonths: patch.target_months ?? goal.targetMonths,
      baseMonthlyBobs: patch.base_monthly_bobs ?? goal.baseMonthlyBobs,
      metadata: patch.metadata ?? goal.metadata,
      accumulatedBobs: patch.accumulatedBobs ?? goal.accumulatedBobs,
      updatedAt: new Date().toISOString(),
    };
    this.goals.set(goalId, next);
    return next;
  }

  async listTransactions(userId: string, goalId: string) {
    return this.transactions
      .filter((t) => t.userId === userId && t.goalId === goalId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async addTransaction(
    tx: Omit<GoalTransaction, "id" | "createdAt"> & { id?: string },
  ) {
    const row: GoalTransaction = {
      id: tx.id ?? randomUUID(),
      goalId: tx.goalId,
      userId: tx.userId,
      type: tx.type,
      amountBobs: tx.amountBobs,
      source: tx.source,
      note: tx.note,
      createdAt: new Date().toISOString(),
    };
    this.transactions.push(row);
    return row;
  }
}

export class InMemoryPendingActionsRepo implements PendingActionsRepo {
  actions = new Map<string, PendingAction>();

  async listPending(userId: string) {
    const now = Date.now();
    return [...this.actions.values()].filter(
      (a) =>
        a.userId === userId &&
        a.status === "pending" &&
        new Date(a.expiresAt).getTime() >= now,
    );
  }

  async getById(userId: string, id: string) {
    const a = this.actions.get(id);
    return a && a.userId === userId ? a : null;
  }

  async create(
    action: Omit<PendingAction, "id" | "createdAt" | "confirmedAt" | "status"> & {
      status?: PendingActionStatus;
    },
  ) {
    const row: PendingAction = {
      id: randomUUID(),
      userId: action.userId,
      goalId: action.goalId,
      kind: action.kind,
      payload: action.payload,
      status: action.status ?? "pending",
      channelCreated: action.channelCreated,
      confirmToken: action.confirmToken,
      expiresAt: action.expiresAt,
      confirmedAt: null,
      createdAt: new Date().toISOString(),
    };
    this.actions.set(row.id, row);
    return row;
  }

  async updateStatus(
    userId: string,
    id: string,
    status: PendingActionStatus,
    confirmedAt?: string | null,
  ) {
    const action = await this.getById(userId, id);
    if (!action) throw new Error("not found");
    const next = {
      ...action,
      status,
      confirmedAt: confirmedAt === undefined ? action.confirmedAt : confirmedAt,
    };
    this.actions.set(id, next);
    return next;
  }
}

export class InMemoryProfilesRepo implements ProfilesRepo {
  profiles = new Map<string, Profile>();
  linkTokens = new Map<string, { userId: string; expiresAt: string }>();

  async getById(id: string) {
    return this.profiles.get(id) ?? null;
  }

  async getByTelegramId(telegramUserId: number) {
    return (
      [...this.profiles.values()].find((p) => p.telegramUserId === telegramUserId) ??
      null
    );
  }

  async ensure(userId: string) {
    const existing = await this.getById(userId);
    if (existing) return existing;
    const profile: Profile = {
      id: userId,
      displayName: null,
      telegramUserId: null,
      locale: "es-BO",
      currency: "BOB",
    };
    this.profiles.set(profile.id, profile);
    return profile;
  }

  async upsertTelegramProfile(input: {
    id: string;
    telegramUserId: number;
    displayName?: string | null;
  }) {
    const existing = await this.getByTelegramId(input.telegramUserId);
    if (existing) return existing;
    const profile: Profile = {
      id: input.id,
      displayName: input.displayName ?? null,
      telegramUserId: input.telegramUserId,
      locale: "es-BO",
      currency: "BOB",
    };
    this.profiles.set(profile.id, profile);
    return profile;
  }

  async linkTelegram(
    userId: string,
    telegramUserId: number,
    displayName?: string | null,
  ) {
    const profile = await this.ensure(userId);
    // El bot pudo haber creado un perfil aparte antes de la vinculación; en la
    // versión Supabase se fusiona con una función SQL. Acá basta con soltar el
    // telegram id del perfil viejo para no duplicar la referencia.
    const botProfile = await this.getByTelegramId(telegramUserId);
    if (botProfile && botProfile.id !== userId) {
      this.profiles.set(botProfile.id, {
        ...botProfile,
        telegramUserId: null,
      });
    }
    const next: Profile = {
      ...profile,
      telegramUserId,
      displayName: profile.displayName ?? displayName ?? null,
    };
    this.profiles.set(userId, next);
    return next;
  }

  async unlinkTelegram(userId: string) {
    const profile = await this.ensure(userId);
    const next: Profile = { ...profile, telegramUserId: null };
    this.profiles.set(userId, next);
    return next;
  }

  async createLinkToken(input: {
    token: string;
    userId: string;
    expiresAt: string;
  }) {
    this.linkTokens.set(input.token, {
      userId: input.userId,
      expiresAt: input.expiresAt,
    });
  }

  async consumeLinkToken(token: string) {
    const entry = this.linkTokens.get(token);
    if (!entry) return null;
    // Un token es de un solo uso, expire o no.
    this.linkTokens.delete(token);
    if (Date.parse(entry.expiresAt) <= Date.now()) return null;
    return entry.userId;
  }
}

export class InMemoryConversationsRepo implements ConversationsRepo {
  sessions = new Map<string, ConversationSession>();
  messages: ConversationMessage[] = [];

  private sessionKey(userId: string, channel: Channel, externalChatId: string) {
    return `${userId}:${channel}:${externalChatId}`;
  }

  async getOrCreateSession(input: {
    userId: string;
    channel: Channel;
    externalChatId: string;
  }) {
    const key = this.sessionKey(
      input.userId,
      input.channel,
      input.externalChatId,
    );
    const existing = [...this.sessions.values()].find(
      (s) =>
        s.userId === input.userId &&
        s.channel === input.channel &&
        s.externalChatId === input.externalChatId,
    );
    if (existing) return existing;
    const now = new Date().toISOString();
    const session: ConversationSession = {
      id: randomUUID(),
      userId: input.userId,
      channel: input.channel,
      externalChatId: input.externalChatId,
      activeGoalId: null,
      updatedAt: now,
    };
    this.sessions.set(key, session);
    return session;
  }

  async listRecentMessages(sessionId: string, limit = 20) {
    return this.messages
      .filter((m) => m.sessionId === sessionId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(-limit);
  }

  async appendMessages(
    sessionId: string,
    rows: {
      role: ConversationMessage["role"];
      content: string;
      toolName?: string | null;
    }[],
  ) {
    const now = new Date().toISOString();
    const created = rows.map((r) => {
      const msg: ConversationMessage = {
        id: randomUUID(),
        sessionId,
        role: r.role,
        content: r.content,
        toolName: r.toolName ?? null,
        createdAt: now,
      };
      this.messages.push(msg);
      return msg;
    });
    await this.touchSession(sessionId);
    return created;
  }

  async touchSession(sessionId: string, activeGoalId?: string | null) {
    for (const [key, session] of this.sessions) {
      if (session.id !== sessionId) continue;
      this.sessions.set(key, {
        ...session,
        activeGoalId:
          activeGoalId === undefined ? session.activeGoalId : activeGoalId,
        updatedAt: new Date().toISOString(),
      });
      return;
    }
  }
}

export class InMemoryGoalAnalysisRepo implements GoalAnalysisRepo {
  analyses = new Map<string, InvestmentAnalysis>();

  async getByGoal(userId: string, goalId: string) {
    const found = this.analyses.get(goalId);
    if (!found || found.userId !== userId) return null;
    return found;
  }

  async upsert(input: UpsertInvestmentAnalysisInput) {
    const now = new Date().toISOString();
    const previous = this.analyses.get(input.goalId);
    const next: InvestmentAnalysis = {
      id: previous?.id ?? randomUUID(),
      goalId: input.goalId,
      userId: input.userId,
      status: input.status,
      content: input.content ?? null,
      sources: input.sources ?? [],
      provider: input.provider ?? null,
      model: input.model ?? null,
      error: input.error ?? null,
      generatedAt: input.generatedAt ?? null,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    };
    this.analyses.set(input.goalId, next);
    return next;
  }
}

export class InMemoryMarketSnapshotsRepo implements MarketSnapshotsRepo {
  snapshots = new Map<string, MarketSnapshot>();

  private key(query: string, source: MarketSnapshotSource) {
    return `${source}:${query}`;
  }

  async getFresh(
    query: string,
    source: MarketSnapshotSource,
    maxAgeMs: number,
  ) {
    const found = this.snapshots.get(this.key(query, source));
    if (!found) return null;
    const age = Date.now() - new Date(found.fetchedAt).getTime();
    return age <= maxAgeMs ? found : null;
  }

  async save(query: string, source: MarketSnapshotSource, data: unknown) {
    this.snapshots.set(this.key(query, source), {
      query,
      source,
      data,
      fetchedAt: new Date().toISOString(),
    });
  }
}

export const stubWallbit: WallbitClient = {
  async executeConvert(payload) {
    return { ok: true, result: { stub: true, payload } };
  },
};

export function createInMemoryRepos(
  wallbit: WallbitClient = stubWallbit,
): DomainRepos {
  return {
    goals: new InMemoryGoalsRepo(),
    pendingActions: new InMemoryPendingActionsRepo(),
    profiles: new InMemoryProfilesRepo(),
    conversations: new InMemoryConversationsRepo(),
    goalAnalyses: new InMemoryGoalAnalysisRepo(),
    marketSnapshots: new InMemoryMarketSnapshotsRepo(),
    wallbit,
  };
}
