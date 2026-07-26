import { useEffect, useState } from 'react'
import Icon from '../common/Icon'

export interface ActionConfirmationData {
  title: string
  subtitle: string
  statement: string
  reason: string
  amount: number
  currency: string
  /** Only known for flows where the backend/mock actually returns an account (e.g. Wallbit).
   *  Omit rather than invent a value — do not hardcode a fixed account name here. */
  sourceAccount?: string
  /** Success-probability delta is specific to Wallbit-style operations. Omit for generic
   *  recommendations that don't carry this data from the API. */
  successProbabilityBefore?: number
  successProbabilityAfter?: number
  riskReductionNote: string
  reversibleNote: string
  confirmLabel?: string
}

interface ActionConfirmationModalProps {
  open: boolean
  data: ActionConfirmationData | null
  onClose: () => void
  onConfirmed?: () => void
}

/**
 * Fully data-driven now: the caller (Dashboard's recommendation flow, or the Agent Chat's
 * "wallbit_confirmation" embedded action) supplies `data`, so this component no longer
 * imports a fixed example.
 */
export default function ActionConfirmationModal({ open, data, onClose, onConfirmed }: ActionConfirmationModalProps) {
  const [progressWidth, setProgressWidth] = useState(0)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    if (!open || !data || data.successProbabilityAfter === undefined) {
      setProgressWidth(0)
      return
    }
    const timer = setTimeout(() => setProgressWidth(data.successProbabilityAfter ?? 0), 300)
    return () => clearTimeout(timer)
  }, [open, data])

  if (!open || !data) return null

  const hasProbabilityImpact = data.successProbabilityBefore !== undefined && data.successProbabilityAfter !== undefined

  const handleConfirm = () => {
    setShowToast(true)
    onConfirmed?.()
    setTimeout(() => {
      setShowToast(false)
      onClose()
    }, 2200)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl bg-surface-container-lowest rounded-[24px] shadow-2xl border border-outline-variant/30 overflow-hidden mint-glow">
        <div className="bg-primary-container p-stack-md text-white flex items-center gap-stack-md">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 animate-float-slow">
            <Icon name="smart_toy" className="text-tertiary-fixed" style={{ fontSize: 32 }} filled />
          </div>
          <div>
            <h1 className="text-headline-md font-headline-md text-secondary-fixed">{data.title}</h1>
            <p className="text-label-md font-label-md text-on-primary-container">{data.subtitle}</p>
          </div>
        </div>

        <div className="p-card-padding space-y-stack-md">
          <div className="p-stack-md bg-secondary-container/20 rounded-xl border-l-4 border-secondary">
            <p className="text-body-lg font-body-lg text-on-surface italic">"{data.statement}"</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-sm">
            <div className="bg-surface-container-low p-stack-sm rounded-xl border border-outline-variant/20">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="info" className="text-primary text-sm" />
                <span className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                  Razón de la Acción
                </span>
              </div>
              <p className="text-body-md font-body-md text-on-surface">{data.reason}</p>
            </div>

            <div className="bg-surface-container-low p-stack-sm rounded-xl border border-outline-variant/20">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="payments" className="text-primary text-sm" />
                <span className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                  Monto a Convertir
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-headline-md font-headline-md text-primary">
                  {data.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-label-md font-label-md text-on-surface-variant">{data.currency}</span>
              </div>
              {data.sourceAccount && (
                <p className="text-label-sm font-label-sm text-on-surface-variant">Desde {data.sourceAccount}</p>
              )}
            </div>

            {hasProbabilityImpact && (
              <div className="md:col-span-2 bg-primary-container/5 p-stack-sm rounded-xl border border-primary/10">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="trending_up" className="text-secondary text-sm" />
                  <span className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                    Impacto en tu Objetivo
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-end">
                    <span className="text-body-md font-body-md text-on-surface">Probabilidad de éxito</span>
                    <div className="flex items-center gap-2">
                      <span className="text-label-md font-label-md text-on-surface-variant line-through">
                        {data.successProbabilityBefore}%
                      </span>
                      <span className="text-headline-md font-headline-md text-secondary">{data.successProbabilityAfter}%</span>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-secondary/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${progressWidth}%` }}
                    />
                  </div>
                  <p className="text-label-sm font-label-sm text-on-surface-variant">{data.riskReductionNote}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 p-3 bg-surface-variant/20 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
              <Icon name="lock_open" className="text-primary" />
            </div>
            <div>
              <p className="text-label-md font-label-md text-on-surface font-semibold">Tú tienes el control</p>
              <p className="text-label-sm font-label-sm text-on-surface-variant">{data.reversibleNote}</p>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-stack-sm pt-4">
            <button
              className="flex-1 px-6 py-4 rounded-lg border-2 border-primary text-primary font-headline-md text-label-md hover:bg-primary/5 transition-all duration-200 active:scale-95"
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="flex-[2] px-6 py-4 rounded-lg bg-primary text-white font-headline-md text-label-md shadow-lg shadow-primary/20 hover:opacity-90 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
              onClick={handleConfirm}
              type="button"
            >
              <Icon name="check_circle" />
              {data.confirmLabel ?? 'Confirmar Conversión'}
            </button>
          </div>
        </div>
      </div>

      <div
        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] bg-on-surface text-surface py-4 px-8 rounded-full shadow-2xl flex items-center gap-3 transition-all duration-500"
        style={{
          opacity: showToast ? 1 : 0,
          transform: showToast ? 'translate(-50%, 0)' : 'translate(-50%, 40px)',
          pointerEvents: 'none',
        }}
      >
        <Icon name="verified" className="text-secondary-fixed" filled />
        <span className="font-label-md text-label-md">¡Acción confirmada! Estamos procesando tu solicitud.</span>
      </div>
    </div>
  )
}
