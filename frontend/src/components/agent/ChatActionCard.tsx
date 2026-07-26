import Icon from '../common/Icon'
import type { ChatActionPayload, ChatMessage } from '../../types'

interface ChatActionCardProps {
  action: ChatActionPayload
  resolution?: ChatMessage['actionResolution']
  onRespond: (action: 'accept' | 'reject' | 'confirm' | 'cancel') => void
  onOpenWallbitDetails: () => void
  busy?: boolean
}

/**
 * New component — the original prototype only had a single, separate "confirmación de
 * acciones" screen for the Wallbit scenario. The spec now requires THREE kinds of
 * actionable messages embedded directly inside the chat bubble stream, so this renders
 * whichever one the agent attached to a message (see types/chat.ts ChatActionPayload).
 */
export default function ChatActionCard({ action, resolution, onRespond, onOpenWallbitDetails, busy }: ChatActionCardProps) {
  if (resolution) {
    const resolvedLabel: Record<NonNullable<ChatMessage['actionResolution']>, string> = {
      accepted: 'Aceptaste esta propuesta',
      rejected: 'Rechazaste esta propuesta',
      confirmed: 'Confirmaste esta operación',
      cancelled: 'Cancelaste esta operación',
    }
    return (
      <div className="flex items-center gap-2 rounded-xl bg-surface-container-low px-4 py-3 text-on-surface-variant text-label-md font-label-md w-fit">
        <Icon name="check_circle" className="text-secondary" filled />
        {resolvedLabel[resolution]}
      </div>
    )
  }

  if (action.type === 'micro_saving_proposal') {
    const { goalName, amount, currency } = action.data
    return (
      <div className="bg-mint/10 border border-mint/30 rounded-2xl p-5 max-w-md space-y-3">
        <div className="flex items-center gap-2 text-forest-green font-bold text-label-md">
          <Icon name="savings" /> Propuesta de micro-ahorro
        </div>
        <p className="text-body-md text-on-surface">
          Sumar <span className="font-bold text-kelly-green">{amount.toLocaleString('es')} {currency}</span> a tu meta "
          {goalName}" este mes.
        </p>
        <div className="flex gap-3">
          <button
            className="bg-cta text-brand px-4 py-2 rounded-lg font-bold text-label-sm active:scale-95 transition-transform disabled:opacity-60"
            onClick={() => onRespond('accept')}
            disabled={busy}
            type="button"
          >
            Aceptar
          </button>
          <button
            className="border border-outline-variant text-on-surface-variant px-4 py-2 rounded-lg font-bold text-label-sm active:scale-95 transition-transform disabled:opacity-60"
            onClick={() => onRespond('reject')}
            disabled={busy}
            type="button"
          >
            Rechazar
          </button>
        </div>
      </div>
    )
  }

  if (action.type === 'guardrail_alert') {
    const { goalName, withdrawalAmount, currency, delayInDays } = action.data
    return (
      <div className="bg-error-container/40 border border-error/30 rounded-2xl p-5 max-w-md space-y-3">
        <div className="flex items-center gap-2 text-error font-bold text-label-md">
          <Icon name="warning" /> Alerta de retiro
        </div>
        <p className="text-body-md text-on-surface">
          Retirar {withdrawalAmount.toLocaleString('es')} {currency} retrasaría tu meta "{goalName}" en aproximadamente{' '}
          <span className="font-bold">{delayInDays} días</span>. ¿Quieres continuar de todas formas?
        </p>
        <div className="flex gap-3">
          <button
            className="bg-error text-on-error px-4 py-2 rounded-lg font-bold text-label-sm active:scale-95 transition-transform disabled:opacity-60"
            onClick={() => onRespond('confirm')}
            disabled={busy}
            type="button"
          >
            Continuar de todas formas
          </button>
          <button
            className="border border-outline-variant text-on-surface-variant px-4 py-2 rounded-lg font-bold text-label-sm active:scale-95 transition-transform disabled:opacity-60"
            onClick={() => onRespond('cancel')}
            disabled={busy}
            type="button"
          >
            Cancelar retiro
          </button>
        </div>
      </div>
    )
  }

  const { goalName, amount, currency, targetCurrency, successProbabilityAfter } = action.data
  return (
    <div className="bg-primary-container/10 border border-primary/20 rounded-2xl p-5 max-w-md space-y-3">
      <div className="flex items-center gap-2 text-primary font-bold text-label-md">
        <Icon name="encrypted" /> Protección de ahorros (Wallbit)
      </div>
      <p className="text-body-md text-on-surface">
        Convertir {amount.toLocaleString('es')} {currency} a {targetCurrency} para proteger "{goalName}" — eleva tu
        probabilidad de éxito a {successProbabilityAfter}%.
      </p>
      <div className="flex gap-3">
        <button
          className="bg-primary text-on-primary px-4 py-2 rounded-lg font-bold text-label-sm active:scale-95 transition-transform disabled:opacity-60"
          onClick={onOpenWallbitDetails}
          disabled={busy}
          type="button"
        >
          Revisar y confirmar
        </button>
        <button
          className="border border-outline-variant text-on-surface-variant px-4 py-2 rounded-lg font-bold text-label-sm active:scale-95 transition-transform disabled:opacity-60"
          onClick={() => onRespond('cancel')}
          disabled={busy}
          type="button"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
