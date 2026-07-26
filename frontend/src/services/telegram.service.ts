import type { TelegramLinkRequest, TelegramLinkStatus } from '../types'
import { mockConfirmTelegramLink, mockGetTelegramStatus, mockRequestTelegramLink, mockUnlinkTelegram } from '../mocks/telegram.mock'
import { apiRequest } from './apiClient'
import { USE_MOCKS } from './config'

/**
 * Endpoint contract (PENDING VALIDATION WITH BACKEND + INTEGRACIONES). The frontend never
 * calls Telegram directly — always through these Backend-proxied endpoints:
 *   GET  /telegram/status      -> TelegramLinkStatus
 *   POST /telegram/link        -> TelegramLinkRequest (deep link the user opens)
 *   POST /telegram/unlink      -> TelegramLinkStatus
 */
export async function getLinkStatus(): Promise<TelegramLinkStatus> {
  if (USE_MOCKS) return mockGetTelegramStatus()
  return apiRequest<TelegramLinkStatus>('/telegram/status', { method: 'GET' })
}

export async function requestLink(): Promise<TelegramLinkRequest> {
  if (USE_MOCKS) return mockRequestTelegramLink()
  return apiRequest<TelegramLinkRequest>('/telegram/link', { method: 'POST' })
}

/** Mock-only helper to simulate the round trip of the user confirming inside Telegram. */
export async function confirmLinkForDemo(handle: string): Promise<TelegramLinkStatus> {
  if (USE_MOCKS) return mockConfirmTelegramLink(handle)
  return apiRequest<TelegramLinkStatus>('/telegram/status', { method: 'GET' })
}

export async function unlink(): Promise<TelegramLinkStatus> {
  if (USE_MOCKS) return mockUnlinkTelegram()
  return apiRequest<TelegramLinkStatus>('/telegram/unlink', { method: 'POST' })
}
