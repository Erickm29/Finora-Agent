import type {
  ChatActionResponsePayload,
  ChatMessage,
  Recommendation,
  RecommendationAction,
  SendMessagePayload,
} from '../types'
import {
  mockGetChatHistory,
  mockRespondToChatAction,
  mockSendMessage,
} from '../mocks/agent.mock'
import { apiRequest } from './apiClient'
import { USE_MOCKS } from './config'
import {
  getRecommendations as getPendingAsRecommendations,
  respondToRecommendation as respondPendingAsRecommendation,
} from './actions.service'

interface AgentTurnResponse {
  sessionId: string
  replies: Array<{
    type: string
    text: string
    buttons?: Array<{ label: string; callbackData: string }>
  }>
}

/** In-memory chat transcript for the web session (API has no GET /agent/chat yet). */
let webChatHistory: ChatMessage[] = []

/** Callbacks from agent replies keyed by message id (confirm/cancel pending_actions). */
const messageCallbacks = new Map<string, { confirm: string; cancel: string }>()

/**
 * Web chat maps to POST /v1/agent/turn.
 * History is kept client-side until a dedicated history endpoint exists for web.
 */
export async function getChatHistory(): Promise<ChatMessage[]> {
  if (USE_MOCKS) return mockGetChatHistory()
  return [...webChatHistory]
}

export async function sendMessage(payload: SendMessagePayload): Promise<ChatMessage[]> {
  if (USE_MOCKS) return mockSendMessage(payload)

  const now = new Date().toISOString()
  const userMsg: ChatMessage = {
    id: crypto.randomUUID(),
    from: 'user',
    text: payload.text,
    createdAt: now,
  }
  webChatHistory = [...webChatHistory, userMsg]

  const result = await apiRequest<AgentTurnResponse>('/agent/turn', {
    method: 'POST',
    body: {
      channel: 'web',
      text: payload.text,
      message: payload.text,
    },
  })

  const agentMsgs = result.replies.map((reply) => mapReplyToMessage(reply))
  webChatHistory = [...webChatHistory, ...agentMsgs]
  return [...webChatHistory]
}

export async function respondToChatAction(
  payload: ChatActionResponsePayload,
): Promise<ChatMessage> {
  if (USE_MOCKS) return mockRespondToChatAction(payload)

  const callbacks = messageCallbacks.get(payload.messageId)
  const wantConfirm = payload.action === 'confirm' || payload.action === 'accept'
  const callback = callbacks
    ? wantConfirm
      ? callbacks.confirm
      : callbacks.cancel
    : null

  if (callback) {
    const result = await apiRequest<AgentTurnResponse>('/agent/turn', {
      method: 'POST',
      body: {
        channel: 'web',
        text: null,
        callbackData: callback,
      },
    })
    const confirmation = mapReplyToMessage(
      result.replies[0] ?? {
        type: 'text',
        text: wantConfirm ? 'Acción confirmada.' : 'Acción cancelada.',
      },
    )
    webChatHistory = [...webChatHistory, confirmation]
    return confirmation
  }

  const confirmation: ChatMessage = {
    id: crypto.randomUUID(),
    from: 'agent',
    text: wantConfirm ? 'Listo. Acción confirmada.' : 'Acción cancelada. Vos decidís.',
    createdAt: new Date().toISOString(),
  }
  webChatHistory = [...webChatHistory, confirmation]
  return confirmation
}

export async function getRecommendations(): Promise<Recommendation[]> {
  return getPendingAsRecommendations()
}

export async function respondToRecommendation(
  id: string,
  action: RecommendationAction,
): Promise<Recommendation> {
  return respondPendingAsRecommendation(id, action)
}

function mapReplyToMessage(reply: {
  type: string
  text: string
  buttons?: Array<{ label: string; callbackData: string }>
}): ChatMessage {
  const id = crypto.randomUUID()
  const confirmBtn = reply.buttons?.find((b) =>
    /confirm/i.test(b.callbackData),
  )
  const cancelBtn = reply.buttons?.find((b) => /cancel/i.test(b.callbackData))

  if (confirmBtn && cancelBtn) {
    messageCallbacks.set(id, {
      confirm: confirmBtn.callbackData,
      cancel: cancelBtn.callbackData,
    })
  }

  const message: ChatMessage = {
    id,
    from: 'agent',
    text: reply.text,
    createdAt: new Date().toISOString(),
  }

  if (confirmBtn && cancelBtn) {
    message.action = {
      type: 'micro_saving_proposal',
      data: {
        goalId: '',
        goalName: 'Meta',
        amount: 0,
        currency: 'BOB',
      },
    }
  }

  return message
}
