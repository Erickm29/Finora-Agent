import { ApiError } from '../types/api'
import { API_BASE_URL } from './config'

type UnauthorizedHandler = () => void

let unauthorizedHandler: UnauthorizedHandler | null = null

/**
 * Registered once by AuthContext on app boot. Lets the transport layer react to a 401
 * (clear session + redirect to /login) without every service/page having to check for it
 * manually — centralizes "manejo de sesión expirada" as required by the spec.
 */
export function registerUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  /** Optional bearer token, only needed if the Backend ends up choosing header auth
   *  instead of httpOnly cookies (see AuthContext PENDING VALIDATION note). */
  accessToken?: string | null
}

/**
 * Thin fetch wrapper used by every `services/*.ts` file when `USE_MOCKS` is false.
 *
 * PENDING VALIDATION WITH BACKEND:
 * - Auth transport: this defaults to `credentials: 'include'` assuming httpOnly cookies
 *   set by the backend on `/login`. If the team instead returns a bearer token in the
 *   response body, pass it via `accessToken` and it will be sent as `Authorization: Bearer`.
 * - Error envelope shape: assumed `{ message: string, ...rest }`; adjust `parseErrorMessage`
 *   once the real error format is confirmed.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, accessToken, headers, ...rest } = options

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
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
    const data = await response.json()
    if (typeof data?.message === 'string') return data.message
  } catch {
    // response had no JSON body — fall through to the generic message below.
  }
  return `No se pudo conectar con el servidor (código ${response.status}).`
}
