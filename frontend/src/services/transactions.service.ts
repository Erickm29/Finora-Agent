import type { Transaction } from '../types'
import { mockGetTransactions } from '../mocks/transactions.mock'
import { apiRequest } from './apiClient'
import { USE_MOCKS } from './config'

/**
 * Endpoint contract (PENDING VALIDATION — not in the original table, inferred from
 * "Historial: línea de tiempo o tabla de movimientos"):
 *   GET /transactions?goalId=<id>  -> Transaction[]
 */
export async function getTransactions(goalId?: string): Promise<Transaction[]> {
  if (USE_MOCKS) return mockGetTransactions(goalId)
  const query = goalId ? `?goalId=${encodeURIComponent(goalId)}` : ''
  return apiRequest<Transaction[]>(`/transactions${query}`, { method: 'GET' })
}
