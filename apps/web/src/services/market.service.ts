import type { MarketContext } from '../types'
import { mockGetMarketContext } from '../mocks/market.mock'
import { apiRequest } from './apiClient'
import { USE_MOCKS } from './config'

/** Wire shape returned by `GET /v1/market/context` (ver market-context.ts en la API). */
interface ApiMarketContext {
  source: 'wallbit' | 'partial' | 'fallback'
  stub: boolean
  generated_at: string
  wallbit: {
    configured: boolean
    rate: { from: string; to: string; rate: number | null } | null
    portfolio: { usd_cash: number | null; positions: { symbol: string; shares: number }[] } | null
    assets: { symbol: string; name?: string; price?: number | null; currency?: string | null }[]
    errors: string[]
  }
  macro: {
    ok: boolean
    summary?: string
    highlights?: { title: string; url: string; snippet?: string }[]
    source: string
    error?: string
  } | null
  insights: string[]
}

function mapApiMarketContext(ctx: ApiMarketContext): MarketContext {
  return {
    source: ctx.source,
    stub: ctx.stub,
    generatedAt: ctx.generated_at,
    configured: ctx.wallbit.configured,
    rate: ctx.wallbit.rate,
    portfolio: ctx.wallbit.portfolio
      ? { usdCash: ctx.wallbit.portfolio.usd_cash, positions: ctx.wallbit.portfolio.positions }
      : null,
    assets: ctx.wallbit.assets,
    errors: ctx.wallbit.errors,
    macro: ctx.macro,
    insights: ctx.insights,
  }
}

/** Maps to `GET /v1/market/context` (Sprint 2, Track C — Wallbit + Exa). */
export async function getMarketContext(): Promise<MarketContext> {
  if (USE_MOCKS) return mockGetMarketContext()
  const res = await apiRequest<ApiMarketContext>('/market/context', { method: 'GET' })
  return mapApiMarketContext(res)
}
