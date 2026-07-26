import type { Goal, GoalProgress } from '../types'

/**
 * Derives progress/projection client-side from the raw Goal fields so every screen shows
 * consistent numbers without duplicating this logic. If the backend later returns these
 * pre-computed, this function can simply be swapped for a passthrough.
 */
export function computeGoalProgress(goal: Goal): GoalProgress {
  const percentage = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0
  const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount)

  const created = new Date(goal.createdAt).getTime()
  const deadline = new Date(goal.deadline).getTime()
  const now = Date.now()
  const totalSpan = Math.max(1, deadline - created)
  const elapsed = Math.min(totalSpan, Math.max(0, now - created))
  const expectedPercentage = Math.round((elapsed / totalSpan) * 100)

  let projection: GoalProgress['projection'] = 'A tiempo'
  if (percentage >= expectedPercentage + 5) projection = 'Adelantado'
  else if (percentage < expectedPercentage - 5) projection = 'Atrasado'

  return { goalId: goal.id, percentage, remainingAmount, projection }
}

export function formatDeadline(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es', { month: 'long', year: 'numeric' })
}

export function formatCurrency(amount: number, currency: string): string {
  return `${amount.toLocaleString('es')} ${currency}`
}
