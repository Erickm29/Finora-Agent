/**
 * Goal contracts.
 *
 * PENDING VALIDATION WITH BACKEND:
 * - Field names for amounts/dates (`targetAmount` vs `target_amount`, snake_case vs camelCase
 *   at the transport level — assumed the API layer normalizes to camelCase before it reaches
 *   the frontend, otherwise `services/goals.service.ts` needs a mapping step).
 * - Whether `monthlySuggested` / projected fields are computed by the backend on creation
 *   (assumed yes, per the "renderizar el plan que devuelva el backend" requirement) or
 *   need to be requested through a separate endpoint.
 * - Whether goals support categories/tags beyond the ones proposed here.
 */
export type GoalStatus = 'active' | 'completed' | 'paused'

export type GoalCategory = 'buy' | 'save' | 'emergency' | 'other'

export interface Goal {
  id: string
  name: string
  category: GoalCategory
  icon: string
  targetAmount: number
  currentAmount: number
  currency: string
  deadline: string // ISO date
  monthlySuggested: number
  status: GoalStatus
  priority: 'Alta' | 'Media' | 'Baja'
  createdAt: string // ISO date
}

export interface CreateGoalPayload {
  name: string
  category: GoalCategory
  targetAmount: number
  currency: string
  /** Desired deadline in months from today, as entered by the user in the form. */
  deadlineMonths: number
}

/**
 * Derived/computed view of a goal used for progress visualizations.
 * Computed client-side from `Goal` so the backend does not need to duplicate this shape,
 * but flagged here in case the backend prefers to return it pre-computed.
 */
export interface GoalProgress {
  goalId: string
  percentage: number
  remainingAmount: number
  projection: 'A tiempo' | 'Atrasado' | 'Adelantado'
}
