/**
 * User & session contracts.
 *
 * PENDING VALIDATION WITH BACKEND:
 * - Exact field names (`fullName` vs `name` / `first_name`+`last_name`).
 * - Whether `id` is a UUID (string) or numeric — assumed UUID string (Supabase convention).
 * - Whether the session is delivered as an httpOnly cookie (assumed, see services/apiClient.ts)
 *   or as a bearer token returned in the JSON body.
 */
export interface User {
  id: string
  fullName: string
  email: string
  country: string
  timezone: string
  avatarUrl: string | null
  proAccount: boolean
  emailVerified: boolean
  createdAt: string // ISO date
}

export type PreferredCurrency = 'BOB' | 'USD' | 'EUR'

export type RecommendationFrequency = 'daily' | 'weekly' | 'realtime'

export interface UserPreferences {
  currency: PreferredCurrency
  notificationsEnabled: boolean
  recommendationFrequency: RecommendationFrequency
  extremeVolatilityAlerts: boolean
  dailyAiSummary: boolean
  liquidationAlerts: boolean
  achievableGoalSuggestions: boolean
}

export interface AuthCredentials {
  email: string
  password: string
}

export interface RegisterPayload {
  fullName: string
  email: string
  password: string
}

export interface AuthResult {
  user: User
  /**
   * Present only if the backend chooses header-based auth instead of httpOnly cookies.
   * PENDING VALIDATION: confirm auth strategy with Backend before relying on this field.
   */
  accessToken?: string
  requiresEmailVerification: boolean
}

export interface VerifyEmailPayload {
  email: string
  code: string
}
