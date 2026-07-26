import { useCallback, useEffect, useRef, useState } from 'react'
import { useAsync } from './useAsync'
import * as telegramService from '../services/telegram.service'
import { ApiError } from '../types/api'

const POLL_INTERVAL_MS = 2500
const POLL_TIMEOUT_MS = 3 * 60 * 1000

export function useTelegramLink() {
  const { data, loading, error, refetch } = useAsync(() => telegramService.getLinkStatus(), [])
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [awaitingTelegram, setAwaitingTelegram] = useState(false)
  const pollRef = useRef<number | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current)
      pollRef.current = null
    }
    setAwaitingTelegram(false)
  }, [])

  useEffect(() => stopPolling, [stopPolling])

  const link = useCallback(async () => {
    setActionLoading(true)
    setActionError(null)
    try {
      const { linkUrl } = await telegramService.requestLink()
      window.open(linkUrl, '_blank', 'noopener,noreferrer')

      // Quien confirma la vinculación es el bot, cuando el usuario toca "Start".
      // El cliente no puede darla por hecha: consulta el estado real hasta que
      // el servidor la reporte.
      stopPolling()
      setAwaitingTelegram(true)
      const startedAt = Date.now()
      pollRef.current = window.setInterval(async () => {
        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          stopPolling()
          setActionError('No recibimos la confirmación desde Telegram. Generá un enlace nuevo e intentá otra vez.')
          return
        }
        try {
          const status = await telegramService.getLinkStatus()
          if (status.linked) {
            stopPolling()
            refetch()
          }
        } catch {
          // Fallo puntual de red: se reintenta en el próximo tick.
        }
      }, POLL_INTERVAL_MS)
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'No se pudo iniciar la vinculación con Telegram.')
    } finally {
      setActionLoading(false)
    }
  }, [refetch, stopPolling])

  const unlink = useCallback(async () => {
    setActionLoading(true)
    setActionError(null)
    stopPolling()
    try {
      await telegramService.unlink()
      refetch()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'No se pudo desvincular Telegram.')
    } finally {
      setActionLoading(false)
    }
  }, [refetch, stopPolling])

  return {
    status: data,
    loading,
    error,
    refetch,
    link,
    unlink,
    actionLoading,
    actionError,
    awaitingTelegram,
  }
}
