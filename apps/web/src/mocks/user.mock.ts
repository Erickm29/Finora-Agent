import type { User, UserPreferences } from '../types'
import { ApiError } from '../types/api'
import { delay, getAccountByUserId, getPreferences, getSessionUserId, updateAccountUser, updatePreferences } from './store'

function requireUserId(): string {
  const userId = getSessionUserId()
  if (!userId) throw new ApiError('Sesión expirada. Vuelve a iniciar sesión.', 401)
  return userId
}

export async function mockGetProfile(): Promise<User> {
  const userId = requireUserId()
  const account = getAccountByUserId(userId)
  if (!account) throw await delay(new ApiError('No se encontró el perfil del usuario.', 404))
  return delay(account.user)
}

export async function mockUpdateProfile(patch: Partial<User>): Promise<User> {
  const userId = requireUserId()
  const updated = updateAccountUser(userId, patch)
  if (!updated) throw await delay(new ApiError('No se encontró el perfil del usuario.', 404))
  return delay(updated)
}

export async function mockGetPreferences(): Promise<UserPreferences> {
  const userId = requireUserId()
  return delay(getPreferences(userId))
}

export async function mockUpdatePreferences(patch: Partial<UserPreferences>): Promise<UserPreferences> {
  const userId = requireUserId()
  return delay(updatePreferences(userId, patch))
}
