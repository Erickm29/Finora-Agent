/**
 * Market context contracts — GET /v1/market/context (Sprint 2, Track C).
 *
 * PENDING VALIDATION WITH BACKEND: el endpoint todavía no existe en la API;
 * este contrato sigue el acordado en el sprint (rates + portfolio + assets +
 * macro opcional). Hasta que Track C lo publique, el servicio web deja el
 * panel en un estado de error honesto en vez de inventar datos.
 */
export interface MarketRate {
  /** Par de referencia, p. ej. "USD/BOB". */
  pair: string
  value: number
}

export interface MarketAsset {
  symbol: string
  name?: string
  quantity?: number
  valueBobs?: number
  changePct?: number
}

export interface MarketPortfolio {
  totalValueBobs?: number
  currency?: string
  stocksValueBobs?: number
}

/**
 * `wallbit`: datos frescos de la API pública de Wallbit.
 * `partial`: Wallbit falló pero hay contexto macro (Exa) de respaldo.
 * `stub`: datos de ejemplo (modo mock, sin backend real).
 */
export type MarketContextSource = 'wallbit' | 'partial' | 'stub' | string

export interface MarketContext {
  rates: MarketRate[]
  portfolio: MarketPortfolio | null
  assets: MarketAsset[]
  macro?: string | null
  source: MarketContextSource
  stub?: boolean
}
