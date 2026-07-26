import type { AuthCredentials, AuthResult, RegisterPayload, User, VerifyEmailPayload } from '../types'
import { mockGetSession, mockLogin, mockLogout, mockRegister, mockResendVerificationCode, mockVerifyEmail } from '../mocks/auth.mock'
import { apiRequest } from './apiClient'
import { USE_MOCKS } from './config'

/**
 * Endpoint contract (PENDING VALIDATION WITH BACKEND — see table in the product spec):
 *   POST /login              -> AuthResult
 *   POST /register           -> AuthResult   (exact path name "a confirmar" per spec)
 *   POST /verify-email       -> AuthResult   (path not in the original table; inferred)
 *   POST /verify-email/resend -> void
 *   GET  /me                 -> User | 401   (used to restore session on app boot)
 *   POST /logout             -> void
 */
export async function login(credentials: AuthCredentials): Promise<AuthResult> {
  if (USE_MOCKS) return mockLogin(credentials)
  return apiRequest<AuthResult>('/login', { method: 'POST', body: credentials })
}

export async function register(payload: RegisterPayload): Promise<AuthResult> {
  if (USE_MOCKS) return mockRegister(payload)
  return apiRequest<AuthResult>('/register', { method: 'POST', body: payload })
}

export async function verifyEmail(payload: VerifyEmailPayload): Promise<AuthResult> {
  if (USE_MOCKS) return mockVerifyEmail(payload)
  return apiRequest<AuthResult>('/verify-email', { method: 'POST', body: payload })
}

export async function resendVerificationCode(email: string): Promise<void> {
  if (USE_MOCKS) return mockResendVerificationCode(email)
  return apiRequest<void>('/verify-email/resend', { method: 'POST', body: { email } })
}

export async function getSession(): Promise<User | null> {
  if (USE_MOCKS) return mockGetSession()
  try {
    return await apiRequest<User>('/me', { method: 'GET' })
  } catch {
    return null
  }
}

export async function logout(): Promise<void> {
  if (USE_MOCKS) return mockLogout()
  return apiRequest<void>('/logout', { method: 'POST' })
}
