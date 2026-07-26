/**
 * Central place to read environment configuration.
 *
 * NOTE (deviation from the original spec): the existing prototype is a Vite app, not
 * Next.js, so environment variables use the `VITE_` prefix and are read via
 * `import.meta.env` instead of `process.env.NEXT_PUBLIC_*`. Flagged for team alignment —
 * see chat summary. Functionally equivalent: both are inlined at build time and safe to
 * expose to the client (never put secrets here).
 */
export const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

/**
 * When true (default), every service function resolves against the in-memory mock layer
 * (`src/mocks`) instead of the real API. Flip to `false` (via `.env` / Netlify env vars)
 * once the Backend team's endpoints are ready — no component code needs to change.
 */
export const USE_MOCKS: boolean = import.meta.env.VITE_USE_MOCKS !== 'false'

/**
 * Simulated network latency for mocks, so loading states are actually visible/testable
 * during development instead of resolving instantly.
 */
export const MOCK_LATENCY_MS = 550
