import { useNavigate } from 'react-router-dom'
import Icon from '../common/Icon'
import Button from '../common/Button'

/**
 * Persistent but non-blocking reminder on Dashboard while Telegram remains unlinked.
 * Same source of truth as onboarding/settings: telegram.service via useTelegramLink.
 */
export default function TelegramBanner() {
  const navigate = useNavigate()

  return (
    <div className="mb-6 rounded-2xl border border-premium/40 bg-premium/25 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
      <div className="flex items-start gap-3">
        <Icon name="campaign" className="text-brand text-2xl shrink-0" />
        <div>
          <p className="text-label-md font-bold text-brand">Tu cuenta de Telegram no está vinculada</p>
          <p className="text-label-sm text-on-surface-variant">
            Actívala para recibir alertas de guardrails, microahorros y recordatorios del agente.
          </p>
        </div>
      </div>
      <Button size="sm" type="button" onClick={() => navigate('/vincular-telegram')}>
        Vincular ahora
      </Button>
    </div>
  )
}
