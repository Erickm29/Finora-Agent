import type {
  ChatActionResponsePayload,
  ChatMessage,
  Recommendation,
  RecommendationAction,
  SendMessagePayload,
} from '../types'
import { ApiError } from '../types/api'
import {
  addContribution,
  appendChatMessages,
  delay,
  findChatMessage,
  getChatHistory,
  getGoals,
  getRecommendations,
  getSessionUserId,
  nowIso,
  uid,
  updateRecommendation,
} from './store'

function requireUserId(): string {
  const userId = getSessionUserId()
  if (!userId) throw new ApiError('Sesión expirada. Vuelve a iniciar sesión.', 401)
  return userId
}

export async function mockGetChatHistory(): Promise<ChatMessage[]> {
  const userId = requireUserId()
  const history = getChatHistory(userId)
  if (history.length > 0) return delay(history)

  const goals = getGoals(userId)
  const greeting: ChatMessage = {
    id: uid('msg'),
    from: 'agent',
    createdAt: nowIso(),
    text:
      goals.length > 0
        ? `¡Hola! Soy Finora, tu co-piloto financiero. Estoy siguiendo tu meta "${goals[0].name}", que va al ${Math.round(
            (goals[0].currentAmount / goals[0].targetAmount) * 100,
          )}% de avance. ¿En qué puedo ayudarte hoy?`
        : '¡Hola! Soy Finora, tu co-piloto financiero. Aún no tienes metas activas — cuéntame qué quieres lograr y armamos un plan juntos.',
  }
  return delay(appendChatMessages(userId, [greeting]))
}

export async function mockSendMessage(payload: SendMessagePayload): Promise<ChatMessage[]> {
  const userId = requireUserId()
  const goals = getGoals(userId)
  const lowerText = payload.text.toLowerCase()

  const userMessage: ChatMessage = { id: uid('msg'), from: 'user', text: payload.text, createdAt: nowIso() }
  const newMessages: ChatMessage[] = [userMessage]

  const primaryGoal = goals[0]

  if (!primaryGoal) {
    newMessages.push({
      id: uid('msg'),
      from: 'agent',
      createdAt: nowIso(),
      text: 'Todavía no tienes ninguna meta creada, así que no tengo datos sobre los que analizar. ¿Quieres crear tu primera meta ahora?',
    })
    return delay(appendChatMessages(userId, newMessages))
  }

  if (lowerText.includes('retir') || lowerText.includes('sacar dinero')) {
    const delayInDays = Math.max(7, Math.round(primaryGoal.monthlySuggested / 10))
    newMessages.push({
      id: uid('msg'),
      from: 'agent',
      createdAt: nowIso(),
      text: `Antes de continuar, quiero que veas el impacto real de ese retiro en tu meta "${primaryGoal.name}".`,
      action: {
        type: 'guardrail_alert',
        data: {
          goalId: primaryGoal.id,
          goalName: primaryGoal.name,
          withdrawalAmount: Math.round(primaryGoal.monthlySuggested * 0.6),
          currency: primaryGoal.currency,
          delayInDays,
        },
      },
    })
  } else if (lowerText.includes('proteger') || lowerText.includes('dólares') || lowerText.includes('dolares') || lowerText.includes('blindar')) {
    newMessages.push({
      id: uid('msg'),
      from: 'agent',
      createdAt: nowIso(),
      text: `He detectado una oportunidad para proteger parte de tus ahorros de "${primaryGoal.name}" ante la volatilidad del mercado.`,
      action: {
        type: 'wallbit_confirmation',
        data: {
          goalId: primaryGoal.id,
          goalName: primaryGoal.name,
          amount: Math.round(primaryGoal.currentAmount * 0.4) || Math.round(primaryGoal.monthlySuggested),
          currency: primaryGoal.currency,
          targetCurrency: 'USD',
          successProbabilityBefore: 82,
          successProbabilityAfter: 94,
        },
      },
    })
  } else if (lowerText.includes('ahorr') || lowerText.includes('avanz') || lowerText.includes('progreso')) {
    const progress = Math.round((primaryGoal.currentAmount / primaryGoal.targetAmount) * 100)
    newMessages.push({
      id: uid('msg'),
      from: 'agent',
      createdAt: nowIso(),
      text: `Tu meta "${primaryGoal.name}" va al ${progress}% (${primaryGoal.currentAmount} de ${primaryGoal.targetAmount} ${primaryGoal.currency}). Al ritmo sugerido de ${primaryGoal.monthlySuggested} ${primaryGoal.currency}/mes, vas en línea con el plazo que definiste.`,
    })
    const extra = Math.max(10, Math.round(primaryGoal.monthlySuggested * 0.15))
    newMessages.push({
      id: uid('msg'),
      from: 'agent',
      createdAt: nowIso(),
      text: `De hecho, detecté que podrías sumar un poco más este mes sin afectar tu presupuesto esencial.`,
      action: {
        type: 'micro_saving_proposal',
        data: { goalId: primaryGoal.id, goalName: primaryGoal.name, amount: extra, currency: primaryGoal.currency },
      },
    })
  } else {
    newMessages.push({
      id: uid('msg'),
      from: 'agent',
      createdAt: nowIso(),
      text: `Entendido. Sigo monitoreando "${primaryGoal.name}" en segundo plano — avísame si quieres que analice tus gastos, prepare una operación de protección de ahorros, o revise tu progreso.`,
    })
  }

  return delay(appendChatMessages(userId, newMessages))
}

export async function mockRespondToChatAction(payload: ChatActionResponsePayload): Promise<ChatMessage> {
  const userId = requireUserId()
  const originalMessage = findChatMessage(userId, payload.messageId)

  // Accepting a micro-saving proposal is the one action that actually moves money in the
  // mock world, so the goal/transactions the user sees elsewhere stay consistent with what
  // they approved here.
  if (payload.action === 'accept' && originalMessage?.action?.type === 'micro_saving_proposal') {
    const { goalId, goalName, amount } = originalMessage.action.data
    addContribution(userId, goalId, amount, `Micro-ahorro aceptado en el chat para "${goalName}"`, 'micro_saving')
  }

  const confirmationText: Record<ChatActionResponsePayload['action'], string> = {
    accept: 'Perfecto, agregué ese monto a tu meta. ¡Seguimos avanzando! 🎯',
    reject: 'Sin problema, no se hizo ningún movimiento.',
    confirm: 'Listo, estoy procesando la operación. Te avisaré cuando se confirme.',
    cancel: 'Operación cancelada. Tu portafolio permanece sin cambios.',
  }

  const message: ChatMessage = {
    id: uid('msg'),
    from: 'agent',
    createdAt: nowIso(),
    text: confirmationText[payload.action],
  }
  appendChatMessages(userId, [message])
  return delay(message)
}

export async function mockGetRecommendations(): Promise<Recommendation[]> {
  const userId = requireUserId()
  return delay(getRecommendations(userId))
}

export async function mockRespondToRecommendation(id: string, action: RecommendationAction): Promise<Recommendation> {
  const userId = requireUserId()
  const updated = updateRecommendation(userId, id, { status: action === 'accept' ? 'accepted' : 'dismissed' })
  if (!updated) throw await delay(new ApiError('No encontramos esa recomendación.', 404))

  if (action === 'accept' && updated.goalId && updated.suggestedAmount) {
    addContribution(userId, updated.goalId, updated.suggestedAmount, updated.title, 'micro_saving')
  }

  return delay(updated)
}
