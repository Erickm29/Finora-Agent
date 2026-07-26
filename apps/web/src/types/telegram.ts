/**
 * PENDING VALIDATION WITH BACKEND / INTEGRACIONES:
 * - The frontend never talks to Telegram directly; this always goes through the Backend.
 * - Assumed the link flow is "deep link" based (bot start payload), not a raw numeric code.
 *   Confirm exact field names and whether polling `getLinkStatus` is required or the
 *   backend pushes an update (e.g. websocket/SSE) once the user confirms in Telegram.
 */
export interface TelegramLinkStatus {
  linked: boolean
  handle: string | null
  linkedAt: string | null // ISO date
  syncActive: boolean
}

export interface TelegramLinkRequest {
  linkUrl: string
  expiresAt: string // ISO date
}
