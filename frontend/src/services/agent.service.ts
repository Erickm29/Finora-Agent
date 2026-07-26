import type {
  ChatActionResponsePayload,
  ChatMessage,
  Recommendation,
  RecommendationAction,
  SendMessagePayload,
} from '../types'
import {
  mockGetChatHistory,
  mockGetRecommendations,
  mockRespondToChatAction,
  mockRespondToRecommendation,
  mockSendMessage,
} from '../mocks/agent.mock'
import { apiRequest } from './apiClient'
import { USE_MOCKS } from './config'

/**
 * Endpoint contract (PENDING VALIDATION WITH BACKEND):
 *   GET  /agent/chat                 -> ChatMessage[]  (history, not in original table —
 *                                        inferred so the chat view survives a refresh)
 *   POST /agent/chat                 -> ChatMessage[]  (assumed array, see types/chat.ts)
 *   POST /agent/chat/action          -> ChatMessage    (user responds to an embedded action)
 *   GET  /agent/recommend            -> Recommendation[]
 *   POST /agent/recommend/{id}/respond -> Recommendation
 *   POST /agent/prepare-operation    -> handled inline via the wallbit_confirmation chat
 *                                        action for now; a dedicated flow can be split out
 *                                        once the Backend defines the exact multi-step shape.
 */
export async function getChatHistory(): Promise<ChatMessage[]> {
  if (USE_MOCKS) return mockGetChatHistory()
  return apiRequest<ChatMessage[]>('/agent/chat', { method: 'GET' })
}

export async function sendMessage(payload: SendMessagePayload): Promise<ChatMessage[]> {
  if (USE_MOCKS) return mockSendMessage(payload)
  return apiRequest<ChatMessage[]>('/agent/chat', { method: 'POST', body: payload })
}

export async function respondToChatAction(payload: ChatActionResponsePayload): Promise<ChatMessage> {
  if (USE_MOCKS) return mockRespondToChatAction(payload)
  return apiRequest<ChatMessage>('/agent/chat/action', { method: 'POST', body: payload })
}

export async function getRecommendations(): Promise<Recommendation[]> {
  if (USE_MOCKS) return mockGetRecommendations()
  return apiRequest<Recommendation[]>('/agent/recommend', { method: 'GET' })
}

export async function respondToRecommendation(id: string, action: RecommendationAction): Promise<Recommendation> {
  if (USE_MOCKS) return mockRespondToRecommendation(id, action)
  return apiRequest<Recommendation>(`/agent/recommend/${id}/respond`, { method: 'POST', body: { action } })
}
