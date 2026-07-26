import { createServiceClient } from "@finora/db";
import type { SupabaseClient } from "@supabase/supabase-js";
import { FinoraError } from "@finora/shared";
import type {
  CreateGoalInput,
  PatchGoalInput,
  PendingActionStatus,
} from "@finora/shared";
import type {
  DomainRepos,
  Goal,
  GoalTransaction,
  GoalsRepo,
  PendingAction,
  PendingActionsRepo,
  Profile,
  ProfilesRepo,
  ConversationMessage,
  ConversationSession,
  ConversationsRepo,
  WallbitClient,
} from "@finora/domain";
import { stubWallbit } from "@finora/domain";
import type { Channel } from "@finora/shared";

type Db = SupabaseClient;

function mapGoal(row: {
  id: string;
  user_id: string;
  name: string;
  target_amount_bobs: number | string;
  target_months: number;
  base_monthly_bobs: number | string;
  accumulated_bobs: number | string;
  status: string;
  product_url: string | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
}): Goal {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    targetAmountBobs: Number(row.target_amount_bobs),
    targetMonths: row.target_months,
    baseMonthlyBobs: Number(row.base_monthly_bobs),
    accumulatedBobs: Number(row.accumulated_bobs),
    status: row.status as Goal["status"],
    productUrl: row.product_url,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTx(row: {
  id: string;
  goal_id: string;
  user_id: string;
  type: string;
  amount_bobs: number | string;
  source: string;
  note: string | null;
  created_at: string;
}): GoalTransaction {
  return {
    id: row.id,
    goalId: row.goal_id,
    userId: row.user_id,
    type: row.type as GoalTransaction["type"],
    amountBobs: Number(row.amount_bobs),
    source: row.source as GoalTransaction["source"],
    note: row.note,
    createdAt: row.created_at,
  };
}

function mapAction(row: {
  id: string;
  user_id: string;
  goal_id: string | null;
  kind: string;
  payload: unknown;
  status: string;
  channel_created: string;
  confirm_token: string;
  expires_at: string;
  confirmed_at: string | null;
  created_at: string;
}): PendingAction {
  return {
    id: row.id,
    userId: row.user_id,
    goalId: row.goal_id,
    kind: row.kind as PendingAction["kind"],
    payload: (row.payload as Record<string, unknown>) ?? {},
    status: row.status as PendingAction["status"],
    channelCreated: row.channel_created as PendingAction["channelCreated"],
    confirmToken: row.confirm_token,
    expiresAt: row.expires_at,
    confirmedAt: row.confirmed_at,
    createdAt: row.created_at,
  };
}

function mapProfile(row: {
  id: string;
  display_name: string | null;
  telegram_user_id: number | null;
  locale: string;
  currency: string;
}): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    telegramUserId: row.telegram_user_id,
    locale: row.locale,
    currency: row.currency,
  };
}

function throwSb(error: { message: string } | null, context: string): never {
  throw new Error(`${context}: ${error?.message ?? "unknown supabase error"}`);
}

class SupabaseGoalsRepo implements GoalsRepo {
  constructor(private readonly db: Db) {}

  async listByUser(userId: string) {
    const { data, error } = await this.db
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throwSb(error, "goals.list");
    return (data ?? []).map(mapGoal);
  }

  async getById(userId: string, goalId: string) {
    const { data, error } = await this.db
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .eq("id", goalId)
      .maybeSingle();
    if (error) throwSb(error, "goals.get");
    return data ? mapGoal(data) : null;
  }

  async create(userId: string, input: CreateGoalInput) {
    const { data, error } = await this.db
      .from("goals")
      .insert({
        user_id: userId,
        name: input.name,
        target_amount_bobs: input.target_amount_bobs,
        target_months: input.target_months,
        base_monthly_bobs: input.base_monthly_bobs,
        product_url: input.product_url ?? null,
        metadata: input.metadata ?? {},
        status: "active",
      })
      .select("*")
      .single();
    if (error) throwSb(error, "goals.create");
    return mapGoal(data);
  }

  async update(
    userId: string,
    goalId: string,
    patch: PatchGoalInput & { accumulatedBobs?: number },
  ) {
    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.status !== undefined) update.status = patch.status;
    if (patch.target_months !== undefined) update.target_months = patch.target_months;
    if (patch.base_monthly_bobs !== undefined) {
      update.base_monthly_bobs = patch.base_monthly_bobs;
    }
    if (patch.metadata !== undefined) update.metadata = patch.metadata;
    if (patch.accumulatedBobs !== undefined) {
      update.accumulated_bobs = patch.accumulatedBobs;
    }

