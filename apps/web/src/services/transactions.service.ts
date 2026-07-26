import type { Transaction, TransactionDirection, TransactionKind } from '../types'
import { mockGetTransactions } from '../mocks/transactions.mock'
import { apiRequest } from './apiClient'
import { USE_MOCKS } from './config'
import { getGoals } from './goals.service'

interface ApiTransaction {
  id: string
  type: string
  amount_bobs: number
  source: string
  note: string | null
  created_at: string
}

interface TransactionsResponse {
  transactions: ApiTransaction[]
}

/**
 * Backend exposes transactions per goal: GET /v1/goals/:id/transactions.
 * Without goalId, aggregates across the user's goals.
 */
export async function getTransactions(goalId?: string): Promise<Transaction[]> {
  if (USE_MOCKS) return mockGetTransactions(goalId)

  if (goalId) {
    return fetchForGoal(goalId)
  }

  const goals = await getGoals()
  // allSettled y no all: que una meta que falla no borre el historial completo
  // del dashboard.
  const batches = await Promise.allSettled(goals.map((g) => fetchForGoal(g.id)))
  const failed = batches.filter((b) => b.status === 'rejected').length
  if (failed > 0) {
    console.warn(`[finora] ${failed} de ${goals.length} metas no devolvieron transacciones`)
  }
  return batches
    .flatMap((b) => (b.status === 'fulfilled' ? b.value : []))
    .sort((a, b) => b.date.localeCompare(a.date))
}

async function fetchForGoal(goalId: string): Promise<Transaction[]> {
  const res = await apiRequest<TransactionsResponse>(`/goals/${goalId}/transactions`, {
    method: 'GET',
  })
  return res.transactions.map((t) => mapApiTransaction(t, goalId))
}

function mapApiTransaction(t: ApiTransaction, goalId: string): Transaction {
  const kind = mapKind(t.type, t.source)
  const direction: TransactionDirection =
    kind === 'expense' || t.type === 'withdrawal' ? 'out' : 'in'

  return {
    id: t.id,
    goalId,
    description: t.note || labelFor(t.type, t.source),
    category: t.source || t.type,
    date: t.created_at,
    amount: t.amount_bobs,
    direction,
    kind,
    icon: iconFor(kind),
  }
}

function mapKind(type: string, source: string): TransactionKind {
  if (type === 'withdrawal' || type === 'expense') return 'expense'
  if (source === 'microsaving' || type === 'microsaving') return 'micro_saving'
  if (source === 'guardrail' || type === 'guardrail') return 'guardrail_decision'
  if (type === 'income') return 'income'
  return 'micro_saving'
}

function labelFor(type: string, source: string): string {
  if (source === 'microsaving') return 'Microahorro'
  if (type === 'contribution') return 'Aporte a meta'
  if (type === 'withdrawal') return 'Retiro'
  return type
}

function iconFor(kind: TransactionKind): string {
  switch (kind) {
    case 'micro_saving':
      return 'savings'
    case 'guardrail_decision':
      return 'shield'
    case 'expense':
      return 'remove_circle'
    default:
      return 'payments'
  }
}
