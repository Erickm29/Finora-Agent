import { env } from "../env.js";

export type PriceResearch = {
  ok: boolean;
  amountBobs?: number;
  amountForeign?: number;
  currency?: string;
  source: string;
  title?: string;
  url?: string;
  note?: string;
  raw?: unknown;
  error?: string;
};

export type MacroResearch = {
  ok: boolean;
  source: string;
  summary?: string;
  highlights?: { title: string; url: string; snippet?: string }[];
  raw?: unknown;
  error?: string;
};

type SearchHit = {
  url?: string;
  title?: string;
  description?: string;
  markdown?: string;
};

function queryPriceBounds(query: string): { minBob: number; maxBob: number; minUsd: number } {
  const q = String(query ?? "").toLowerCase();
  if (/macbook|laptop|notebook|ultrabook|iphone|ipad|ps5|playstation/.test(q)) {
    return { minBob: 2500, maxBob: 80_000, minUsd: 300 };
  }
  if (/auto|carro|casa|departamento|viaje|pasaje/.test(q)) {
    return { minBob: 1000, maxBob: 5_000_000, minUsd: 100 };
  }
  return { minBob: 50, maxBob: 200_000, minUsd: 20 };
}

function extractPrices(
  text: string,
  bounds: { minBob: number; maxBob: number; minUsd: number },
): { amount: number; currency: string }[] {
  const out: { amount: number; currency: string }[] = [];
  const blob = String(text ?? "");
  const patterns: { re: RegExp; currency: string }[] = [
    { re: /(?:Bs\.?|BOB)\s*([\d]{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)/gi, currency: "BOB" },
    { re: /([\d]{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)\s*(?:Bs\.?|BOB)/gi, currency: "BOB" },
    { re: /(?:USD|US\$|\$)\s*([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/gi, currency: "USD" },
    { re: /([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:USD|dólares|dolares)/gi, currency: "USD" },
  ];
  for (const { re, currency } of patterns) {
    for (const m of blob.matchAll(re)) {
      const captured = m[1];
      if (!captured) continue;
      const raw = captured.replace(/\s/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
      const amount = Number(raw);
      if (!Number.isFinite(amount)) continue;
      if (currency === "BOB" && (amount < bounds.minBob || amount > bounds.maxBob)) continue;
      if (currency === "USD" && (amount < bounds.minUsd || amount > 50_000)) continue;
      out.push({ amount, currency });
    }
  }
  return out;
}

function pickBestPrice(
  hits: SearchHit[],
  query: string,
): {
  amountBobs?: number;
  amountForeign?: number;
  currency: string;
  title?: string;
  url?: string;
  note?: string;
} | null {
  const bounds = queryPriceBounds(query);
  const bobCandidates: { amount: number; title?: string; url?: string }[] = [];
  const usdCandidates: { amount: number; title?: string; url?: string }[] = [];

  for (const hit of hits) {
    const blob = [hit.title, hit.description, hit.markdown].filter(Boolean).join("\n");
    for (const p of extractPrices(blob, bounds)) {
      if (p.currency === "BOB") {
        bobCandidates.push({ amount: p.amount, title: hit.title, url: hit.url });
      } else {
        usdCandidates.push({ amount: p.amount, title: hit.title, url: hit.url });
      }
    }
  }

  if (bobCandidates.length) {
    bobCandidates.sort((a, b) => a.amount - b.amount);
    const mid = bobCandidates[Math.floor(bobCandidates.length / 2)];
    return {
      amountBobs: Math.round(mid.amount),
      currency: "BOB",
      title: mid.title,
      url: mid.url,
      note:
        bobCandidates.length > 1
          ? `Se tomó un precio mediano entre ${bobCandidates.length} hallazgos en Bs.`
          : undefined,
    };
  }

  if (usdCandidates.length) {
    usdCandidates.sort((a, b) => a.amount - b.amount);
    const mid = usdCandidates[Math.floor(usdCandidates.length / 2)];
    return {
      amountForeign: Math.round(mid.amount),
      currency: "USD",
      title: mid.title,
      url: mid.url,
      note:
        "Precio encontrado en USD. No convertimos a Bs sin tipo de cambio verificado.",
    };
  }

  return null;
}

function normalizeFirecrawlHits(data: unknown): SearchHit[] {
  const root = data as {
    data?: { web?: SearchHit[]; news?: SearchHit[] } | SearchHit[];
    web?: SearchHit[];
  };
  let rows: unknown[] = [];
  if (Array.isArray(root.data)) rows = root.data;
  else if (Array.isArray(root.data?.web)) rows = root.data.web;
  else if (Array.isArray(root.web)) rows = root.web;

  return rows
    .filter((h): h is Record<string, unknown> => Boolean(h) && typeof h === "object")
    .map((h) => ({
      url: typeof h.url === "string" ? h.url : undefined,
      title: typeof h.title === "string" ? h.title : undefined,
      description:
        typeof h.description === "string"
          ? h.description
          : typeof h.snippet === "string"
            ? h.snippet
            : undefined,
      markdown:
        typeof h.markdown === "string"
          ? h.markdown
          : typeof (h as { content?: unknown }).content === "string"
            ? String((h as { content: string }).content)
            : undefined,
    }));
}

export async function researchProductPrice(query: string): Promise<PriceResearch> {
  if (!env.firecrawlApiKey) {
    return {
      ok: true,
      amountBobs: 8500,
      currency: "BOB",
      source: "fixture",
      note: "Firecrawl no configurado; precio de ejemplo en Bs (pesos bolivianos)",
      raw: { query },
    };
  }

  try {
    const res = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `${query} precio Bolivia Bs OR BOB`,
        limit: 5,
        lang: "es",
        country: "bo",
        scrapeOptions: {
          formats: ["markdown"],
          onlyMainContent: true,
        },
      }),
    });

    if (!res.ok) {
      return {
        ok: false,
        source: "firecrawl",
        error: `Firecrawl HTTP ${res.status}. No inventamos el precio.`,
      };
    }

    const data = await res.json();
    const hits = normalizeFirecrawlHits(data);
    const best = pickBestPrice(hits, query);

    if (!best) {
      return {
        ok: false,
        source: "firecrawl",
        error:
          "Firecrawl respondió pero no hallamos un precio claro en Bs/USD. Pedile al usuario un link o monto.",
        raw: { query, hitCount: hits.length, titles: hits.map((h) => h.title) },
      };
    }

    return {
      ok: true,
      amountBobs: best.amountBobs,
      amountForeign: best.amountForeign,
      currency: best.currency,
      source: "firecrawl",
      title: best.title,
      url: best.url,
      note: best.note,
      raw: { query, hitCount: hits.length },
    };
  } catch (err) {
    return {
      ok: false,
      source: "firecrawl",
      error: err instanceof Error ? err.message : "Firecrawl falló",
    };
  }
}

export async function researchMacroContext(query: string): Promise<MacroResearch> {
  if (!env.exaApiKey) {
    return {
      ok: true,
      source: "fixture",
      summary:
        "Contexto macro de ejemplo (Bolivia). Configurá EXA_API_KEY para datos reales.",
      raw: { query },
    };
  }

  try {
    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "x-api-key": env.exaApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `${query} Bolivia economía tipo de cambio inflación`,
        type: "auto",
        numResults: 5,
        contents: {
          text: { maxCharacters: 800 },
          highlights: { maxCharacters: 400 },
        },
      }),
    });

    if (!res.ok) {
      return {
        ok: false,
        source: "exa",
        error: `Exa HTTP ${res.status}. No inventamos el contexto.`,
      };
    }

    const data = (await res.json()) as {
      results?: {
        title?: string;
        url?: string;
        text?: string;
        highlights?: string[];
      }[];
    };

    const highlights = (data.results ?? []).slice(0, 5).map((r) => ({
      title: r.title ?? "Sin título",
      url: r.url ?? "",
      snippet: r.highlights?.[0] ?? r.text?.slice(0, 240),
    }));

    if (!highlights.length) {
      return {
        ok: false,
        source: "exa",
        error: "Exa no devolvió resultados útiles para Bolivia.",
        raw: data,
      };
    }

    const summary = highlights
      .map(
        (h, i) =>
          `${i + 1}. ${h.title}${h.snippet ? ` — ${h.snippet.replace(/\s+/g, " ").trim()}` : ""}`,
      )
      .join("\n");

    return {
      ok: true,
      source: "exa",
      summary: `Contexto macro (Exa) para “${query}” / Bolivia:\n${summary}`,
      highlights,
      raw: { resultCount: highlights.length },
    };
  } catch (err) {
    return {
      ok: false,
      source: "exa",
      error: err instanceof Error ? err.message : "Exa falló",
    };
  }
}

export async function generateVoiceSummary(text: string) {
  if (!env.elevenLabsApiKey || !env.elevenLabsVoiceId) {
    return {
      ok: false as const,
      error: "ElevenLabs no configurado; resumen solo en texto.",
    };
  }

  const clipped = text.slice(0, 1200);
  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${env.elevenLabsVoiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": env.elevenLabsApiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: clipped,
          model_id: "eleven_multilingual_v2",
        }),
      },
    );
    if (!res.ok) {
      const detail = await res.text();
      return {
        ok: false as const,
        error: `ElevenLabs HTTP ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`,
      };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    return {
      ok: true as const,
      contentType: "audio/mpeg",
      base64: buf.toString("base64"),
      bytes: buf.length,
    };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "ElevenLabs falló",
    };
  }
}
