/**
 * Market context contracts — GET /v1/market/context (Sprint 2, Track C).
 * Espejo camelCase del `MarketContextResponse` real de
 * `apps/api/src/analysis/market-context.ts` (Wallbit + Exa de respaldo).
 */
export interface MarketRate {
  from: string
  to: string
  rate: number | null
}

export interface MarketPosition {
  symbol: string
  shares: number
}

export interface MarketPortfolio {
  usdCash: number | null
  positions: MarketPosition[]
}

export interface MarketAsset {
  symbol: string
  name?: string
  price?: number | null
  currency?: string | null
}

export interface MarketMacro {
  ok: boolean
  summary?: string
  highlights?: { title: string; url: string; snippet?: string }[]
  source: string
  error?: string
}

/**
 * `wallbit`: Wallbit + Exa con datos frescos.
 * `partial`: solo una de las dos fuentes respondió.
 * `fallback`: ninguna respondió (`stub` además marca que Wallbit no está configurado).
 */
export type MarketContextSource = 'wallbit' | 'partial' | 'fallback'

export interface MarketContext {
  source: MarketContextSource
  stub: boolean
  generatedAt: string
  configured: boolean
  rate: MarketRate | null
  portfolio: MarketPortfolio | null
  assets: MarketAsset[]
  errors: string[]
  macro: MarketMacro | null
  /** Resumen ya armado por el backend (2-3 líneas), listo para mostrar tal cual. */
  insights: string[]
}
