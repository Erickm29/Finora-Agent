import { useCallback, useState } from 'react'
import { useAsync } from './useAsync'
import { cancelGoal as cancelGoalService, getGoals, setPrimaryGoal as setPrimaryGoalService } from '../services/goals.service'
import { ApiError } from '../types/api'

export function useGoals() {
  const { data, loading, error, refetch } = useAsync(() => getGoals(), [])
  const [mutatingId, setMutatingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const cancelGoal = useCallback(
    async (id: string) => {
      setMutatingId(id)
      setActionError(null)
      try {
        await cancelGoalService(id)
        refetch()
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'No se pudo eliminar la meta.'
        setActionError(message)
        throw new Error(message)
      } finally {
        setMutatingId(null)
      }
    },
    [refetch],
  )

  const setPrimary = useCallback(
    async (id: string) => {
      setMutatingId(id)
      setActionError(null)
      try {
        await setPrimaryGoalService(id)
        refetch()
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'No se pudo marcar la meta como prioritaria.'
        setActionError(message)
        throw new Error(message)
      } finally {
        setMutatingId(null)
      }
    },
    [refetch],
  )

  return { data, loading, error, refetch, cancelGoal, setPrimary, mutatingId, actionError }
}
