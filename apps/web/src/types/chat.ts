/**
 * Chat contracts.
 *
 * PENDING VALIDATION WITH BACKEND:
 * - `/agent/chat` request/response shape: assumed the backend returns an ARRAY of messages
 *   per turn (a plain reply may be followed by an actionable card, e.g. a micro-saving
 *   proposal), not just a single string. Confirm with Backend whether this is one message
 *   or a list.
 * - The `payload` shapes for each `ChatActionType` (micro-saving proposal, guardrail alert,
 *   Wallbit confirmation) are inferred from the product spec, not from a real contract yet.
 * - How a user's response to an actionable message is sent back (assumed
 *   `POST /agent/chat/action` with `{ messageId, action }`, reusing `agent.service.ts`).
 */
export type ChatSender = 'agent' | 'user'

export type ChatActionType = 'micro_saving_proposal' | 'guardrail_alert' | 'wallbit_confirmation'

export interface MicroSavingProposalPayload {
  goalId: string
  goalName: string
  amount: number
  currency: string
}

export interface GuardrailAlertPayload {
  goalId: string
  goalName: string
  withdrawalAmount: number
  currency: string
  delayInDays: number
}

export interface WallbitConfirmationPayload {
  goalId: string
  goalName: string
  amount: number
  currency: string
  targetCurrency: 'USD'
  successProbabilityBefore: number
  successProbabilityAfter: number
}

export type ChatActionPayload =
  | { type: 'micro_saving_proposal'; data: MicroSavingProposalPayload }
  | { type: 'guardrail_alert'; data: GuardrailAlertPayload }
  | { type: 'wallbit_confirmation'; data: WallbitConfirmationPayload }

export interface ChatMessage {
  id: string
  from: ChatSender
  text: string
  createdAt: string // ISO date
  action?: ChatActionPayload
  actionResolution?: 'accepted' | 'rejected' | 'cancelled' | 'confirmed'
}

export interface SendMessagePayload {
  text: string
}

export interface ChatActionResponsePayload {
  messageId: string
  action: 'accept' | 'reject' | 'confirm' | 'cancel'
}
