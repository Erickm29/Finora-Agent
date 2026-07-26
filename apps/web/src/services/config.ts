/**
 * Central place to read environment configuration (Vite `VITE_*` vars).
 */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3001/v1'

/**
 * When true (default), every service resolves against `src/mocks`.
 * Set VITE_USE_MOCKS=false to hit the Hono API.
 */
export const USE_MOCKS: boolean = import.meta.env.VITE_USE_MOCKS !== 'false'

/** Simulated network latency for mocks. */
export const MOCK_LATENCY_MS = 550
