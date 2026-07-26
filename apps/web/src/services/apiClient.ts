import { ApiError } from '../types/api'
import { API_BASE_URL } from './config'
import { getOrCreateUserId } from './session'

type UnauthorizedHandler = () => void

let unauthorizedHandler: UnauthorizedHandler | null = null

/**
 * Registered once by AuthContext on app boot.
 */
export function registerUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  /** Optional override; defaults to local session UUID (X-User-Id / Bearer). */
  accessToken?: string | null
  /** Skip attaching auth headers (unused today; reserved). */
  skipAuth?: boolean
}

/**
 * Thin fetch wrapper for every `services/*.ts` call when `USE_MOCKS` is false.
 *
 * Auth (local): sends `X-User-Id` + `Authorization: Bearer <uuid>` until Supabase JWT.
 * Errors: parses Finora envelope `{ error: { message } }`.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, accessToken, headers, skipAuth, ...rest } = options
  const userId = skipAuth ? null : (accessToken ?? getOrCreateUserId())

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    // Auth va en X-User-Id / Bearer; no usamos cookies de sesión cross-origin.
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(userId
        ? {
            'X-User-Id': userId,
            Authorization: `Bearer ${userId}`,
          }
        : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 401) {
    unauthorizedHandler?.()
    throw new ApiError('Sesión expirada. Vuelve a iniciar sesión.', 401)
  }

  if (!response.ok) {
    const message = await parseErrorMessage(response)
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as {
      message?: string
      error?: { message?: string; code?: string }
    }
    if (typeof data?.error?.message === 'string') return data.error.message
    if (typeof data?.message === 'string') return data.message
  } catch {
    // no JSON body
  }
  return `No se pudo conectar con el servidor (código ${response.status}).`
}
