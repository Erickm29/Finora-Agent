import { Hono } from "hono";
import { FinoraError, CreateGoalInputSchema, PatchGoalInputSchema } from "@finora/shared";
import { randomUUID } from "node:crypto";
import { services } from "../container.js";
import { runAgentTurn } from "../agent/runtime.js";
import { getBotUsername } from "../bot/telegram.js";
import { AgentTurnInputSchema } from "@finora/shared";

type Variables = { userId: string };

export const v1 = new Hono<{ Variables: Variables }>();

function mapError(err: unknown) {
  if (err instanceof FinoraError) {
    return { status: err.status, body: { error: { code: err.code, message: err.message } } };
  }
  if (err && typeof err === "object" && "name" in err && (err as { name: string }).name === "ZodError") {
    return {
      status: 400,
      body: { error: { code: "VALIDATION", message: "Body inválido" } },
    };
  }
  console.error(err);
  const message =
    err instanceof Error ? err.message.slice(0, 500) : "Error interno";
  return {
    status: 500,
    body: { error: { code: "INTERNAL", message } },
  };
}

function serializeGoal(g: {
  id: string;
  name: string;
  targetAmountBobs: number;
  targetMonths: number;
  baseMonthlyBobs: number;
  accumulatedBobs: number;
  status: string;
  progressRatio?: number;
  productUrl?: string | null;
  createdAt?: string;
}) {
  return {
    id: g.id,
    name: g.name,
    target_amount_bobs: g.targetAmountBobs,
    target_months: g.targetMonths,
    base_monthly_bobs: g.baseMonthlyBobs,
    accumulated_bobs: g.accumulatedBobs,
    status: g.status,
    progress_ratio:
      g.progressRatio ??
      (g.targetAmountBobs > 0 ? g.accumulatedBobs / g.targetAmountBobs : 0),
    product_url: g.productUrl ?? null,
    // El dashboard lo necesita para calcular si la meta va adelantada o
    // atrasada; sin esto tiene que inventar la fecha de inicio.
    created_at: g.createdAt ?? null,
  };
}

/** Dev/local auth: X-User-Id header or Bearer demo. */
v1.use("*", async (c, next) => {
  if (c.req.path.endsWith("/health")) return next();
  const headerUser = c.req.header("x-user-id");
  const auth = c.req.header("authorization");
  let userId = headerUser;
  if (!userId && auth?.startsWith("Bearer ")) {
    // Placeholder: treat token as opaque user id in memory mode
    userId = auth.slice("Bearer ".length).trim();
  }
  if (!userId) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "Falta X-User-Id o Bearer" } },
      401,
    );
  }
  c.set("userId", userId);
  try {
    await services().repos.profiles.ensure(userId);
  } catch (err) {
    console.error("[finora] ensure profile failed", err);
    return c.json(
      { error: { code: "PROFILE_ERROR", message: "No se pudo inicializar el perfil" } },
      500,
    );
  }
  await next();
});

v1.get("/goals", async (c) => {
  try {
    const goals = await services().goals.list(c.get("userId"));
    return c.json({ goals: goals.map(serializeGoal) });
  } catch (err) {
    const m = mapError(err);
    return c.json(m.body, m.status as 400);
  }
});

v1.get("/goals/:id", async (c) => {
  try {
    const g = await services().goals.get(c.get("userId"), c.req.param("id"));
    return c.json(serializeGoal(g));
  } catch (err) {
    const m = mapError(err);
    return c.json(m.body, m.status as 400);
  }
});

v1.post("/goals", async (c) => {
  try {
    const body = CreateGoalInputSchema.parse(await c.req.json());
    const g = await services().goals.create(c.get("userId"), body);
    return c.json(serializeGoal(g), 201);
  } catch (err) {
    const m = mapError(err);
    return c.json(m.body, m.status as 400);
  }
});

v1.patch("/goals/:id", async (c) => {
  try {
    const body = PatchGoalInputSchema.parse(await c.req.json());
    const g = await services().goals.patch(c.get("userId"), c.req.param("id"), body);
    return c.json(serializeGoal(g));
  } catch (err) {
    const m = mapError(err);
    return c.json(m.body, m.status as 400);
  }
});

