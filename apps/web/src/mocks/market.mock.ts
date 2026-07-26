import type { MarketContext } from '../types'
import { delay } from './store'

/**
 * Ejemplo de contexto de mercado para el modo mock (VITE_USE_MOCKS=true).
 * Nunca se usa contra la API real: cuando USE_MOCKS es false, el panel
 * consume GET /v1/market/context (Wallbit) y, si falla, muestra un error
 * honesto en vez de estos valores.
 */
export async function mockGetMarketContext(): Promise<MarketContext> {
  const context: MarketContext = {
    source: 'stub',
    stub: true,
    rates: [{ pair: 'USD/BOB', value: 6.96 }],
    portfolio: { totalValueBobs: 1240, currency: 'BOB', stocksValueBobs: 980 },
    assets: [
      { symbol: 'AAPL', name: 'Apple', quantity: 0.4, valueBobs: 520, changePct: 1.2 },
      { symbol: 'SPY', name: 'S&P 500 ETF', quantity: 0.6, valueBobs: 460, changePct: -0.3 },
    ],
    macro: 'Datos de ejemplo (modo mock): Wallbit todavía no está conectado.',
  }
  return delay(context)
}
