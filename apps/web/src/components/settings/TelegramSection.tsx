import { useState } from 'react'
import TelegramLinkCard from '../telegram/TelegramLinkCard'
import TelegramSkipDialog from '../telegram/TelegramSkipDialog'
import { useTelegramLink } from '../../hooks/useTelegramLink'

/**
 * Settings entry for Telegram — same status source as onboarding + dashboard banner.
 * Unlink requires explicit confirmation (reuses skip dialog copy adapted).
 */
export default function TelegramSection() {
  const { status, loading, error, link, unlink, actionLoading, actionError, refetch } = useTelegramLink()
  const [confirmUnlink, setConfirmUnlink] = useState(false)

  return (
    <section className="md:col-span-12">
      <TelegramLinkCard
        variant="settings"
        status={status}
        loading={loading}
        error={error}
        actionLoading={actionLoading}
        actionError={actionError}
        onLink={link}
        onUnlink={() => setConfirmUnlink(true)}
        onRetry={refetch}
      />

      <TelegramSkipDialog
        open={confirmUnlink}
        onCancel={() => setConfirmUnlink(false)}
        onConfirm={async () => {
          setConfirmUnlink(false)
          await unlink()
        }}
        title="¿Desvincular Telegram?"
        description="Dejarás de recibir alertas y recordatorios del agente en Telegram. Podrás volver a vincular cuando quieras desde Configuración."
        confirmLabel="Sí, desvincular"
        cancelLabel="Cancelar"
      />
    </section>
  )
}