    const { data, error } = await this.db
      .from("goals")
      .update(update)
      .eq("user_id", userId)
      .eq("id", goalId)
      .select("*")
      .single();
    if (error) throwSb(error, "goals.update");
    return mapGoal(data);
  }

  async listTransactions(userId: string, goalId: string) {
    const { data, error } = await this.db
      .from("goal_transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("goal_id", goalId)
      .order("created_at", { ascending: false });
    if (error) throwSb(error, "goals.transactions");
    return (data ?? []).map(mapTx);
  }

  async addTransaction(
    tx: Omit<GoalTransaction, "id" | "createdAt"> & { id?: string },
  ) {
    const { data, error } = await this.db
      .from("goal_transactions")
      .insert({
        id: tx.id,
        goal_id: tx.goalId,
        user_id: tx.userId,
        type: tx.type,
        amount_bobs: tx.amountBobs,
        source: tx.source,
        note: tx.note,
      })
      .select("*")
      .single();
    if (error) throwSb(error, "goals.addTransaction");
    return mapTx(data);
  }
}

class SupabasePendingActionsRepo implements PendingActionsRepo {
  constructor(private readonly db: Db) {}

  async listPending(userId: string) {
    const { data, error } = await this.db
      .from("pending_actions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    if (error) throwSb(error, "pending.list");
    return (data ?? []).map(mapAction);
  }

  async getById(userId: string, id: string) {
    const { data, error } = await this.db
      .from("pending_actions")
      .select("*")
      .eq("user_id", userId)
      .eq("id", id)
      .maybeSingle();
    if (error) throwSb(error, "pending.get");
    return data ? mapAction(data) : null;
  }

  async create(
    action: Omit<PendingAction, "id" | "createdAt" | "confirmedAt" | "status"> & {
      status?: PendingActionStatus;
    },
  ) {
    const { data, error } = await this.db
      .from("pending_actions")
      .insert({
        user_id: action.userId,
        goal_id: action.goalId,
        kind: action.kind,
        payload: action.payload,
        status: action.status ?? "pending",
        channel_created: action.channelCreated,
        confirm_token: action.confirmToken,
        expires_at: action.expiresAt,
      })
      .select("*")
      .single();
    if (error) throwSb(error, "pending.create");
    return mapAction(data);
  }

  async updateStatus(
    userId: string,
    id: string,
    status: PendingActionStatus,
    confirmedAt?: string | null,
  ) {
    const update: Record<string, unknown> = { status };
    if (confirmedAt !== undefined) update.confirmed_at = confirmedAt;
    const { data, error } = await this.db
      .from("pending_actions")
      .update(update)
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throwSb(error, "pending.updateStatus");
    return mapAction(data);
  }
}

class SupabaseProfilesRepo implements ProfilesRepo {
  constructor(private readonly db: Db) {}

  async getById(id: string) {
    const { data, error } = await this.db
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throwSb(error, "profiles.get");
    return data ? mapProfile(data) : null;
  }

  async getByTelegramId(telegramUserId: number) {
    const { data, error } = await this.db
      .from("profiles")
      .select("*")
      .eq("telegram_user_id", telegramUserId)
      .maybeSingle();
    if (error) throwSb(error, "profiles.getByTelegram");
    return data ? mapProfile(data) : null;
  }

  async ensure(userId: string) {
    const existing = await this.getById(userId);
    if (existing) return existing;
    const { data, error } = await this.db
      .from("profiles")
      .insert({
        id: userId,
        locale: "es-BO",
        currency: "BOB",
      })
      .select("*")
      .single();
    if (error) {
      // race: another request inserted first
      const again = await this.getById(userId);
      if (again) return again;
      throwSb(error, "profiles.ensure");
    }
    return mapProfile(data);
  }

  async upsertTelegramProfile(input: {
    id: string;
    telegramUserId: number;
    displayName?: string | null;
  }) {
    const existing = await this.getByTelegramId(input.telegramUserId);
    if (existing) return existing;
    const { data, error } = await this.db
      .from("profiles")
      .insert({
        id: input.id,
        telegram_user_id: input.telegramUserId,
        display_name: input.displayName ?? null,
        locale: "es-BO",
        currency: "BOB",
      })
      .select("*")
      .single();
    if (error) {
      const again = await this.getByTelegramId(input.telegramUserId);
      if (again) return again;
      throwSb(error, "profiles.upsertTelegram");
    }
    return mapProfile(data);
  }

  async linkTelegram(
    userId: string,
    telegramUserId: number,
    displayName?: string | null,
  ) {
    await this.ensure(userId);
    // Función SQL: fusiona en una transacción el perfil que el bot creó para
    // este telegram id. Un UPDATE directo chocaría con la constraint unique de
    // profiles.telegram_user_id y dejaría las metas del bot huérfanas.
    const { error } = await this.db.rpc("link_telegram_account", {
      p_user_id: userId,
      p_telegram_id: telegramUserId,
      p_display_name: displayName ?? null,
    });
    if (error) throwSb(error, "profiles.linkTelegram");
    const linked = await this.getById(userId);
    if (!linked) {
      throw new FinoraError(
        "PROFILE_ERROR",
        "No se pudo leer el perfil vinculado",
        500,
      );
    }
    return linked;
  }

  async unlinkTelegram(userId: string) {
    const { data, error } = await this.db
      .from("profiles")
      .update({ telegram_user_id: null })
      .eq("id", userId)
      .select("*")
      .single();
    if (error) throwSb(error, "profiles.unlinkTelegram");
    return mapProfile(data);
  }

