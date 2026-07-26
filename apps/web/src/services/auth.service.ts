import type {
  AuthCredentials,
  AuthResult,
  RegisterPayload,
  User,
  VerifyEmailPayload,
} from '../types'
import {
  mockGetSession,
  mockLogin,
  mockLogout,
  mockRegister,
  mockResendVerificationCode,
  mockVerifyEmail,
} from '../mocks/auth.mock'
import { USE_MOCKS } from './config'
import {
  clearSession,
  getOrCreateUserId,
  getStoredUser,
  setStoredUser,
} from './session'

/**
 * Auth against real API is not available yet (JWT Supabase pendiente).
 * When USE_MOCKS=false we keep a local profile + UUID in localStorage and send
 * it as X-User-Id to the Hono API.
 */
export async function login(credentials: AuthCredentials): Promise<AuthResult> {
  if (USE_MOCKS) return mockLogin(credentials)

  const existing = getStoredUser()
  if (existing && existing.email.toLowerCase() === credentials.email.toLowerCase()) {
    return {
      user: existing,
      requiresEmailVerification: false,
    }
  }

  const user = buildLocalUser({
    fullName: credentials.email.split('@')[0] || 'Usuario Finora',
    email: credentials.email,
  })
  setStoredUser(user)
  return { user, requiresEmailVerification: false }
}

export async function register(payload: RegisterPayload): Promise<AuthResult> {
  if (USE_MOCKS) return mockRegister(payload)

  const user = buildLocalUser({
    fullName: payload.fullName,
    email: payload.email,
  })
  setStoredUser(user)
  // Skip OTP in local bridge — mark verified so onboarding can proceed.
  user.emailVerified = true
  setStoredUser(user)
  return { user, requiresEmailVerification: false }
}

export async function verifyEmail(payload: VerifyEmailPayload): Promise<AuthResult> {
  if (USE_MOCKS) return mockVerifyEmail(payload)

  const user = getStoredUser()
  if (!user || user.email.toLowerCase() !== payload.email.toLowerCase()) {
    const created = buildLocalUser({
      fullName: payload.email.split('@')[0] || 'Usuario Finora',
      email: payload.email,
    })
    created.emailVerified = true
    setStoredUser(created)
    return { user: created, requiresEmailVerification: false }
  }
  user.emailVerified = true
  setStoredUser(user)
  return { user, requiresEmailVerification: false }
}

export async function resendVerificationCode(email: string): Promise<void> {
  if (USE_MOCKS) return mockResendVerificationCode(email)
  // No-op for local bridge
  void email
}

export async function getSession(): Promise<User | null> {
  if (USE_MOCKS) return mockGetSession()
  const user = getStoredUser()
  if (user) return user
  // Ensure a stable UUID exists for anonymous API calls after hard refresh mid-flow
  getOrCreateUserId()
  return null
}

export async function logout(): Promise<void> {
  if (USE_MOCKS) return mockLogout()
  clearSession()
}

function buildLocalUser(input: { fullName: string; email: string }): User {
  return {
    id: crypto.randomUUID(),
    fullName: input.fullName,
    email: input.email,
    country: 'Bolivia',
    timezone: '(GMT-4) La Paz, Bolivia',
    avatarUrl: null,
    proAccount: false,
    emailVerified: true,
    createdAt: new Date().toISOString(),
  }
}
