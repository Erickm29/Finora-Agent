/**
 * Macro market context (BTC price, cap forecast, timeline) shown as ambient information in
 * the Agent Chat sidebar. Deliberately NOT wired to a service yet: this is generic market
 * data, not the authenticated user's financial data, and no endpoint for it exists in the
 * current contract (the spec's Integraciones team owns Exa/Firecrawl-sourced market data,
 * to be exposed by the Backend later, e.g. `GET /market/overview`).
 * PENDING VALIDATION: confirm this endpoint with Backend/Integraciones; until then this
 * stays as illustrative static content, clearly separate from user-owned data.
 */
export const marketForecast = [
  { year: '2023', description: 'Explosive growth of DeFi protocols.', state: 'past' as const },
  { year: '2024', description: 'Mainstream adoption of CBDCs.', state: 'active' as const },
  { year: '2025', description: '1 BTC reaches $500k target.', state: 'future' as const },
]

export const marketAssets = {
  btcPrice: '21,105$',
  btcChange: '+28.21%',
  marketCapForecast: '1,3trln$',
}
