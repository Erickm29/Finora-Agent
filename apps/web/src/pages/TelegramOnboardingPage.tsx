import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FinoraLogo from '../assets/logo/FinoraLogo'
import ThemeToggle from '../components/common/ThemeToggle'
import Button from '../components/common/Button'
import TelegramLinkCard from '../components/telegram/TelegramLinkCard'
import TelegramSkipDialog from '../components/telegram/TelegramSkipDialog'
import { useTelegramLink } from '../hooks/useTelegramLink'

/**
 * Mandatory product step after email verification and before first Dashboard access.
 * User may continue without linking only after explicit confirmation (TelegramSkipDialog).
 */
export default function TelegramOnboardingPage() {
  const navigate = useNavigate()
  const { status, loading, error, link, actionLoading, actionError, awaitingTelegram, refetch } =
    useTelegramLink()
  const [skipOpen, setSkipOpen] = useState(false)

  const goNext = () => navigate('/onboarding', { replace: true })

  const handleContinue = () => {
    if (status?.linked) {
      goNext()
      return
    }
    setSkipOpen(true)
  }

  return (
    <div className="mesh-bg-onboarding min-h-screen">
      <div className="max-w-3xl mx-auto px-container-margin-mobile md:px-container-margin-desktop py-stack-lg">
        <header className="flex items-center justify-between mb-stack-lg">
          <FinoraLogo />
          <ThemeToggle />
        </header>

        <div className="mb-8 space-y-2">
          <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
            Paso 2 de 4 · Canal de alertas
          </p>
          <h1 className="text-display-lg font-display-lg text-primary text-headline-lg md:text-display-lg">
            Activa Telegram para que Finora pueda avisarte
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-2xl">
            El agente opera en segundo plano: retiros riesgosos, microahorros y confirmaciones llegan primero por
            Telegram. Vincularlo es parte del setup de tu cuenta.
          </p>
        </div>

        <TelegramLinkCard
          variant="onboarding"
          status={status}
          loading={loading}
          error={error}
          actionLoading={actionLoading}
          actionError={actionError}
          awaitingTelegram={awaitingTelegram}
          onLink={link}
          onRetry={refetch}
        />

        <footer className="mt-stack-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-outline-variant/40 pt-stack-md">
          <p className="text-label-md text-on-surface-variant">
            {status?.linked
              ? 'Telegram conectado. Puedes seguir con la configuración de metas.'
              : 'Puedes continuar sin vincular, pero verás un recordatorio hasta completar este paso.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            {!status?.linked && (
              <Button variant="ghost" type="button" onClick={() => setSkipOpen(true)}>
                Continuar sin vincular
              </Button>
            )}
            <Button type="button" onClick={handleContinue} disabled={loading}>
              {status?.linked ? 'Continuar' : 'Seguir al siguiente paso'}
            </Button>
          </div>
        </footer>
      </div>

      <TelegramSkipDialog open={skipOpen} onCancel={() => setSkipOpen(false)} onConfirm={goNext} />
    </div>
  )
}
