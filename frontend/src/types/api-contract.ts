/**
 * =============================================================================
 * API CONTRACT DRAFT — PENDING VALIDATION WITH BACKEND + INTEGRACIONES
 * =============================================================================
 * This file documents assumptions the frontend currently encodes in `services/`
 * and `types/`. Confirm each item in the integration meeting before flipping
 * `VITE_USE_MOCKS=false` in production.
 *
 * Auth / session
 * - Assumed: session via httpOnly cookie set by Backend on POST /login|/register
 *   (no Authorization bearer in localStorage). Confirm cookie domain / SameSite.
 * - Assumed bootstrap: GET /me returns the authenticated User or 401.
 * - Paths used: POST /login, POST /register, POST /auth/verify-email,
 *   POST /auth/resend-code, POST /logout, GET /me
 *
 * Goals
 * - POST /goal  body: CreateGoalPayload → Goal
 * - GET  /goal  → Goal[]
 * - Confirm currency codes, deadline ISO format, and whether monthlySuggested
 *   is computed server-side only (frontend currently displays whatever API returns).
 *
 * Agent
 * - GET  /agent/chat → ChatMessage[]
 * - POST /agent/chat { message } → ChatMessage (agent reply, optional action)
 * - POST /agent/chat/actions { messageId, action } → updated ChatMessage
 * - GET  /agent/recommend → Recommendation[]
 * - POST /agent/recommend/respond { id, decision }
 * - PENDING: /agent/prepare-operation for Wallbit confirm — UI modal exists but
 *   field coverage (sourceAccount, successProbability) is incomplete.
 *
 * Transactions
 * - GET /transactions → Transaction[]
 * - Confirm taxonomy of `type` / `direction` enums.
 *
 * User / preferences
 * - GET/PATCH /user/profile
 * - GET/PATCH /user/preferences
 *
 * Telegram (via Backend only — never direct)
 * - GET  /telegram/status → TelegramLinkStatus
 * - POST /telegram/link → TelegramLinkRequest { linkUrl, expiresAt }
 * - POST /telegram/unlink → TelegramLinkStatus
 * - Confirm whether frontend must poll status after opening the deep link, or
 *   Backend pushes confirmation (webhook → client refresh).
 *
 * Env (Vite, not Next.js)
 * - VITE_API_URL, VITE_USE_MOCKS (equivalent intent to NEXT_PUBLIC_* in the brief)
 */
export {}
