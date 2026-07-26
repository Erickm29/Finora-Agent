import type { DigestLocalTime, User, UserPreferences } from '../types'
import {
  mockGetPreferences,
  mockGetProfile,
  mockUpdatePreferences,
  mockUpdateProfile,
} from '../mocks/user.mock'
import { USE_MOCKS } from './config'
import { apiRequest } from './apiClient'
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
  digestEnabled: false,
  digestLocalTime: '08:00',
  timezone: 'America/La_Paz',
}

type ApiPreferences = {
  digest_enabled?: boolean
  digest_local_time?: DigestLocalTime
  timezone?: string
  last_digest_date?: string | null
}

function fromApi(api: ApiPreferences, base: UserPreferences = defaultPreferences): UserPreferences {
  return {
    ...base,
    digestEnabled: api.digest_enabled ?? base.digestEnabled,
    digestLocalTime: api.digest_local_time ?? base.digestLocalTime,
    timezone: api.timezone ?? base.timezone,
  }
}

function toApiPatch(patch: Partial<UserPreferences>): ApiPreferences {
  const body: ApiPreferences = {}
  if (patch.digestEnabled !== undefined) body.digest_enabled = patch.digestEnabled
  if (patch.digestLocalTime !== undefined) body.digest_local_time = patch.digestLocalTime
  if (patch.timezone !== undefined) body.timezone = patch.timezone
  return body
}

function readLocalPrefs(): UserPreferences {
  const raw = localStorage.getItem(PREFS_KEY)
  if (!raw) return { ...defaultPreferences }
  try {
    return { ...defaultPreferences, ...(JSON.parse(raw) as UserPreferences) }
  } catch {
    return { ...defaultPreferences }
  }
}

function writeLocalPrefs(prefs: UserPreferences) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

/**
 * Profile: sigue en sesión local (sin endpoint de perfil en MVP).
 * Preferencias digest: API `/v1/preferences` cuando USE_MOCKS=false.
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
  const local = readLocalPrefs()
  try {
    const res = await apiRequest<{ preferences: ApiPreferences }>('/preferences', {
      method: 'GET',
    })
    const merged = fromApi(res.preferences, local)
    writeLocalPrefs(merged)
    return merged
  } catch {
    // Si la API no responde, no bloqueamos la UI de settings.
    return local
  }
}

export async function updatePreferences(
  patch: Partial<UserPreferences>,
): Promise<UserPreferences> {
  if (USE_MOCKS) return mockUpdatePreferences(patch)
  const current = await getPreferences()
  const next = { ...current, ...patch }
  writeLocalPrefs(next)

  const apiPatch = toApiPatch(patch)
  if (Object.keys(apiPatch).length > 0) {
    try {
      const res = await apiRequest<{ preferences: ApiPreferences }>('/preferences', {
        method: 'PATCH',
        body: apiPatch,
      })
      const merged = fromApi(res.preferences, next)
      writeLocalPrefs(merged)
      return merged
    } catch (err) {
      // Revertir UI local si el backend rechaza el patch digest.
      writeLocalPrefs(current)
      throw err
    }
  }
  return next
}

export const DIGEST_TIME_OPTIONS: { value: DigestLocalTime; label: string }[] = [
  { value: '08:00', label: '08:00' },
  { value: '12:00', label: '12:00' },
  { value: '18:00', label: '18:00' },
  { value: '21:00', label: '21:00' },
]
