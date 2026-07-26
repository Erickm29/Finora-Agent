import type { CreateGoalPayload, Goal, GoalCategory, GoalStatus } from '../types'
import { mockCancelGoal, mockCreateGoal, mockGetGoals, mockSetPrimaryGoal } from '../mocks/goals.mock'
import { apiRequest } from './apiClient'
import { USE_MOCKS } from './config'

/** Backend goal DTO (snake_case, /v1/goals). */
interface ApiGoal {
  id: string
  name: string
  target_amount_bobs: number
  target_months: number
  base_monthly_bobs: number
  accumulated_bobs: number
  status: string
  progress_ratio?: number
  product_url?: string | null
  metadata?: Record<string, unknown> | null
  created_at?: string | null
}

interface GoalsListResponse {
  goals: ApiGoal[]
}

/**
 * Maps Finora Hono `/v1/goals` into the UI `Goal` shape.
 */
export async function getGoals(): Promise<Goal[]> {
  if (USE_MOCKS) return mockGetGoals()
  const res = await apiRequest<GoalsListResponse>('/goals', { method: 'GET' })
  return res.goals.map((g) => mapApiGoal(g))
}

export async function createGoal(payload: CreateGoalPayload): Promise<Goal> {
  if (USE_MOCKS) return mockCreateGoal(payload)

  const months = Math.max(1, payload.deadlineMonths)
  const target = payload.targetAmount
  const baseMonthly = Math.max(1, Math.ceil(target / months))

  const created = await apiRequest<ApiGoal>('/goals', {
    method: 'POST',
    body: {
      name: payload.name,
      target_amount_bobs: target,
      target_months: months,
      base_monthly_bobs: baseMonthly,
      metadata: {
        category: payload.category,
        currency: payload.currency || 'BOB',
      },
    },
  })
  return mapApiGoal(created, payload.category)
}

/** Soft-delete: la meta pasa a `cancelled` y desaparece de las listas activas. */
export async function cancelGoal(id: string): Promise<Goal> {
  if (USE_MOCKS) return mockCancelGoal(id)
  const updated = await apiRequest<ApiGoal>(`/goals/${id}`, {
    method: 'PATCH',
    body: { status: 'cancelled' },
  })
  return mapApiGoal(updated)
}

/**
 * Marca `id` como meta prioritaria y limpia el flag en las demás. El backend
 * mergea `metadata` en vez de sobreescribirlo (ver `GoalsService.patch`), así
 * que estos PATCH parciales no pisan `category`/`currency` ya guardados.
 *
 * `currentGoals` se recibe para saber qué otras metas hay que "despriorizar"
 * sin depender de un endpoint dedicado (fallback acordado si Track C —la capa
 * de dominio/Wallbit— todavía no expone `GoalsService.setPrimary`).
 */
export async function setPrimaryGoal(currentGoals: Goal[], id: string): Promise<Goal[]> {
  if (USE_MOCKS) return mockSetPrimaryGoal(id)

  const previousPrimaries = currentGoals.filter((g) => g.isPrimary && g.id !== id)
  await apiRequest<ApiGoal>(`/goals/${id}`, {
    method: 'PATCH',
    body: { metadata: { is_primary: true } },
  })
  await Promise.all(
    previousPrimaries.map((g) =>
      apiRequest<ApiGoal>(`/goals/${g.id}`, {
        method: 'PATCH',
        body: { metadata: { is_primary: false } },
      }),
    ),
  )
  return getGoals()
}

const GOAL_CATEGORIES: GoalCategory[] = ['buy', 'save', 'emergency', 'other']

function isGoalCategory(value: unknown): value is GoalCategory {
  return typeof value === 'string' && (GOAL_CATEGORIES as string[]).includes(value)
}

function mapApiGoal(g: ApiGoal, categoryHint?: GoalCategory): Goal {
  const metadata = g.metadata ?? {}
  const metaCategory = categoryHint ?? (isGoalCategory(metadata.category) ? metadata.category : 'other')
  const status = normalizeStatus(g.status)
  const createdAt = g.created_at ?? new Date().toISOString()

  return {
    id: g.id,
    name: g.name,
    category: metaCategory,
    icon: categoryIcon(metaCategory),
    targetAmount: g.target_amount_bobs,
    currentAmount: g.accumulated_bobs,
    currency: 'BOB',
    // El plazo corre desde que se creó la meta, no desde hoy: si se calculara
    // desde hoy el avance esperado sería siempre 0% y todo saldría "a tiempo".
    deadline: addMonthsIso(g.target_months, createdAt),
    monthlySuggested: g.base_monthly_bobs,
    status,
    priority: 'Media',
    createdAt,
    isPrimary: metadata.is_primary === true,
  }
}

function normalizeStatus(status: string): GoalStatus {
  if (status === 'completed' || status === 'paused' || status === 'active' || status === 'cancelled') {
    return status
  }
  return 'active'
}

function categoryIcon(category: GoalCategory): string {
  switch (category) {
    case 'buy':
      return 'laptop_mac'
    case 'emergency':
      return 'health_and_safety'
    case 'save':
      return 'savings'
    default:
      return 'flag'
  }
}

function addMonthsIso(months: number, fromIso: string): string {
  const d = new Date(fromIso)
  if (Number.isNaN(d.getTime())) d.setTime(Date.now())
  d.setMonth(d.getMonth() + months)
  return d.toISOString()
}
