import { useAsync } from './useAsync'
import { getTransactions } from '../services/transactions.service'

export function useTransactions(goalId?: string) {
  return useAsync(() => getTransactions(goalId), [goalId])
}
