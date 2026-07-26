/**
 * PENDING VALIDATION WITH BACKEND:
 * - Whether transactions/history come from a dedicated `/transactions` endpoint or are
 *   nested inside `/goal` responses (`goal.history`). Assumed a dedicated endpoint,
 *   optionally filterable by `goalId`, since the dashboard also needs an aggregate view
 *   across all goals.
 * - Whether "microahorros" (micro-savings) and "decisiones" (guardrail decisions) share
 *   this same shape or need their own endpoint/type.
 */
export type TransactionDirection = 'in' | 'out'

export type TransactionKind = 'expense' | 'income' | 'micro_saving' | 'guardrail_decision'

export interface Transaction {
  id: string
  goalId: string | null
  description: string
  category: string
  date: string // ISO date
  amount: number
  direction: TransactionDirection
  kind: TransactionKind
  icon: string
}
