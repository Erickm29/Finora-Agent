import type { AuthCredentials, AuthResult, RegisterPayload, User, VerifyEmailPayload } from '../types'
import { ApiError } from '../types/api'
import {
  consumeVerificationCode,
  createAccount,
  delay,
  findAccountByEmail,
  nowIso,
  setSessionUserId,
  setVerificationCode,
  uid,
} from './store'

export async function mockRegister(payload: RegisterPayload): Promise<AuthResult> {
  if (findAccountByEmail(payload.email)) {
    throw await delay(new ApiError('Ya existe una cuenta con este correo.', 409))
  }

  const user: User = {
    id: uid('user'),
    fullName: payload.fullName,
    email: payload.email,
    country: 'España',
    timezone: '(GMT+1) Madrid, España',
    avatarUrl: null,
    proAccount: false,
    emailVerified: false,
    createdAt: nowIso(),
  }

  createAccount(user, payload.password)
  const code = generateCode()
  setVerificationCode(user.email, code)
  console.info(`[mock] Código de verificación para ${user.email}: ${code}`)

  return delay({ user, requiresEmailVerification: true })
}

export async function mockLogin(credentials: AuthCredentials): Promise<AuthResult> {
  const account = findAccountByEmail(credentials.email)
  if (!account || account.password !== credentials.password) {
    throw await delay(new ApiError('Correo o contraseña incorrectos.', 401))
  }

  setSessionUserId(account.user.id)
  return delay({ user: account.user, requiresEmailVerification: !account.user.emailVerified })
}

export async function mockVerifyEmail(payload: VerifyEmailPayload): Promise<AuthResult> {
  const account = findAccountByEmail(payload.email)
  if (!account) {
    throw await delay(new ApiError('No encontramos una cuenta con este correo.', 404))
  }

  const isValid = consumeVerificationCode(payload.email, payload.code)
  if (!isValid) {
    throw await delay(new ApiError('El código ingresado no es válido.', 400))
  }

  account.user.emailVerified = true
  setSessionUserId(account.user.id)
  return delay({ user: account.user, requiresEmailVerification: false })
}

export async function mockResendVerificationCode(email: string): Promise<void> {
  const account = findAccountByEmail(email)
  if (!account) throw await delay(new ApiError('No encontramos una cuenta con este correo.', 404))
  const code = generateCode()
  setVerificationCode(email, code)
  console.info(`[mock] Nuevo código de verificación para ${email}: ${code}`)
  return delay(undefined)
}

export async function mockGetSession(): Promise<User | null> {
  return delay(null, 150) // mock never persists sessions across reloads — see store.ts note
}

export async function mockLogout(): Promise<void> {
  setSessionUserId(null)
  return delay(undefined, 150)
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
