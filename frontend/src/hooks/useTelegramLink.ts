import { useCallback, useState } from 'react'
import { useAsync } from './useAsync'
import * as telegramService from '../services/telegram.service'
import { ApiError } from '../types/api'

export function useTelegramLink() {
  const { data, loading, error, refetch } = useAsync(() => telegramService.getLinkStatus(), [])
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const link = useCallback(async () => {
    setActionLoading(true)
    setActionError(null)
    try {
      const { linkUrl } = await telegramService.requestLink()
      window.open(linkUrl, '_blank', 'noopener,noreferrer')
      // Demo-only: the real flow waits for a Backend webhook once the user taps "Start"
      // inside Telegram. Here we simulate that confirmation immediately so the UI is
      // testable end-to-end without a live bot.
      await telegramService.confirmLinkForDemo('@usuario_finora')
      refetch()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'No se pudo iniciar la vinculación con Telegram.')
    } finally {
      setActionLoading(false)
    }
  }, [refetch])

  const unlink = useCallback(async () => {
    setActionLoading(true)
    setActionError(null)
    try {
      await telegramService.unlink()
      refetch()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'No se pudo desvincular Telegram.')
    } finally {
      setActionLoading(false)
    }
  }, [refetch])

  return { status: data, loading, error, refetch, link, unlink, actionLoading, actionError }
}
