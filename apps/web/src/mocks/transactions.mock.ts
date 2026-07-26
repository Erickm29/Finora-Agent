import type { Transaction } from '../types'
import { ApiError } from '../types/api'
import { delay, getSessionUserId, getTransactions } from './store'

export async function mockGetTransactions(goalId?: string): Promise<Transaction[]> {
  const userId = getSessionUserId()
  if (!userId) throw new ApiError('Sesión expirada. Vuelve a iniciar sesión.', 401)

  const all = getTransactions(userId)
  return delay(goalId ? all.filter((tx) => tx.goalId === goalId) : all)
}