  async createLinkToken(input: {
    token: string;
    userId: string;
    expiresAt: string;
  }) {
    const { error } = await this.db.from("telegram_link_tokens").insert({
      token: input.token,
      user_id: input.userId,
      expires_at: input.expiresAt,
    });
    if (error) throwSb(error, "profiles.createLinkToken");
  }

  async consumeLinkToken(token: string) {
    const { data, error } = await this.db
      .from("telegram_link_tokens")
      .select("user_id, expires_at, used_at")
      .eq("token", token)
      .maybeSingle();
    if (error) throwSb(error, "profiles.consumeLinkToken");
    if (!data || data.used_at) return null;

    // Se marca como usado condicionando a used_at is null: si dos updates de
    // Telegram entran a la vez, solo uno consume el token.
    const { data: claimed, error: claimError } = await this.db
      .from("telegram_link_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("token", token)
      .is("used_at", null)
      .select("user_id")
      .maybeSingle();
    if (claimError) throwSb(claimError, "profiles.consumeLinkToken.claim");
    if (!claimed) return null;

    if (Date.parse(data.expires_at) <= Date.now()) return null;
    return claimed.user_id as string;
  }
}

class SupabaseConversationsRepo implements ConversationsRepo {
  constructor(private readonly db: Db) {}

  private mapSession(row: {
    id: string;
    user_id: string;
    channel: string;
    external_chat_id: string;
    active_goal_id: string | null;
    updated_at: string;
  }): ConversationSession {
    return {
      id: row.id,
      userId: row.user_id,
      channel: row.channel as Channel,
      externalChatId: row.external_chat_id,
      activeGoalId: row.active_goal_id,
      updatedAt: row.updated_at,
    };
  }

  private mapMessage(row: {
    id: string;
    session_id: string;
    role: string;
    content: string;
    tool_name: string | null;
    created_at: string;
  }): ConversationMessage {
    return {
      id: row.id,
      sessionId: row.session_id,
      role: row.role as ConversationMessage["role"],
      content: row.content,
      toolName: row.tool_name,
      createdAt: row.created_at,
    };
  }

  async getOrCreateSession(input: {
    userId: string;
    channel: Channel;
    externalChatId: string;
  }) {
    const { data: existing, error: findErr } = await this.db
      .from("conversation_sessions")
      .select("*")
      .eq("user_id", input.userId)
      .eq("channel", input.channel)
      .eq("external_chat_id", input.externalChatId)
      .maybeSingle();
    if (findErr) throwSb(findErr, "conversations.findSession");
    if (existing) return this.mapSession(existing);

    const { data, error } = await this.db
      .from("conversation_sessions")
      .insert({
        user_id: input.userId,
        channel: input.channel,
        external_chat_id: input.externalChatId,
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (error) {
      // unique race
      const { data: again, error: againErr } = await this.db
        .from("conversation_sessions")
        .select("*")
        .eq("user_id", input.userId)
        .eq("channel", input.channel)
        .eq("external_chat_id", input.externalChatId)
        .maybeSingle();
      if (againErr || !again) throwSb(error, "conversations.createSession");
      return this.mapSession(again);
    }
    return this.mapSession(data);
  }

  async listRecentMessages(sessionId: string, limit = 20) {
    const { data, error } = await this.db
      .from("conversation_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });
    if (error) throwSb(error, "conversations.listMessages");
    const all = (data ?? []).map((row) => this.mapMessage(row));
    return all.slice(-limit);
  }

  async appendMessages(
    sessionId: string,
    rows: {
      role: ConversationMessage["role"];
      content: string;
      toolName?: string | null;
    }[],
  ) {
    if (!rows.length) return [];
    const created: ConversationMessage[] = [];
    for (const r of rows) {
      const { data, error } = await this.db
        .from("conversation_messages")
        .insert({
          session_id: sessionId,
          role: r.role,
          content: r.content,
          tool_name: r.toolName ?? null,
        })
        .select("*")
        .single();
      if (error) throwSb(error, "conversations.append");
      created.push(this.mapMessage(data));
      // tiny gap so created_at ordering is stable across roles
      await new Promise((res) => setTimeout(res, 5));
    }
    await this.touchSession(sessionId);
    return created;
  }

  async touchSession(sessionId: string, activeGoalId?: string | null) {
    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (activeGoalId !== undefined) update.active_goal_id = activeGoalId;
    const { error } = await this.db
      .from("conversation_sessions")
      .update(update)
      .eq("id", sessionId);
    if (error) throwSb(error, "conversations.touch");
  }
}

export function createSupabaseRepos(params: {
  url: string;
  serviceRoleKey: string;
  wallbit?: WallbitClient;
}): DomainRepos {
  const db = createServiceClient(params.url, params.serviceRoleKey);
  return {
    goals: new SupabaseGoalsRepo(db),
    pendingActions: new SupabasePendingActionsRepo(db),
    profiles: new SupabaseProfilesRepo(db),
    conversations: new SupabaseConversationsRepo(db),
    wallbit: params.wallbit ?? stubWallbit,
  };
}
