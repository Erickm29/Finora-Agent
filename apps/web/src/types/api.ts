/**
 * Generic API error surfaced by services/apiClient.ts so every screen can render
 * a consistent error state instead of letting `fetch` rejections leak raw shapes.
 */
export class ApiError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export function isUnauthorized(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 401
}
