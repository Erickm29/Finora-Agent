import type { User, UserPreferences } from '../types'
import { mockGetPreferences, mockGetProfile, mockUpdatePreferences, mockUpdateProfile } from '../mocks/user.mock'
import { apiRequest } from './apiClient'
import { USE_MOCKS } from './config'

/**
 * Endpoint contract (PENDING VALIDATION — not in the original table, inferred from the
 * "Configuración: Perfil / Preferencias" requirement):
 *   GET   /user/profile      -> User
 *   PATCH /user/profile      -> User
 *   GET   /user/preferences  -> UserPreferences
 *   PATCH /user/preferences  -> UserPreferences
 */
export async function getProfile(): Promise<User> {
  if (USE_MOCKS) return mockGetProfile()
  return apiRequest<User>('/user/profile', { method: 'GET' })
}

export async function updateProfile(patch: Partial<User>): Promise<User> {
  if (USE_MOCKS) return mockUpdateProfile(patch)
  return apiRequest<User>('/user/profile', { method: 'PATCH', body: patch })
}

export async function getPreferences(): Promise<UserPreferences> {
  if (USE_MOCKS) return mockGetPreferences()
  return apiRequest<UserPreferences>('/user/preferences', { method: 'GET' })
}

export async function updatePreferences(patch: Partial<UserPreferences>): Promise<UserPreferences> {
  if (USE_MOCKS) return mockUpdatePreferences(patch)
  return apiRequest<UserPreferences>('/user/preferences', { method: 'PATCH', body: patch })
}
