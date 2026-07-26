import { useCallback, useState } from 'react'
import { useAsync } from './useAsync'
import * as agentService from '../services/agent.service'
import type { RecommendationAction } from '../types'
import { ApiError } from '../types/api'

export function useRecommendations() {
  const { data, loading, error, refetch } = useAsync(() => agentService.getRecommendations(), [])
  const [respondingId, setRespondingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const respond = useCallback(
    async (id: string, action: RecommendationAction) => {
      setRespondingId(id)
      setActionError(null)
      try {
        await agentService.respondToRecommendation(id, action)
        refetch()
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'No se pudo procesar la recomendación.'
        setActionError(message)
        // Se relanza para que quien dispara la confirmación (el modal) pueda
        // mantenerse abierto y mostrar el fallo en lugar de declarar éxito.
        throw new Error(message)
      } finally {
        setRespondingId(null)
      }
    },
    [refetch],
  )

  return { recommendations: data ?? [], loading, error, refetch, respond, respondingId, actionError }
}
