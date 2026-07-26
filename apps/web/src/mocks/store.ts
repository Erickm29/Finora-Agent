import type {
  ChatMessage,
  Goal,
  Recommendation,
  TelegramLinkStatus,
  Transaction,
  User,
  UserPreferences,
} from '../types'
import { MOCK_LATENCY_MS } from '../services/config'

/**
 * In-memory "fake backend" used only when VITE_USE_MOCKS !== 'false'.
 *
 * Design goal: every mock service reads/writes through this module so that data entered
 * in one screen (e.g. creating a goal) is immediately reflected in every other screen that
 * reads it (e.g. the dashboard), instead of each mock returning an isolated fixed object.
 *
 * This intentionally resets on full page reload (no localStorage) to avoid implying any
 * real persistence guarantee, and to keep auth tokens/PII out of browser storage — see the
 * "Autenticación y sesión" note in services/auth.service.ts.
 */

interface StoredAccount {
  user: User
  password: string
  preferences: UserPreferences
}

const accountsByEmail = new Map<string, StoredAccount>()
const pendingVerificationCodes = new Map<string, string>()

const goalsByUser = new Map<string, Goal[]>()
const transactionsByUser = new Map<string, Transaction[]>()
const recommendationsByUser = new Map<string, Recommendation[]>()
const chatByUser = new Map<string, ChatMessage[]>()
const telegramByUser = new Map<string, TelegramLinkStatus>()

let currentUserId: string | null = null

