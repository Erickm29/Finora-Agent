import type { MarketContext } from '../types'
import { mockGetMarketContext } from '../mocks/market.mock'
import { apiRequest } from './apiClient'
import { USE_MOCKS } from './config'

/**
 * Maps to `GET /v1/market/context` (Sprint 2, Track C — Wallbit + Exa).
 * Si el backend todavía no expone el endpoint, `apiRequest` rechaza con un
 * `ApiError` honesto (404/500) que el hook/panel muestran tal cual, en vez
 * de simular datos de mercado.
 */
export async function getMarketContext(): Promise<MarketContext> {
  if (USE_MOCKS) return mockGetMarketContext()
  return apiRequest<MarketContext>('/market/context', { method: 'GET' })
}
