import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShellLayout from '../layouts/AppShellLayout'
import Icon from '../components/common/Icon'
import Spinner from '../components/common/Spinner'
import ErrorState from '../components/common/ErrorState'
import ChatMessageBubble from '../components/agent/ChatMessageBubble'
import ProgressInsightCard from '../components/agent/ProgressInsightCard'
import ChatComposer from '../components/agent/ChatComposer'
import MarketContextPanel from '../components/agent/MarketContextPanel'
import ActionConfirmationModal from '../components/modals/ActionConfirmationModal'
import type { ActionConfirmationData } from '../components/modals/ActionConfirmationModal'
import { quickActions } from '../data/chat'
import { useAgentChat } from '../hooks/useAgentChat'
import { useGoals } from '../hooks/useGoals'
import type { ChatMessage } from '../types'

export default function AgentChatPage() {
  const navigate = useNavigate()
  const { messages, loading, sending, error, sendMessage, resolveAction } = useAgentChat()
  const { data: goals } = useGoals()
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const [wallbitModal, setWallbitModal] = useState<{ message: ChatMessage; data: ActionConfirmationData } | null>(null)
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const primaryGoal = goals?.[0]

  const handleRespond = async (message: ChatMessage, action: 'accept' | 'reject' | 'confirm' | 'cancel') => {
    setResolvingId(message.id)
    try {
      await resolveAction({ messageId: message.id, action })
    } finally {
      setResolvingId(null)
    }
  }

  const openWallbitDetails = (message: ChatMessage) => {
    if (message.action?.type !== 'wallbit_confirmation') return
    const { goalName, amount, currency, targetCurrency, successProbabilityBefore, successProbabilityAfter } = message.action.data
    setWallbitModal({
      message,
      data: {
        title: 'Protección de ahorros (Wallbit)',
        subtitle: `Estrategia sugerida para "${goalName}"`,
        statement: `Convertir ${amount.toLocaleString('es')} ${currency} a ${targetCurrency} para proteger tu meta ante la volatilidad del mercado.`,
        reason: 'Volatilidad proyectada en el mercado durante el próximo trimestre. El blindaje ayuda a preservar tu poder adquisitivo.',
        amount,
        currency: targetCurrency,
        // `sourceAccount` no se muestra: WallbitConfirmationPayload (types/chat.ts) aún no
        // modela una cuenta de origen real; pendiente de validar con Backend/Integraciones.
        successProbabilityBefore,
        successProbabilityAfter,
        riskReductionNote: 'Esta acción reduce el riesgo de mercado para este fondo específico.',
        reversibleNote: 'Esta operación es reversible dentro de las primeras 24 horas.',
        confirmLabel: 'Confirmar Conversión',
      },
    })
  }

  return (
    <AppShellLayout
      title="Chat Co-pilot"
      searchPlaceholder="Buscar transacción..."
      contentClassName="h-[calc(100vh-4rem)]"
      actions={
        <button
          className="bg-primary text-on-primary px-4 py-2 rounded-lg font-bold text-label-md transition-all active:opacity-70"
          onClick={() => navigate('/metas/nueva')}
          type="button"
        >
          New Goal
        </button>
      }
    >
      <div className="h-full flex overflow-hidden">
        <section className="flex-1 flex flex-col relative bg-surface-container-lowest">
          <div className="absolute inset-0 pointer-events-none opacity-20 dot-pattern" />

          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar relative z-10">
            <div className="flex justify-center">
              <span className="bg-surface-container text-on-surface-variant text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                Hoy
              </span>
            </div>

            {loading && <Spinner label="Cargando tu conversación..." />}
            {error && !loading && <ErrorState message={error} />}

            {!loading &&
              messages.map((message, index) => (
                <div key={message.id} className="flex flex-col gap-4">
                  <ChatMessageBubble
                    message={message}
                    onRespondAction={(action) => handleRespond(message, action)}
                    onOpenWallbitDetails={() => openWallbitDetails(message)}
                    actionBusy={resolvingId === message.id}
                  />
                  {index === 0 && primaryGoal && (
                    <div className="pl-14">
                      <ProgressInsightCard goal={primaryGoal} />
                    </div>
                  )}
                </div>
              ))}
            {sending && (
              <div className="flex items-center gap-2 pl-14 text-on-surface-variant text-label-sm">
                <span className="h-2 w-2 rounded-full bg-secondary animate-bounce" />
                <span className="h-2 w-2 rounded-full bg-secondary animate-bounce" style={{ animationDelay: '0.1s' }} />
                <span className="h-2 w-2 rounded-full bg-secondary animate-bounce" style={{ animationDelay: '0.2s' }} />
                Finora está escribiendo...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="px-8 py-4 flex gap-3 flex-wrap relative z-10">
            {quickActions.map((action) => (
              <button
                key={action.id}
                className="bg-white hover:bg-secondary-container/30 border border-outline-variant/40 px-4 py-2 rounded-full text-label-md font-semibold text-primary transition-all flex items-center gap-2 active:scale-95 shadow-sm disabled:opacity-60"
                onClick={() => sendMessage(action.label)}
                disabled={sending}
                type="button"
              >
                <Icon name={action.icon} className="text-[20px]" /> {action.label}
              </button>
            ))}
          </div>

          <ChatComposer onSend={sendMessage} disabled={sending} />
        </section>

        <MarketContextPanel />
      </div>

      <ActionConfirmationModal
        open={Boolean(wallbitModal)}
        data={wallbitModal?.data ?? null}
        onClose={() => setWallbitModal(null)}
        onConfirmed={() => {
          if (wallbitModal) handleRespond(wallbitModal.message, 'confirm')
          setWallbitModal(null)
        }}
      />
    </AppShellLayout>
  )
}
