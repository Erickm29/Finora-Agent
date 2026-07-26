import Spinner from '../common/Spinner'
import Button from '../common/Button'
import ErrorState from '../common/ErrorState'
import type { TelegramLinkStatus } from '../../types'
import clsx from '../../utils/clsx'

interface TelegramLinkCardProps {
  status: TelegramLinkStatus | null
  loading: boolean
  error: string | null
  actionLoading: boolean
  actionError: string | null
  onLink: () => void
  onUnlink?: () => void
  onRetry?: () => void
  /** Compact layout for settings; default is onboarding-friendly */
  variant?: 'onboarding' | 'settings'
  className?: string
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.35-.99.53-1.41.52-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.89.03-.24.37-.48 1.01-.73 3.96-1.72 6.59-2.85 7.91-3.4.63-.26 1.25-.43 1.86-.42.2 0 .44.05.63.15.18.09.34.25.43.46.12.28.14.6.09.89z" />
    </svg>
  )
}

/**
 * Shared Telegram link UI used by onboarding + settings so both read the same
 * backend status (via useTelegramLink) and never duplicate local state.
 */
export default function TelegramLinkCard({
  status,
  loading,
  error,
  actionLoading,
  actionError,
  onLink,
  onUnlink,
  onRetry,
  variant = 'settings',
  className,
}: TelegramLinkCardProps) {
  if (error && !loading) {
    return <ErrorState message={error} onRetry={onRetry} className={className} />
  }

  if (loading || !status) {
    return <Spinner className={clsx('py-8', className)} label="Consultando estado de Telegram..." />
  }

  const linked = status.linked

  return (
    <div
      className={clsx(
        'glass-card rounded-[24px] shadow-sm flex flex-col md:flex-row items-center gap-8 border-l-4 border-l-cta',
        variant === 'onboarding' ? 'p-8 md:p-10' : 'p-card-padding',
        className,
      )}
    >
      <div className="flex-shrink-0 w-24 h-24 rounded-full bg-[#26A5E4]/10 flex items-center justify-center">
        <TelegramIcon className="w-12 h-12 text-[#26A5E4]" />
      </div>

      <div className="flex-grow text-center md:text-left space-y-3">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
          <h3 className="text-headline-md font-headline-md text-primary">
            {variant === 'onboarding' ? 'Vincula tu cuenta de Telegram' : 'Conexión con Telegram'}
          </h3>
          {linked ? (
            <span className="inline-flex items-center rounded-full bg-cta px-2 py-0.5 text-label-sm font-bold text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-brand mr-1.5 animate-pulse" />
              Conectado
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-surface-container-highest px-2 py-0.5 text-label-sm font-bold text-on-surface-variant">
              Desconectado
            </span>
          )}
        </div>

        <p className="text-body-md text-on-surface-variant">
          {variant === 'onboarding'
            ? 'Finora envía alertas de guardrails, recordatorios de microahorro y confirmaciones de operaciones por Telegram. Sin este canal, el agente no puede avisarte a tiempo.'
            : 'Recibe alertas en tiempo real, ejecuta comandos rápidos y consulta tu balance desde tu chat privado con Finora Agent.'}
        </p>

        {linked && (
          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            {status.handle && (
              <span className="text-label-md text-on-surface bg-surface-container-high px-3 py-1 rounded-full">
                ID: {status.handle}
              </span>
            )}
            <span className="text-label-md text-on-surface bg-surface-container-high px-3 py-1 rounded-full">
              Sincronización: {status.syncActive ? 'Activa' : 'Inactiva'}
            </span>
          </div>
        )}

        {actionError && <p className="text-error text-label-sm font-label-sm">{actionError}</p>}
      </div>

      <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3">
        {!linked ? (
          <Button onClick={onLink} loading={actionLoading} type="button">
            Vincular Telegram
          </Button>
        ) : (
          onUnlink && (
            <Button variant="outline" onClick={onUnlink} loading={actionLoading} type="button" className="border-error text-error hover:bg-error/5">
              Desvincular
            </Button>
          )
        )}
      </div>
    </div>
  )
}
