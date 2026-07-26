import type {
  DomainRepos,
  EconomicSource,
  MarketSnapshotSource,
} from "@finora/domain";
import {
  exaHitsFromRaw,
  exaSearchRaw,
  firecrawlHitsFromRaw,
  firecrawlSearchRaw,
  isExaEnabled,
  isFirecrawlEnabled,
  type WebSearchHit,
} from "../integrations/market.js";
import { env } from "../env.js";

/**
 * Consultas fijas: al no depender del usuario, un solo snapshot cacheado
 * alcanza para todas las metas creadas dentro de la ventana de TTL.
 */
export const FIRECRAWL_ECONOMIC_QUERY =
  "tipo de cambio dolar Bolivia inflacion precios tasas noticias economicas";

export const EXA_ECONOMIC_QUERY =
  "Bolivia economia dolar inflacion tasas de interes mercados inversiones noticias financieras recientes";

const MAX_SOURCES = 10;

export type ResearchCoverage = "completa" | "parcial" | "sin-fuentes";

export type EconomicResearchResult = {
  sources: EconomicSource[];
  coverage: ResearchCoverage;
  usedProviders: MarketSnapshotSource[];
  cachedProviders: MarketSnapshotSource[];
  failures: { provider: MarketSnapshotSource; error: string }[];
};

function normalizeUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.host.replace(/^www\./, "");
    const path = parsed.pathname.replace(/\/+$/, "");
    return `${host}${path}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase() || null;
  }
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Paso 2: normaliza, deduplica por URL y por título, y acota el volumen. */
export function normalizeAndDedupe(
  batches: { provider: MarketSnapshotSource; hits: WebSearchHit[] }[],
): EconomicSource[] {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const out: EconomicSource[] = [];

  for (const { provider, hits } of batches) {
    for (const hit of hits) {
      if (out.length >= MAX_SOURCES) return out;

      const title = hit.title.trim();
      const snippet = hit.snippet?.trim() || null;
      if (!title && !snippet) continue;

      const urlKey = normalizeUrl(hit.url);
      if (urlKey && seenUrls.has(urlKey)) continue;
      const titleKey = normalizeTitle(title);
      if (titleKey && seenTitles.has(titleKey)) continue;

      if (urlKey) seenUrls.add(urlKey);
      if (titleKey) seenTitles.add(titleKey);

      out.push({
        provider,
        title: title || "Sin título",
        url: hit.url,
        snippet,
      });
    }
  }

  return out;
}

async function searchWithCache(
  repos: DomainRepos,
  provider: MarketSnapshotSource,
  query: string,
  fetchRaw: () => Promise<unknown>,
  parse: (raw: unknown) => WebSearchHit[],
): Promise<{ hits: WebSearchHit[]; cached: boolean }> {
  const cached = await repos.marketSnapshots
    .getFresh(query, provider, env.analysisSourcesTtlMs)
    .catch(() => null);

  if (cached) {
    const hits = parse(cached.data);
    if (hits.length) {
      console.info(
        `[Analysis] ${provider} servido desde caché (${hits.length} fuentes).`,
      );
      return { hits, cached: true };
    }
  }

  const raw = await fetchRaw();
  const hits = parse(raw);
  if (hits.length) {
    await repos.marketSnapshots.save(query, provider, raw).catch(() => undefined);
  }
  return { hits, cached: false };
}

/**
 * Pasos 1 y 2: busca en Firecrawl y Exa en paralelo y devuelve un contexto
 * limpio. Nunca lanza: si ambos proveedores fallan devuelve `sin-fuentes`
 * para que el agente lo declare explícitamente al usuario.
 */
export async function collectEconomicContext(
  repos: DomainRepos,
): Promise<EconomicResearchResult> {
  const tasks: Promise<{
    provider: MarketSnapshotSource;
    hits: WebSearchHit[];
    cached: boolean;
  }>[] = [];

  if (isFirecrawlEnabled()) {
    console.info("[Analysis] Searching Firecrawl...");
    tasks.push(
      searchWithCache(
        repos,
        "firecrawl",
        FIRECRAWL_ECONOMIC_QUERY,
        () => firecrawlSearchRaw(FIRECRAWL_ECONOMIC_QUERY, 6),
        firecrawlHitsFromRaw,
      ).then((r) => ({ provider: "firecrawl" as const, ...r })),
    );
  } else {
    console.warn("[Analysis] Firecrawl no configurado; se omite.");
  }

  if (isExaEnabled()) {
    console.info("[Analysis] Searching Exa...");
    tasks.push(
      searchWithCache(
        repos,
        "exa",
        EXA_ECONOMIC_QUERY,
        () => exaSearchRaw(EXA_ECONOMIC_QUERY, 6),
        exaHitsFromRaw,
      ).then((r) => ({ provider: "exa" as const, ...r })),
    );
  } else {
    console.warn("[Analysis] Exa no configurado; se omite.");
  }

  const providersAttempted: MarketSnapshotSource[] = [];
  if (isFirecrawlEnabled()) providersAttempted.push("firecrawl");
  if (isExaEnabled()) providersAttempted.push("exa");

  const settled = await Promise.allSettled(tasks);

  const batches: { provider: MarketSnapshotSource; hits: WebSearchHit[] }[] = [];
  const usedProviders: MarketSnapshotSource[] = [];
  const cachedProviders: MarketSnapshotSource[] = [];
  const failures: { provider: MarketSnapshotSource; error: string }[] = [];

  settled.forEach((result, index) => {
    const provider = providersAttempted[index] ?? "exa";
    if (result.status === "fulfilled") {
      if (!result.value.hits.length) {
        failures.push({ provider, error: "Sin resultados útiles" });
        return;
      }
      batches.push({ provider: result.value.provider, hits: result.value.hits });
      usedProviders.push(result.value.provider);
      if (result.value.cached) cachedProviders.push(result.value.provider);
    } else {
      const error =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);
      console.warn(`[Analysis] ${provider} falló: ${error}`);
      failures.push({ provider, error });
    }
  });

  const sources = normalizeAndDedupe(batches);

  let coverage: ResearchCoverage = "sin-fuentes";
  if (sources.length && usedProviders.length >= 2) coverage = "completa";
  else if (sources.length) coverage = "parcial";

  console.info(
    `[Analysis] Sources collected. ${sources.length} fuentes (${coverage}), proveedores: ${
      usedProviders.join(", ") || "ninguno"
    }.`,
  );

  return { sources, coverage, usedProviders, cachedProviders, failures };
}
