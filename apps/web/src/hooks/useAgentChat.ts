import { useCallback, useEffect, useState } from 'react'
import * as agentService from '../services/agent.service'
import type { ChatActionResponsePayload, ChatMessage } from '../types'
import { ApiError } from '../types/api'

export function useAgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    agentService
      .getChatHistory()
      .then((history) => {
        if (!cancelled) setMessages(history)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'No se pudo cargar la conversación.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return
    setSending(true)
    setError(null)
    try {
      const updated = await agentService.sendMessage({ text })
      setMessages(updated)
    } catch (err) {
      setError(readErrorMessage(err, 'No se pudo enviar el mensaje. Intenta de nuevo.'))
    } finally {
      setSending(false)
    }
  }, [])

  const resolveAction = useCallback(async (payload: ChatActionResponsePayload) => {
    setError(null)
    try {
      const confirmation = await agentService.respondToChatAction(payload)
      // La acción se marca como resuelta recién cuando el backend respondió: si
      // se marcara antes, un fallo dejaría al usuario viendo "Confirmaste esta
      // operación" sobre algo que nunca se ejecutó.
      setMessages((prev) => [
        ...prev.map((msg) =>
          msg.id === payload.messageId
            ? { ...msg, actionResolution: mapActionToResolution(payload.action) }
            : msg,
        ),
        confirmation,
      ])
    } catch (err) {
      setError(readErrorMessage(err, 'No se pudo procesar tu respuesta.'))
    }
  }, [])

  return { messages, loading, sending, error, sendMessage, resolveAction }
}

function readErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error && err.message) return err.message
  return fallback
}

function mapActionToResolution(action: ChatActionResponsePayload['action']): NonNullable<ChatMessage['actionResolution']> {
  if (action === 'accept') return 'accepted'
  if (action === 'reject') return 'rejected'
  if (action === 'confirm') return 'confirmed'
  return 'cancelled'
}