export function delay<T>(value: T, ms: number = MOCK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

export const defaultPreferences: UserPreferences = {
  currency: 'BOB',
  notificationsEnabled: true,
  recommendationFrequency: 'daily',
  extremeVolatilityAlerts: true,
  dailyAiSummary: true,
  liquidationAlerts: true,
  achievableGoalSuggestions: false,
}

export function getSessionUserId(): string | null {
  return currentUserId
}

export function setSessionUserId(userId: string | null) {
  currentUserId = userId
}

export function findAccountByEmail(email: string): StoredAccount | undefined {
  return accountsByEmail.get(email.toLowerCase().trim())
}

export function createAccount(user: User, password: string): StoredAccount {
  const account: StoredAccount = { user, password, preferences: { ...defaultPreferences } }
  accountsByEmail.set(user.email.toLowerCase().trim(), account)
  goalsByUser.set(user.id, [])
  transactionsByUser.set(user.id, [])
  recommendationsByUser.set(user.id, [])
  chatByUser.set(user.id, [])
  telegramByUser.set(user.id, { linked: false, handle: null, linkedAt: null, syncActive: false })
  return account
}

export function updateAccountUser(userId: string, patch: Partial<User>) {
  for (const account of accountsByEmail.values()) {
    if (account.user.id === userId) {
      account.user = { ...account.user, ...patch }
      return account.user
    }
  }
  return undefined
}

export function getAccountByUserId(userId: string): StoredAccount | undefined {
  for (const account of accountsByEmail.values()) {
    if (account.user.id === userId) return account
  }
  return undefined
}

export function setVerificationCode(email: string, code: string) {
  pendingVerificationCodes.set(email.toLowerCase().trim(), code)
}

export function consumeVerificationCode(email: string, code: string): boolean {
  const key = email.toLowerCase().trim()
  const expected = pendingVerificationCodes.get(key)
  // Any 6-digit code is accepted in mock mode to keep the demo frictionless; the real
  // backend integration will replace this with an actual comparison against `expected`.
  const isValid = Boolean(expected) && code.trim().length === 6
  if (isValid) pendingVerificationCodes.delete(key)
  return isValid
}

export function getGoals(userId: string): Goal[] {
  return goalsByUser.get(userId) ?? []
}

export function getGoalById(userId: string, goalId: string): Goal | undefined {
  return (goalsByUser.get(userId) ?? []).find((goal) => goal.id === goalId)
}

export function setGoalStatus(userId: string, goalId: string, status: Goal['status']) {
  const list = goalsByUser.get(userId) ?? []
  goalsByUser.set(
    userId,
    list.map((goal) => (goal.id === goalId ? { ...goal, status } : goal)),
  )
}

/** Marca `goalId` como prioritaria y limpia el flag en el resto de las metas del usuario. */
export function setPrimaryGoalId(userId: string, goalId: string) {
  const list = goalsByUser.get(userId) ?? []
  goalsByUser.set(
    userId,
    list.map((goal) => ({ ...goal, isPrimary: goal.id === goalId })),
  )
}

export function addGoal(userId: string, goal: Goal) {
  const list = goalsByUser.get(userId) ?? []
  list.push(goal)
  goalsByUser.set(userId, list)

  seedRecommendationsForGoal(userId, goal)
  const firstContribution = Math.round(goal.monthlySuggested * 0.4)
  addContribution(userId, goal.id, firstContribution, `Aporte inicial a "${goal.name}"`, 'micro_saving')
}

/**
 * Central place where "money actually moves" in the mock world: every accepted
 * micro-saving proposal/recommendation goes through here so the goal's `currentAmount`,
 * its status, and the transaction history stay consistent with each other.
 */
export function addContribution(userId: string, goalId: string, amount: number, description: string, kind: Transaction['kind']) {
  const goals = goalsByUser.get(userId) ?? []
  const updatedGoals = goals.map((goal) => {
    if (goal.id !== goalId) return goal
    const currentAmount = Math.min(goal.targetAmount, goal.currentAmount + amount)
    return { ...goal, currentAmount, status: currentAmount >= goal.targetAmount ? ('completed' as const) : goal.status }
  })
  goalsByUser.set(userId, updatedGoals)

  const transactions = transactionsByUser.get(userId) ?? []
  transactions.push({
    id: uid('tx'),
    goalId,
    description,
    category: 'Ahorro',
    date: nowIso(),
    amount,
    direction: 'out',
    kind,
    icon: 'savings',
  })
  transactionsByUser.set(userId, transactions)
}

export function getTransactions(userId: string): Transaction[] {
  return [...(transactionsByUser.get(userId) ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
}

export function getRecommendations(userId: string): Recommendation[] {
  return recommendationsByUser.get(userId) ?? []
}

export function updateRecommendation(userId: string, id: string, patch: Partial<Recommendation>) {
  const list = recommendationsByUser.get(userId) ?? []
  const updated = list.map((rec) => (rec.id === id ? { ...rec, ...patch } : rec))
  recommendationsByUser.set(userId, updated)
  return updated.find((rec) => rec.id === id)
}

export function getChatHistory(userId: string): ChatMessage[] {
  return chatByUser.get(userId) ?? []
}

export function findChatMessage(userId: string, messageId: string): ChatMessage | undefined {
  return (chatByUser.get(userId) ?? []).find((msg) => msg.id === messageId)
}

export function appendChatMessages(userId: string, messages: ChatMessage[]) {
  const list = chatByUser.get(userId) ?? []
  const updated = [...list, ...messages]
  chatByUser.set(userId, updated)
  return updated
}

export function getTelegramStatus(userId: string): TelegramLinkStatus {
  return telegramByUser.get(userId) ?? { linked: false, handle: null, linkedAt: null, syncActive: false }
}

export function setTelegramStatus(userId: string, status: TelegramLinkStatus) {
  telegramByUser.set(userId, status)
}

export function getPreferences(userId: string): UserPreferences {
  const account = getAccountByUserId(userId)
  return account?.preferences ?? { ...defaultPreferences }
}

export function updatePreferences(userId: string, patch: Partial<UserPreferences>) {
  const account = getAccountByUserId(userId)
  if (!account) return { ...defaultPreferences, ...patch }
  account.preferences = { ...account.preferences, ...patch }
  return account.preferences
}

function seedRecommendationsForGoal(userId: string, goal: Goal) {
  const list = recommendationsByUser.get(userId) ?? []
  const extra = Math.max(10, Math.round(goal.monthlySuggested * 0.2))
  list.push({
    id: uid('rec'),
    goalId: goal.id,
    type: 'micro_saving',
    title: 'Oportunidad de micro-ahorro',
    message: `Basado en tus gastos recientes, puedes separar ${extra} ${goal.currency} adicionales este mes para tu meta "${goal.name}" sin afectar tu presupuesto esencial.`,
    icon: 'savings',
    suggestedAmount: extra,
    currency: goal.currency,
    createdAt: nowIso(),
    status: 'pending',
  })
  recommendationsByUser.set(userId, list)
}
