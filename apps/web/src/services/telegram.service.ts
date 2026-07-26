import type { TelegramLinkRequest, TelegramLinkStatus } from '../types'
import {
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

interface LinkStatusResponse {
  linked: boolean
  handle: string | null
  telegram_user_id: number | null
  sync_active: boolean
}

/**
 * Telegram linking goes through the API only. El estado es el del servidor: la
 * vinculación la confirma el bot cuando el usuario abre el deep link, así que
 * el cliente no puede darla por hecha.
 */
export async function getLinkStatus(): Promise<TelegramLinkStatus> {
  if (USE_MOCKS) return mockGetTelegramStatus()

  const res = await apiRequest<LinkStatusResponse>('/account/telegram/status', {
    method: 'GET',
  })
  return {
    linked: res.linked,
    handle: res.handle,
    linkedAt: null,
    syncActive: res.sync_active,
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

export async function unlink(): Promise<TelegramLinkStatus> {
  if (USE_MOCKS) return mockUnlinkTelegram()

  await apiRequest('/account/telegram/unlink', { method: 'POST' })
  return {
    linked: false,
    handle: null,
    linkedAt: null,
    syncActive: false,
  }
}
