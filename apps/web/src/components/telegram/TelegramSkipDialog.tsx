import Button from '../common/Button'
import Icon from '../common/Icon'

interface TelegramSkipDialogProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
}

/**
 * Confirmation friction for Telegram skip (onboarding) or unlink (settings).
 */
export default function TelegramSkipDialog({
  open,
  onCancel,
  onConfirm,
  title = '¿Continuar sin Telegram?',
  description = 'Sin Telegram no recibirás alertas ni recordatorios del agente. ¿Seguro que quieres continuar sin vincular?',
  confirmLabel = 'Continuar sin vincular',
  cancelLabel = 'Volver a vincular',
}: TelegramSkipDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand/40 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="telegram-skip-title"
        className="relative z-10 w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant p-6 space-y-4"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-error/10 text-error shrink-0">
            <Icon name="warning" className="text-2xl" />
          </span>
          <div>
            <h2 id="telegram-skip-title" className="text-headline-sm font-headline-md text-on-surface">
              {title}
            </h2>
            <p className="text-body-md text-on-surface-variant mt-2">{description}</p>
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-2">
          <Button variant="ghost" type="button" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="outline" type="button" onClick={onConfirm} className="border-error text-error">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
