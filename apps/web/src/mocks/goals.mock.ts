import type { CreateGoalPayload, Goal } from '../types'
import { ApiError } from '../types/api'
import { addGoal, delay, getGoals, getSessionUserId, nowIso, uid } from './store'

const categoryIcons: Record<CreateGoalPayload['category'], string> = {
  buy: 'shopping_bag',
  save: 'savings',
  emergency: 'health_and_safety',
  other: 'flag',
}

const categoryPriority: Record<CreateGoalPayload['category'], Goal['priority']> = {
  buy: 'Alta',
  save: 'Media',
  emergency: 'Alta',
  other: 'Media',
}

function requireUserId(): string {
  const userId = getSessionUserId()
  if (!userId) throw new ApiError('Sesión expirada. Vuelve a iniciar sesión.', 401)
  return userId
}

export async function mockGetGoals(): Promise<Goal[]> {
  const userId = requireUserId()
  return delay(getGoals(userId))
}

/**
 * Computes a savings plan from whatever the user typed in the goal-creation form
 * (amount + deadline in months). This mirrors the kind of computation the real
 * Backend/Agent is expected to perform — see PENDING note in types/goal.ts.
 */
export async function mockCreateGoal(payload: CreateGoalPayload): Promise<Goal> {
  const userId = requireUserId()

  if (payload.targetAmount <= 0) throw await delay(new ApiError('El monto objetivo debe ser mayor a cero.', 422))
  if (payload.deadlineMonths <= 0) throw await delay(new ApiError('El plazo debe ser de al menos 1 mes.', 422))

  const deadline = new Date()
  deadline.setMonth(deadline.getMonth() + payload.deadlineMonths)

  const monthlySuggested = Math.ceil(payload.targetAmount / payload.deadlineMonths)

  const goal: Goal = {
    id: uid('goal'),
    name: payload.name,
    category: payload.category,
    icon: categoryIcons[payload.category],
    targetAmount: payload.targetAmount,
    currentAmount: 0,
    currency: payload.currency,
    deadline: deadline.toISOString(),
    monthlySuggested,
    status: 'active',
    priority: categoryPriority[payload.category],
    createdAt: nowIso(),
  }

  addGoal(userId, goal)
  return delay(goal, 900) // slightly longer latency to sell the "IA está calculando tu plan" moment
}
