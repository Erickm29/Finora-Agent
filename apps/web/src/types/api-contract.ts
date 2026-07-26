/**
 * =============================================================================
 * API CONTRACT — validated against Finora Hono apps/api (/v1)
 * =============================================================================
 *
 * VALIDATED (VITE_USE_MOCKS=false):
 * - Auth local bridge: X-User-Id + Bearer <uuid> (no JWT Supabase yet)
 * - GET/POST /goals  — snake_case DTOs mapped in goals.service.ts
 * - GET /goals/:id/transactions
 * - GET /actions/pending + POST /actions/:id/confirm|cancel
 *   (surfaced as Recommendations in the dashboard)
 * - POST /account/telegram/link-token → { token, deep_link, expires_at }
 * - POST /agent/turn { channel: "web", text | message } → { replies, sessionId }
 *
 * STILL PENDING (local/mock fallback):
 * - POST /login|/register|/me|/logout — JWT Supabase
 * - GET/PATCH /user/profile|/user/preferences
 * - GET /agent/chat history (web keeps client-side history)
 * - GET /agent/recommend (replaced by pending_actions mapping)
 * - GET /telegram/status|/unlink
 *
 * Env: VITE_API_URL (default http://localhost:3001/v1), VITE_USE_MOCKS
 */
export {}
