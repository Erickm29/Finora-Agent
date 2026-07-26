import type { PendingActionKind } from "@finora/shared";
import { preferencesOf } from "@finora/domain";
import { getMarketContext } from "../analysis/market-context.js";
import { notifyPendingAction } from "../agent/notifier.js";
import { formatPendingActionMessage } from "../bot/digest-format.js";
import { env } from "../env.js";
import { services } from "../container.js";

const INTERVAL_MS = 60_000;

export type DigestRunOptions = {
  /** Ignora horario y last_digest_date (smoke / demo). */
  force?: boolean;
  /** Si se setea, solo ese usuario. */
  userId?: string;
};

export type DigestRunResult = {
  scanned: number;
  prepared: number;
  skipped: number;
  errors: string[];
  actionIds: string[];
};

function localClock(
  timezone: string,
  now = new Date(),
): { hhmm: string; date: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return {
    hhmm: `${hour}:${get("minute")}`,
    date: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

async function prepareDigestForUser(userId: string): Promise<string | null> {
  const svc = services();
  const goal = await svc.goals.getPrimary(userId);
  if (!goal) return null;

  const market = await getMarketContext();
  const highlight = market.macro?.highlights?.[0];
  const newsSource = highlight
    ? {
        title: highlight.title,
        url: highlight.url,
        snippet: highlight.snippet,
      }
    : market.macro?.summary
      ? {
          title: "Contexto macro Bolivia",
          url: undefined as string | undefined,
          snippet: market.macro.summary.slice(0, 180),
        }
      : null;

  const preferProtect =
    Boolean(market.wallbit.rate?.rate) && goal.accumulatedBobs >= 100;
  const kind: PendingActionKind = preferProtect
    ? "wallbit_convert"
    : "apply_microsaving";
  const amountBobs = preferProtect
    ? Math.max(50, Math.min(500, Math.round(goal.baseMonthlyBobs * 0.15)))
    : Math.max(50, Math.round(goal.baseMonthlyBobs * 0.1));

  const title = preferProtect
    ? `Proteger Bs ${amountBobs} en USD para “${goal.name}”`
    : `Microahorro de Bs ${amountBobs} para “${goal.name}”`;
  const rationale = preferProtect
    ? "Con el contexto de mercado actual, conviene dejar lista una conversión chica a USD alineada a tu meta prioritaria."
    : `Un aporte chico e indoloro mantiene el ritmo de “${goal.name}” sin tocar tu presupuesto esencial.`;
  const risks = preferProtect
    ? [
        "El tipo de cambio puede moverse al momento de la ejecución real.",
        "Sin cuenta Wallbit, la confirmación solo registra la preparación (stub).",
      ]
    : [
        "Reduce liquidez inmediata en Bs.",
        "Si tu mes se complica, podés cancelar antes de confirmar.",
      ];
  const benefits = preferProtect
    ? [
        "Blindás parte del ahorro frente a presión cambiaria.",
        "Queda preparada: vos decidís cuándo confirmar.",
      ]
    : [
        "Avanzás la meta sin un esfuerzo grande.",
        "Se aplica solo si confirmás.",
      ];

  const payload: Record<string, unknown> = {
    amount_bobs: amountBobs,
    title,
    rationale,
    risks,
    benefits,
    digest: true,
    news_source: newsSource,
    note: title,
  };
  if (kind === "wallbit_convert") {
    payload.to = "USD";
    // Para wallbit, `source` puede ser la noticia (no choca con microsaving enum).
    if (newsSource) payload.source = newsSource;
  } else {
    payload.source = "microsaving";
  }

  const action = await svc.pendingActions.prepare({
    userId,
    goalId: goal.id,
    kind,
    payload,
    channel: "telegram",
  });

  const profile = await svc.repos.profiles.getById(userId);
  if (profile?.telegramUserId) {
    const formatted = formatPendingActionMessage(action);
    await notifyPendingAction(
      "telegram",
      String(profile.telegramUserId),
      formatted,
    );
  }

  return action.id;
}

export async function runDigestPass(
  options: DigestRunOptions = {},
): Promise<DigestRunResult> {
  const result: DigestRunResult = {
    scanned: 0,
    prepared: 0,
    skipped: 0,
    errors: [],
    actionIds: [],
  };
  const svc = services();
  const profiles = options.userId
    ? [await svc.repos.profiles.ensure(options.userId)]
    : await svc.repos.profiles.listAll();

  for (const profile of profiles) {
    result.scanned += 1;
    try {
      const prefs = preferencesOf(profile);
      if (!prefs.digest_enabled && !options.force) {
        result.skipped += 1;
        continue;
      }
      const clock = localClock(prefs.timezone || "America/La_Paz");
      if (!options.force) {
        if (clock.hhmm !== prefs.digest_local_time) {
          result.skipped += 1;
          continue;
        }
        if (prefs.last_digest_date === clock.date) {
          result.skipped += 1;
          continue;
        }
      }

      const actionId = await prepareDigestForUser(profile.id);
      if (!actionId) {
        result.skipped += 1;
        continue;
      }
      await svc.repos.profiles.updatePreferences(profile.id, {
        last_digest_date: clock.date,
      });
      result.prepared += 1;
      result.actionIds.push(actionId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`${profile.id}: ${msg}`);
      console.warn("[finora] digest user error", profile.id, err);
    }
  }
  return result;
}

let timer: ReturnType<typeof setInterval> | null = null;

export function startDigestScheduler() {
  if (!env.digestSchedulerEnabled) {
    console.info("[finora] Digest scheduler deshabilitado.");
    return;
  }
  if (timer) return;
  console.info("[finora] Digest scheduler cada 60s.");
  timer = setInterval(() => {
    void runDigestPass().then((r) => {
      if (r.prepared > 0) {
        console.info(
          `[finora] digest: prepared=${r.prepared} scanned=${r.scanned}`,
        );
      }
    });
  }, INTERVAL_MS);
  timer.unref?.();
}
