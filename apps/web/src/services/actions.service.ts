import type {
  Recommendation,
  RecommendationAction,
  RecommendationType,
} from '../types'
import { mockGetRecommendations, mockRespondToRecommendation } from '../mocks/agent.mock'
import { apiRequest } from './apiClient'
import { USE_MOCKS } from './config'

/** Backend pending_actions DTO. */
export interface PendingAction {
  id: string
  kind: string
  payload: Record<string, unknown>
  channel_created: string
  expires_at: string | null
  goal_id: string | null
}

interface PendingActionsResponse {
  actions: PendingAction[]
}

/**
 * Lists pending human-confirmation actions from the API and maps them to the
 * dashboard Recommendation card shape (until a dedicated /recommend exists).
 */
export async function listPendingActions(): Promise<PendingAction[]> {
  if (USE_MOCKS) return []
  const res = await apiRequest<PendingActionsResponse>('/actions/pending', { method: 'GET' })
  return res.actions
}

export async function confirmAction(id: string): Promise<{ id: string; status: string }> {
  return apiRequest(`/actions/${id}/confirm`, { method: 'POST' })
}

export async function cancelAction(id: string): Promise<{ id: string; status: string }> {
  return apiRequest(`/actions/${id}/cancel`, { method: 'POST' })
}

export async function getRecommendations(): Promise<Recommendation[]> {
  if (USE_MOCKS) return mockGetRecommendations()
  const actions = await listPendingActions()
  return actions.map(pendingToRecommendation)
}

export async function respondToRecommendation(
  id: string,
  action: RecommendationAction,
): Promise<Recommendation> {
  if (USE_MOCKS) return mockRespondToRecommendation(id, action)

  if (action === 'accept') {
    await confirmAction(id)
  } else {
    await cancelAction(id)
  }

  return {
    id,
    goalId: null,
    type: 'micro_saving',
    title: action === 'accept' ? 'Acción confirmada' : 'Acción cancelada',
    message:
      action === 'accept'
        ? 'Confirmaste la acción preparada. Finora no ejecuta dinero sin tu OK.'
        : 'Cancelaste la acción. Vos decidís.',
    icon: action === 'accept' ? 'check_circle' : 'cancel',
    createdAt: new Date().toISOString(),
    status: action === 'accept' ? 'accepted' : 'dismissed',
  }
}

function pendingToRecommendation(action: PendingAction): Recommendation {
  const amount = numberFrom(action.payload, ['amount_bobs', 'amount', 'amountBobs'])
  const type = mapKindToType(action.kind)
  const title =
    stringFrom(action.payload, ['title']) ?? titleFor(action.kind)
  const rationale = stringFrom(action.payload, ['rationale', 'reason'])
  const risks = stringArrayFrom(action.payload, 'risks')
  const benefits = stringArrayFrom(action.payload, 'benefits')
  const source = sourceFrom(action.payload)

  return {
    id: action.id,
    goalId: action.goal_id,
    type,
    title,
    message: messageFor(action, rationale),
    icon: iconFor(type),
    suggestedAmount: amount ?? undefined,
    currency: 'BOB',
    createdAt: action.expires_at ?? new Date().toISOString(),
    status: 'pending',
    rationale: rationale ?? undefined,
    risks: risks.length ? risks : undefined,
    benefits: benefits.length ? benefits : undefined,
    source,
  }
}

function mapKindToType(kind: string): RecommendationType {
  if (kind.includes('wallbit') || kind.includes('fx')) return 'wallbit_protection'
  if (kind.includes('guardrail')) return 'progress_alert'
  return 'micro_saving'
}

function titleFor(kind: string): string {
  if (kind.includes('wallbit')) return 'Acción Wallbit pendiente'
  if (kind.includes('microsaving') || kind.includes('micro')) return 'Microahorro preparado'
  return 'Acción pendiente de confirmación'
}

function messageFor(action: PendingAction, rationale?: string | null): string {
  if (rationale?.trim()) return rationale
  const note = action.payload.note ?? action.payload.description
  if (typeof note === 'string' && note.trim()) return note
  return `Hay una acción (${action.kind}) lista. Confirmala para continuar — Finora no mueve dinero solo.`
}

function stringFrom(payload: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const v = payload[key]
    if (typeof v === 'string' && v.trim()) return v
  }
  return null
}

function stringArrayFrom(payload: Record<string, unknown>, key: string): string[] {
  const v = payload[key]
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
}

function sourceFrom(payload: Record<string, unknown>): Recommendation['source'] {
  const raw = payload.news_source ?? payload.source
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const obj = raw as Record<string, unknown>
  if (typeof obj.title !== 'string' || !obj.title.trim()) return undefined
  return {
    title: obj.title,
    url: typeof obj.url === 'string' ? obj.url : undefined,
    snippet: typeof obj.snippet === 'string' ? obj.snippet : undefined,
  }
}

function iconFor(type: RecommendationType): string {
  switch (type) {
    case 'wallbit_protection':
      return 'currency_exchange'
    case 'progress_alert':
      return 'warning'
    case 'market_alert':
      return 'trending_up'
    default:
      return 'savings'
  }
}

function numberFrom(payload: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const v = payload[key]
    if (typeof v === 'number' && Number.isFinite(v)) return v
  }
  return null
}
