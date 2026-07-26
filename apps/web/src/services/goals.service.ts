import type { CreateGoalPayload, Goal, GoalCategory, GoalStatus } from '../types'
import { mockCreateGoal, mockGetGoals } from '../mocks/goals.mock'
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

function mapApiGoal(g: ApiGoal, categoryHint?: GoalCategory): Goal {
  const metaCategory = categoryHint ?? 'other'
  const deadline = addMonthsIso(g.target_months)
  const status = normalizeStatus(g.status)

  return {
    id: g.id,
    name: g.name,
    category: metaCategory,
    icon: categoryIcon(metaCategory),
    targetAmount: g.target_amount_bobs,
    currentAmount: g.accumulated_bobs,
    currency: 'BOB',
    deadline,
    monthlySuggested: g.base_monthly_bobs,
    status,
    priority: 'Media',
    createdAt: new Date().toISOString(),
  }
}

function normalizeStatus(status: string): GoalStatus {
  if (status === 'completed' || status === 'paused' || status === 'active') return status
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

function addMonthsIso(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return d.toISOString()
}
