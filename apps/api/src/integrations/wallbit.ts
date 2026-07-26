import { env } from "../env.js";

const WALLBIT_TIMEOUT_MS = 8_000;

export type WallbitPosition = {
  symbol: string;
  shares: number;
};

export type WallbitAssetSummary = {
  symbol: string;
  name?: string;
  price?: number | null;
  currency?: string | null;
};

export type WallbitRate = {
  from: string;
  to: string;
  rate: number | null;
  raw?: unknown;
};

function wallbitConfigured(): boolean {
  return Boolean(env.wallbitApiKey && env.wallbitApiUrl);
}

function baseUrl(): string {
  return (env.wallbitApiUrl || "https://api.wallbit.io").replace(/\/+$/, "");
}

async function wallbitGet(path: string, query?: Record<string, string>) {
  if (!env.wallbitApiKey) throw new Error("Wallbit no configurado");
  const url = new URL(path.startsWith("http") ? path : `${baseUrl()}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  }
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "X-API-Key": env.wallbitApiKey,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(WALLBIT_TIMEOUT_MS),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Wallbit HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`);
  }
  return res.json();
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Portfolio de inversión (acciones + cash USD si viene como símbolo). */
export async function getStocksPortfolio(): Promise<{
  positions: WallbitPosition[];
  usdCash: number | null;
}> {
  const raw = (await wallbitGet("/api/public/v1/balance/stocks")) as {
    data?: { symbol?: string; shares?: number }[];
  };
  const rows = Array.isArray(raw.data) ? raw.data : [];
  const positions: WallbitPosition[] = [];
  let usdCash: number | null = null;
  for (const row of rows) {
    const symbol = String(row.symbol ?? "").toUpperCase();
    const shares = asNumber(row.shares) ?? 0;
    if (!symbol) continue;
    if (symbol === "USD") {
      usdCash = shares;
      continue;
    }
    positions.push({ symbol, shares });
  }
  return { positions, usdCash };
}

/** Tipo de cambio fiat. La forma exacta del JSON varía; normalizamos con cuidado. */
export async function getFiatRate(
  from = "USD",
  to = "BOB",
): Promise<WallbitRate> {
  const raw = await wallbitGet("/api/public/v1/rates", { from, to });
  const obj = raw as Record<string, unknown>;
  const data = (obj.data ?? obj) as Record<string, unknown>;
  const rate =
    asNumber(data.rate) ??
    asNumber(data.price) ??
    asNumber(data.value) ??
    asNumber(obj.rate) ??
    null;
  return { from, to, rate, raw };
}

function mapAssetRow(row: Record<string, unknown>): WallbitAssetSummary {
  return {
    symbol: String(row.symbol ?? row.ticker ?? "").toUpperCase() || "?",
    name:
      typeof row.name === "string"
        ? row.name
        : typeof row.description === "string"
          ? row.description.slice(0, 80)
          : undefined,
    price:
      asNumber(row.price) ??
      asNumber(row.last_price) ??
      asNumber((row as { quote?: { price?: unknown } }).quote?.price),
    currency:
      typeof row.currency === "string"
        ? row.currency
        : typeof row.quote_currency === "string"
          ? row.quote_currency
          : "USD",
  };
}

/** Muestra corta de assets disponibles (bolsa / ETF). */
export async function listAssets(limit = 5): Promise<WallbitAssetSummary[]> {
  const raw = (await wallbitGet("/api/public/v1/assets")) as {
    data?: Record<string, unknown>[];
  };
  const rows = Array.isArray(raw.data) ? raw.data : [];
  return rows.slice(0, limit).map(mapAssetRow);
}

/**
 * Cotización de un ticker vía Public API.
 * Intenta filtro `symbol` y, si no viene, busca en el listado de assets.
 */
export async function getAssetQuote(
  symbol: string,
): Promise<WallbitAssetSummary | null> {
  const sym = symbol.trim().toUpperCase().replace(/[^A-Z0-9.\-]/g, "");
  if (!sym) return null;

  try {
    const filtered = (await wallbitGet("/api/public/v1/assets", {
      symbol: sym,
    })) as { data?: Record<string, unknown>[] };
    const rows = Array.isArray(filtered.data) ? filtered.data : [];
    const hit = rows
      .map(mapAssetRow)
      .find((a) => a.symbol === sym || a.symbol.startsWith(sym));
    if (hit) return hit;
  } catch {
    /* caemos al listado completo */
  }

  const raw = (await wallbitGet("/api/public/v1/assets")) as {
    data?: Record<string, unknown>[];
  };
  const rows = Array.isArray(raw.data) ? raw.data : [];
  return (
    rows
      .map(mapAssetRow)
      .find((a) => a.symbol === sym || a.symbol === `${sym}.US`) ?? null
  );
}

