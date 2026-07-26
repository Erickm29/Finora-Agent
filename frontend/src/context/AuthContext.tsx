import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import * as authService from '../services/auth.service'
import { registerUnauthorizedHandler } from '../services/apiClient'
import type { AuthCredentials, RegisterPayload, User } from '../types'
import { ApiError } from '../types/api'

type SessionStatus = 'checking' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  user: User | null
  status: SessionStatus
  pendingVerificationEmail: string | null
  loginWithCredentials: (credentials: AuthCredentials) => Promise<{ requiresEmailVerification: boolean }>
  registerAccount: (payload: RegisterPayload) => Promise<{ requiresEmailVerification: boolean }>
  verifyEmailCode: (code: string) => Promise<void>
  resendCode: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * PENDING VALIDATION WITH BACKEND (session transport):
 * This provider assumes the backend sets an httpOnly cookie on login/verify, so the
 * frontend never touches the raw token (safer against XSS than localStorage). `user` is
 * kept only in memory/React state and re-hydrated via `GET /me` on app boot. If the team
 * instead decides on a bearer token returned in the JSON body, `AuthResult.accessToken`
 * is already modeled in types/user.ts — it would need to be attached to `apiRequest` calls
 * (e.g. via a ref) instead of relying on cookies.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<SessionStatus>('checking')
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    authService.getSession().then((sessionUser) => {
      if (cancelled) return
      setUser(sessionUser)
      setStatus(sessionUser ? 'authenticated' : 'unauthenticated')
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      setUser(null)
      setStatus('unauthenticated')
      navigate('/login', { replace: true })
    })
  }, [navigate])

  const loginWithCredentials = useCallback(async (credentials: AuthCredentials) => {
    const result = await authService.login(credentials)
    if (result.requiresEmailVerification) {
      setPendingVerificationEmail(credentials.email)
      setStatus('unauthenticated')
    } else {
      setUser(result.user)
      setStatus('authenticated')
    }
    return { requiresEmailVerification: result.requiresEmailVerification }
  }, [])

  const registerAccount = useCallback(async (payload: RegisterPayload) => {
    const result = await authService.register(payload)
    setPendingVerificationEmail(payload.email)
    setStatus('unauthenticated')
    return { requiresEmailVerification: result.requiresEmailVerification }
  }, [])

  const verifyEmailCode = useCallback(
    async (code: string) => {
      if (!pendingVerificationEmail) {
        throw new ApiError('No hay un correo pendiente de verificación.', 400)
      }
      const result = await authService.verifyEmail({ email: pendingVerificationEmail, code })
      setUser(result.user)
      setStatus('authenticated')
      setPendingVerificationEmail(null)
    },
    [pendingVerificationEmail],
  )

  const resendCode = useCallback(async () => {
    if (!pendingVerificationEmail) throw new ApiError('No hay un correo pendiente de verificación.', 400)
    await authService.resendVerificationCode(pendingVerificationEmail)
  }, [pendingVerificationEmail])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
    setStatus('unauthenticated')
    navigate('/', { replace: true })
  }, [navigate])

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, pendingVerificationEmail, loginWithCredentials, registerAccount, verifyEmailCode, resendCode, logout }),
    [user, status, pendingVerificationEmail, loginWithCredentials, registerAccount, verifyEmailCode, resendCode, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
