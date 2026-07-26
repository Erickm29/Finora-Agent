/**
 * Central place to read environment configuration (Vite `VITE_*` vars).
 *
 * Prod default `/v1` = same-origin (Vercel rewrite → Render). Evita CORS
 * si `VITE_API_URL` no está seteada. Local: Hono en :3001.
 */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD ? '/v1' : 'http://localhost:3001/v1')

/**
 * When true (default), every service resolves against `src/mocks`.
 * Set VITE_USE_MOCKS=false to hit the Hono API.
 */
export const USE_MOCKS: boolean = import.meta.env.VITE_USE_MOCKS !== 'false'

/** Simulated network latency for mocks. */
export const MOCK_LATENCY_MS = 550