v1.get("/goals/:id/transactions", async (c) => {
  try {
    const txs = await services().goals.transactions(
      c.get("userId"),
      c.req.param("id"),
    );
    return c.json({
      transactions: txs.map((t) => ({
        id: t.id,
        type: t.type,
        amount_bobs: t.amountBobs,
        source: t.source,
        note: t.note,
        created_at: t.createdAt,
      })),
    });
  } catch (err) {
    const m = mapError(err);
    return c.json(m.body, m.status as 400);
  }
});

v1.get("/actions/pending", async (c) => {
  try {
    const actions = await services().pendingActions.listPending(c.get("userId"));
    return c.json({
      actions: actions.map((a) => ({
        id: a.id,
        kind: a.kind,
        payload: a.payload,
        channel_created: a.channelCreated,
        expires_at: a.expiresAt,
        goal_id: a.goalId,
      })),
    });
  } catch (err) {
    const m = mapError(err);
    return c.json(m.body, m.status as 400);
  }
});

v1.post("/actions/:id/confirm", async (c) => {
  try {
    const action = await services().pendingActions.confirm(
      c.get("userId"),
      c.req.param("id"),
    );
    return c.json({
      id: action.id,
      status: action.status,
      confirmed_at: action.confirmedAt,
      result: {},
    });
  } catch (err) {
    const m = mapError(err);
    return c.json(m.body, m.status as 400);
  }
});

v1.post("/actions/:id/cancel", async (c) => {
  try {
    const action = await services().pendingActions.cancel(
      c.get("userId"),
      c.req.param("id"),
    );
    return c.json({ id: action.id, status: action.status });
  } catch (err) {
    const m = mapError(err);
    return c.json(m.body, m.status as 400);
  }
});

const LINK_TOKEN_TTL_MS = 60 * 60 * 1000;

v1.post("/account/telegram/link-token", async (c) => {
  try {
    const username = await getBotUsername();
    if (!username) {
      throw new FinoraError(
        "TELEGRAM_UNAVAILABLE",
        "El bot de Telegram no está configurado en este entorno.",
        503,
      );
    }

    const token = randomUUID().replace(/-/g, "").slice(0, 12);
    const expiresAt = new Date(Date.now() + LINK_TOKEN_TTL_MS).toISOString();
    const userId = c.get("userId");

    await services().repos.profiles.createLinkToken({
      token,
      userId,
      expiresAt,
    });

    return c.json(
      {
        token,
        deep_link: `https://t.me/${username}?start=link_${token}`,
        expires_at: expiresAt,
      },
      201,
    );
  } catch (err) {
    const m = mapError(err);
    return c.json(m.body, m.status as 400);
  }
});

v1.get("/account/telegram/status", async (c) => {
  try {
    const profile = await services().repos.profiles.getById(c.get("userId"));
    const linked = Boolean(profile?.telegramUserId);
    return c.json({
      linked,
      handle: linked ? (profile?.displayName ?? null) : null,
      telegram_user_id: profile?.telegramUserId ?? null,
      sync_active: linked,
    });
  } catch (err) {
    const m = mapError(err);
    return c.json(m.body, m.status as 400);
  }
});

v1.post("/account/telegram/unlink", async (c) => {
  try {
    await services().repos.profiles.unlinkTelegram(c.get("userId"));
    return c.json({ linked: false, handle: null, sync_active: false });
  } catch (err) {
    const m = mapError(err);
    return c.json(m.body, m.status as 400);
  }
});

v1.post("/agent/turn", async (c) => {
  try {
    const raw = (await c.req.json()) as Record<string, unknown>;
    const body = AgentTurnInputSchema.parse({
      ...raw,
      // Accept `message` alias (common in clients) for `text`
      text: raw.text ?? raw.message ?? null,
      userId: c.get("userId"),
    });
    const result = await runAgentTurn(body);
    return c.json(result);
  } catch (err) {
    const m = mapError(err);
    return c.json(m.body, m.status as 400);
  }
});
