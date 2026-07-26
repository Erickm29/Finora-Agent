import { researchMacroContext } from "../integrations/market.js";
import { fetchWallbitMarketSnapshot } from "../integrations/wallbit.js";

export type MarketContextResponse = {
  source: "wallbit" | "partial" | "fallback";
  stub: boolean;
  generated_at: string;
  wallbit: {
    configured: boolean;
    rate: { from: string; to: string; rate: number | null } | null;
    portfolio: {
      usd_cash: number | null;
      positions: { symbol: string; shares: number }[];
    } | null;
    assets: {
      symbol: string;
      name?: string;
      price?: number | null;
      currency?: string | null;
    }[];
    errors: string[];
  };
  macro: {
    ok: boolean;
    summary?: string;
    highlights?: { title: string; url: string; snippet?: string }[];
    source: string;
    error?: string;
  } | null;
  insights: string[];
};

function buildInsights(input: {
  rate: { from: string; to: string; rate: number | null } | null;
  portfolio: {
    usdCash: number | null;
    positions: { symbol: string; shares: number }[];
  } | null;
  assets: { symbol: string; price?: number | null }[];
  macroOk: boolean;
}): string[] {
  const insights: string[] = [];
  if (input.rate?.rate != null) {
    insights.push(
      `Tipo de cambio de referencia Wallbit ${input.rate.from}/${input.rate.to}: ${input.rate.rate}.`,
    );
  }
  if (input.portfolio) {
    const n = input.portfolio.positions.length;
    if (input.portfolio.usdCash != null) {
      insights.push(
        `Caja en inversión: USD ${input.portfolio.usdCash.toLocaleString("en-US")}.`,
      );
    }
    if (n > 0) {
      const top = input.portfolio.positions
        .slice(0, 3)
        .map((p) => `${p.symbol} (${p.shares})`)
        .join(", ");
      insights.push(`Tenés ${n} posición(es) en el portafolio: ${top}.`);
    } else {
      insights.push("El portafolio de inversión no muestra posiciones abiertas.");
    }
  }
  const priced = input.assets.filter((a) => a.price != null).slice(0, 2);
  if (priced.length) {
    insights.push(
      `Referencias de mercado: ${priced
        .map((a) => `${a.symbol} ≈ ${a.price}`)
        .join("; ")}.`,
    );
  }
  if (input.macroOk) {
    insights.push(
      "Hay contexto macro reciente (Bolivia) disponible para contrastar con el portafolio.",
    );
  }
  if (!insights.length) {
    insights.push(
      "No pudimos armar insights de mercado en este momento; reintentá en unos minutos.",
    );
  }
  return insights;
}

/**
 * Contexto de mercado para dashboard/Telegram. Nunca lanza al caller:
 * degrada a partial/fallback si Wallbit o Exa fallan.
 */
export async function getMarketContext(): Promise<MarketContextResponse> {
  const wallbit = await fetchWallbitMarketSnapshot();
  const macroResult = await researchMacroContext(
    "Bolivia dólar inflación tasas mercados",
  ).catch((err) => ({
    ok: false as const,
    source: "exa",
    error: err instanceof Error ? err.message : "macro falló",
  }));

  const macro = {
    ok: Boolean(macroResult.ok),
    summary: "summary" in macroResult ? macroResult.summary : undefined,
    highlights: "highlights" in macroResult ? macroResult.highlights : undefined,
    source: macroResult.source,
    error: "error" in macroResult ? macroResult.error : undefined,
  };

  const hasWallbit = wallbit.ok;
  const hasMacro = macro.ok;
  let source: MarketContextResponse["source"] = "fallback";
  if (hasWallbit && hasMacro) source = "wallbit";
  else if (hasWallbit || hasMacro) source = "partial";

  const insights = buildInsights({
    rate: wallbit.rate,
    portfolio: wallbit.portfolio,
    assets: wallbit.assets,
    macroOk: hasMacro,
  });

  return {
    source,
    stub: !wallbit.configured,
    generated_at: new Date().toISOString(),
    wallbit: {
      configured: wallbit.configured,
      rate: wallbit.rate
        ? {
            from: wallbit.rate.from,
            to: wallbit.rate.to,
            rate: wallbit.rate.rate,
          }
        : null,
      portfolio: wallbit.portfolio
        ? {
            usd_cash: wallbit.portfolio.usdCash,
            positions: wallbit.portfolio.positions,
          }
        : null,
      assets: wallbit.assets,
      errors: wallbit.errors,
    },
    macro,
    insights,
  };
}
