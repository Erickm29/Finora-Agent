import type { CreateGoalPayload, Goal } from '../types'
import { mockCreateGoal, mockGetGoals } from '../mocks/goals.mock'
import { apiRequest } from './apiClient'
import { USE_MOCKS } from './config'

/**
 * Endpoint contract (PENDING VALIDATION WITH BACKEND):
 *   GET  /goal  -> Goal[]
 *   POST /goal  -> Goal   (backend computes monthlySuggested/deadline projection)
 */
export async function getGoals(): Promise<Goal[]> {
  if (USE_MOCKS) return mockGetGoals()
  return apiRequest<Goal[]>('/goal', { method: 'GET' })
}

export async function createGoal(payload: CreateGoalPayload): Promise<Goal> {
  if (USE_MOCKS) return mockCreateGoal(payload)
  return apiRequest<Goal>('/goal', { method: 'POST', body: payload })
}
