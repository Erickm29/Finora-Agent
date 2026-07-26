import type { GoalCategory } from '../types'

/**
 * Pure UI configuration for the onboarding category picker — not user financial data,
 * so it's safe to keep static (labels/icons only, no amounts/deadlines).
 */
export const onboardingGoalOptions: Array<{ id: GoalCategory; icon: string; label: string }> = [
  { id: 'buy', icon: 'shopping_bag', label: 'Comprar algo importante' },
  { id: 'save', icon: 'savings', label: 'Ahorrar' },
  { id: 'emergency', icon: 'health_and_safety', label: 'Fondo de emergencia' },
  { id: 'other', icon: 'more_horiz', label: 'Otro' },
]

export const goalCurrencyOptions = ['Bs', 'USD', 'EUR']