export function formatPortfolioBalance(portfolio: {
  positions: WallbitPosition[];
  usdCash: number | null;
}): string {
  const lines = ["Saldo Wallbit (inversión)"];
  if (portfolio.usdCash != null) {
    lines.push(
      `Caja USD: ${Number(portfolio.usdCash).toLocaleString("es-BO")}`,
    );
  }
  if (!portfolio.positions.length) {
    lines.push("Sin posiciones abiertas.");
  } else {
    for (const p of portfolio.positions.slice(0, 15)) {
      lines.push(
        `• ${p.symbol}: ${Number(p.shares).toLocaleString("es-BO")} shares`,
      );
    }
    if (portfolio.positions.length > 15) {
      lines.push(`… y ${portfolio.positions.length - 15} más`);
    }
  }
  lines.push("Solo lectura — no se mueve dinero.");
  return lines.join("\n");
}

export function formatAssetQuote(quote: WallbitAssetSummary): string {
  const name = quote.name ? ` (${quote.name})` : "";
  if (quote.price == null) {
    return `${quote.symbol}${name}: Wallbit no devolvió precio ahora.`;
  }
  const cur = quote.currency ?? "USD";
  return (
    `${quote.symbol}${name}: ${Number(quote.price).toLocaleString("es-BO")} ${cur}\n` +
    "Cotización de referencia (Wallbit). No es una orden."
  );
}

export type WallbitMarketSnapshot = {
  ok: boolean;
  configured: boolean;
  portfolio: { positions: WallbitPosition[]; usdCash: number | null } | null;
  rate: WallbitRate | null;
  assets: WallbitAssetSummary[];
  errors: string[];
};

/**
 * Lecturas en paralelo. Nunca lanza: si un endpoint falla, los demás siguen.
 */
export async function fetchWallbitMarketSnapshot(): Promise<WallbitMarketSnapshot> {
  if (!wallbitConfigured()) {
    return {
      ok: false,
      configured: false,
      portfolio: null,
      rate: null,
      assets: [],
      errors: ["Wallbit no configurado (faltan WALLBIT_API_KEY / WALLBIT_API_URL)."],
    };
  }

  const errors: string[] = [];
  const [portfolioR, rateR, assetsR] = await Promise.allSettled([
    getStocksPortfolio(),
    getFiatRate("USD", "BOB"),
    listAssets(5),
  ]);

  const portfolio =
    portfolioR.status === "fulfilled"
      ? portfolioR.value
      : (errors.push(
          `portfolio: ${portfolioR.reason instanceof Error ? portfolioR.reason.message : String(portfolioR.reason)}`,
        ),
        null);

  const rate =
    rateR.status === "fulfilled"
      ? rateR.value
      : (errors.push(
          `rates: ${rateR.reason instanceof Error ? rateR.reason.message : String(rateR.reason)}`,
        ),
        null);

  const assets =
    assetsR.status === "fulfilled"
      ? assetsR.value
      : (errors.push(
          `assets: ${assetsR.reason instanceof Error ? assetsR.reason.message : String(assetsR.reason)}`,
        ),
        []);

  return {
    ok: Boolean(portfolio || rate || assets.length),
    configured: true,
    portfolio,
    rate,
    assets,
    errors,
  };
}

/**
 * Convert Bs→USD del producto Finora: la Public API no expone ese convert.
 * Con o sin key, el prepare/confirm sigue siendo stub honesto para no romper
 * el flujo de confirmación humana (antes, con key, pegaba a /convert y fallaba).
 */
export function createWallbitClient() {
  return {
    async executeConvert(payload: Record<string, unknown>) {
      return {
        ok: true as const,
        result: {
          stub: true,
          provider: "wallbit",
          message:
            "Preparación confirmada; la conversión Bs→USD del mentor sigue en modo stub. " +
            "Las lecturas de mercado usan la API pública; no se ejecutó un trade.",
          payload,
          marketApiConfigured: wallbitConfigured(),
        },
      };
    },
  };
}
