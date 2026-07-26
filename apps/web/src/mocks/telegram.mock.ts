import type { TelegramLinkRequest, TelegramLinkStatus } from '../types'
import { ApiError } from '../types/api'
import { delay, getSessionUserId, getTelegramStatus, setTelegramStatus } from './store'

function requireUserId(): string {
  const userId = getSessionUserId()
  if (!userId) throw new ApiError('Sesión expirada. Vuelve a iniciar sesión.', 401)
  return userId
}

export async function mockGetTelegramStatus(): Promise<TelegramLinkStatus> {
  const userId = requireUserId()
  return delay(getTelegramStatus(userId))
}

export async function mockRequestTelegramLink(): Promise<TelegramLinkRequest> {
  requireUserId()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
  return delay({ linkUrl: 'https://t.me/finora_bot?start=demo-link-token', expiresAt })
}

/** In a real integration this would be pushed by the Backend once Telegram confirms the
 *  link (webhook). The mock simulates the user completing that flow immediately. */
export async function mockConfirmTelegramLink(handle: string): Promise<TelegramLinkStatus> {
  const userId = requireUserId()
  const status: TelegramLinkStatus = { linked: true, handle, linkedAt: new Date().toISOString(), syncActive: true }
  setTelegramStatus(userId, status)
  return delay(status)
}

export async function mockUnlinkTelegram(): Promise<TelegramLinkStatus> {
  const userId = requireUserId()
  const status: TelegramLinkStatus = { linked: false, handle: null, linkedAt: null, syncActive: false }
  setTelegramStatus(userId, status)
  return delay(status)
}
