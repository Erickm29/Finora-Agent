import type { MarketContext } from '../types'
import { delay } from './store'

/**
 * Ejemplo de contexto de mercado para el modo mock (VITE_USE_MOCKS=true).
 * Nunca se usa contra la API real: cuando USE_MOCKS es false, el panel
 * consume GET /v1/market/context (Wallbit + Exa) y muestra lo que esa
 * respuesta traiga, insights de "sin datos" incluidos.
 */
export async function mockGetMarketContext(): Promise<MarketContext> {
  const context: MarketContext = {
    source: 'wallbit',
    stub: true,
    generatedAt: new Date().toISOString(),
    configured: false,
    rate: { from: 'USD', to: 'BOB', rate: 6.96 },
    portfolio: {
      usdCash: 180,
      positions: [
        { symbol: 'AAPL', shares: 0.4 },
        { symbol: 'SPY', shares: 0.6 },
      ],
    },
    assets: [
      { symbol: 'AAPL', name: 'Apple', price: 230.5, currency: 'USD' },
      { symbol: 'SPY', name: 'S&P 500 ETF', price: 560.2, currency: 'USD' },
    ],
    errors: [],
    macro: {
      ok: true,
      summary: 'Datos de ejemplo (modo mock): Wallbit todavía no está conectado.',
      source: 'exa',
    },
    insights: [
      'Tipo de cambio de referencia Wallbit USD/BOB: 6.96 (dato de ejemplo).',
      'Caja en inversión: USD 180.',
      'Tenés 2 posición(es) en el portafolio: AAPL (0.4), SPY (0.6).',
    ],
  }
  return delay(context)
}
