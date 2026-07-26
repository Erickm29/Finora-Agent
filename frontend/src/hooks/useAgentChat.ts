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
      setError(err instanceof ApiError ? err.message : 'No se pudo enviar el mensaje. Intenta de nuevo.')
    } finally {
      setSending(false)
    }
  }, [])

  const resolveAction = useCallback(async (payload: ChatActionResponsePayload) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === payload.messageId
          ? { ...msg, actionResolution: mapActionToResolution(payload.action) }
          : msg,
      ),
    )
    try {
      const confirmation = await agentService.respondToChatAction(payload)
      setMessages((prev) => [...prev, confirmation])
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo procesar tu respuesta.')
    }
  }, [])

  return { messages, loading, sending, error, sendMessage, resolveAction }
}

function mapActionToResolution(action: ChatActionResponsePayload['action']): NonNullable<ChatMessage['actionResolution']> {
  if (action === 'accept') return 'accepted'
  if (action === 'reject') return 'rejected'
  if (action === 'confirm') return 'confirmed'
  return 'cancelled'
}
