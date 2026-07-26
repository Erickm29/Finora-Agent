import { useCallback, useEffect, useRef, useState } from 'react'
import type { GoalInvestmentAnalysis } from '../types'
import { ApiError } from '../types/api'
import * as analysisService from '../services/analysis.service'

const POLL_INTERVAL_MS = 4000
/** El pipeline rara vez pasa de 30s; después de esto dejamos de insistir. */
const POLL_TIMEOUT_MS = 120_000

interface UseGoalAnalysisResult {
  analysis: GoalInvestmentAnalysis | null
  loading: boolean
  /** El backend todavía está razonando. */
  pending: boolean
  refreshing: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Lee el análisis de inversión de una meta y sigue consultando mientras el
 * pipeline esté en curso, para que el plan aparezca solo cuando esté listo.
 */
export function useGoalAnalysis(goalId: string | null): UseGoalAnalysisResult {
  const [analysis, setAnalysis] = useState<GoalInvestmentAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    clearTimer()
    setAnalysis(null)
    setError(null)

    if (!goalId) {
      setLoading(false)
      return
    }

    let active = true
    const startedAt = Date.now()
    setLoading(true)

    const poll = async () => {
      try {
        const result = await analysisService.getGoalAnalysis(goalId)
        if (!active) return
        setAnalysis(result)
        setError(null)

        const expired = Date.now() - startedAt > POLL_TIMEOUT_MS
        if (result.status === 'pending' && !expired) {
          timerRef.current = setTimeout(poll, POLL_INTERVAL_MS)
          return
        }
      } catch (err) {
        if (!active) return
        // Un análisis que no carga no debe romper la pantalla: mostramos el
        // aviso y dejamos de insistir.
        setError(err instanceof ApiError ? err.message : 'No pudimos cargar el análisis.')
      }
      if (active) setLoading(false)
    }

    void poll()

    return () => {
      active = false
      clearTimer()
    }
  }, [goalId, clearTimer])

  const refresh = useCallback(async () => {
    if (!goalId || refreshing) return
    setRefreshing(true)
    setError(null)
    try {
      const result = await analysisService.refreshGoalAnalysis(goalId)
      setAnalysis(result)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos actualizar el análisis.')
    } finally {
      setRefreshing(false)
    }
  }, [goalId, refreshing])

  return {
    analysis,
    loading,
    pending: analysis?.status === 'pending' || (loading && !analysis),
    refreshing,
    error,
    refresh,
  }
}
