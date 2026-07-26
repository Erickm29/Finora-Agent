import type { User, UserPreferences } from '../types'
import {
  mockGetPreferences,
  mockGetProfile,
  mockUpdatePreferences,
  mockUpdateProfile,
} from '../mocks/user.mock'
import { USE_MOCKS } from './config'
import { getStoredUser, setStoredUser } from './session'

const PREFS_KEY = 'finora_user_preferences'

const defaultPreferences: UserPreferences = {
  currency: 'BOB',
  notificationsEnabled: true,
  recommendationFrequency: 'daily',
  extremeVolatilityAlerts: true,
  dailyAiSummary: true,
  liquidationAlerts: true,
  achievableGoalSuggestions: true,
}

/**
 * Profile/preferences: no dedicated API endpoints yet.
 * When USE_MOCKS=false, persist locally alongside the session bridge.
 */
export async function getProfile(): Promise<User> {
  if (USE_MOCKS) return mockGetProfile()
  const user = getStoredUser()
  if (!user) throw new Error('No hay sesión local. Iniciá sesión de nuevo.')
  return user
}

export async function updateProfile(patch: Partial<User>): Promise<User> {
  if (USE_MOCKS) return mockUpdateProfile(patch)
  const current = getStoredUser()
  if (!current) throw new Error('No hay sesión local. Iniciá sesión de nuevo.')
  const next = { ...current, ...patch, id: current.id }
  setStoredUser(next)
  return next
}

export async function getPreferences(): Promise<UserPreferences> {
  if (USE_MOCKS) return mockGetPreferences()
  const raw = localStorage.getItem(PREFS_KEY)
  if (!raw) return { ...defaultPreferences }
  try {
    return { ...defaultPreferences, ...(JSON.parse(raw) as UserPreferences) }
  } catch {
    return { ...defaultPreferences }
  }
}

export async function updatePreferences(
  patch: Partial<UserPreferences>,
): Promise<UserPreferences> {
  if (USE_MOCKS) return mockUpdatePreferences(patch)
  const current = await getPreferences()
  const next = { ...current, ...patch }
  localStorage.setItem(PREFS_KEY, JSON.stringify(next))
  return next
}
