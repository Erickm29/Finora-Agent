import type { TelegramLinkRequest, TelegramLinkStatus } from '../types'
import {
  mockConfirmTelegramLink,
  mockGetTelegramStatus,
  mockRequestTelegramLink,
  mockUnlinkTelegram,
} from '../mocks/telegram.mock'
import { apiRequest } from './apiClient'
import { USE_MOCKS } from './config'

interface LinkTokenResponse {
  token: string
  deep_link: string
  expires_at: string
}

/**
 * Telegram linking goes through the API only.
 * Real endpoint today: POST /v1/account/telegram/link-token
 * status/unlink: not fully implemented server-side — graceful local fallback.
 */
export async function getLinkStatus(): Promise<TelegramLinkStatus> {
  if (USE_MOCKS) return mockGetTelegramStatus()

  const linked = localStorage.getItem('finora_telegram_linked') === 'true'
  const handle = localStorage.getItem('finora_telegram_handle')
  return {
    linked,
    handle: linked ? handle : null,
    linkedAt: linked ? localStorage.getItem('finora_telegram_linked_at') : null,
    syncActive: linked,
  }
}

export async function requestLink(): Promise<TelegramLinkRequest> {
  if (USE_MOCKS) return mockRequestTelegramLink()

  const res = await apiRequest<LinkTokenResponse>('/account/telegram/link-token', {
    method: 'POST',
  })
  return {
    linkUrl: res.deep_link,
    expiresAt: res.expires_at,
  }
}

/** Mock-only helper to simulate confirming inside Telegram. */
export async function confirmLinkForDemo(handle: string): Promise<TelegramLinkStatus> {
  if (USE_MOCKS) return mockConfirmTelegramLink(handle)

  localStorage.setItem('finora_telegram_linked', 'true')
  localStorage.setItem('finora_telegram_handle', handle)
  localStorage.setItem('finora_telegram_linked_at', new Date().toISOString())
  return getLinkStatus()
}

export async function unlink(): Promise<TelegramLinkStatus> {
  if (USE_MOCKS) return mockUnlinkTelegram()

  localStorage.removeItem('finora_telegram_linked')
  localStorage.removeItem('finora_telegram_handle')
  localStorage.removeItem('finora_telegram_linked_at')
  return {
    linked: false,
    handle: null,
    linkedAt: null,
    syncActive: false,
  }
}
