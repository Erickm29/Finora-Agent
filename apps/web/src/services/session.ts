/**
 * Local session bridge for API auth (X-User-Id) until Supabase JWT lands.
 * Used when VITE_USE_MOCKS=false.
 */
import type { User } from '../types'

const USER_ID_KEY = 'finora_user_id'
const USER_PROFILE_KEY = 'finora_user_profile'

export function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(USER_ID_KEY)
  if (!id || !isUuid(id)) {
    id = crypto.randomUUID()
    localStorage.setItem(USER_ID_KEY, id)
  }
  return id
}

export function getStoredUserId(): string | null {
  if (typeof window === 'undefined') return null
  const id = localStorage.getItem(USER_ID_KEY)
  return id && isUuid(id) ? id : null
}

export function setStoredUserId(id: string): void {
  localStorage.setItem(USER_ID_KEY, id)
}

export function clearSession(): void {
  localStorage.removeItem(USER_ID_KEY)
  localStorage.removeItem(USER_PROFILE_KEY)
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_PROFILE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function setStoredUser(user: User): void {
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user))
  localStorage.setItem(USER_ID_KEY, user.id)
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}
