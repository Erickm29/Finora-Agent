import Icon from '../common/Icon'
import EmptyState from '../common/EmptyState'
import type { Recommendation, RecommendationType } from '../../types'

interface AlertsPanelProps {
  recommendations: Recommendation[]
  /** Abre el modal de confirmación humana (no mueve dinero por sí solo). */
  onConfirm: (id: string) => void
  /** Descarta la acción preparada directamente (no requiere modal: no mueve dinero). */
  onDismiss: (id: string) => void
  /** id de la recomendación que está confirmándose/descartándose ahora mismo. */
  respondingId: string | null
}

const toneByType: Record<RecommendationType, 'info' | 'warning'> = {
  micro_saving: 'info',
  progress_alert: 'warning',
  market_alert: 'info',
  wallbit_protection: 'warning',
}

const toneClasses = {
  info: {
    iconWrap: 'bg-secondary-container text-on-secondary-container',
    hoverBorder: 'hover:border-kelly-green/50',
    chevronHover: 'group-hover:text-kelly-green',
  },
  warning: {
    iconWrap: 'bg-error-container text-on-error-container',
    hoverBorder: 'hover:border-error/50',
    chevronHover: 'group-hover:text-error',
  },
}

export default function AlertsPanel({ recommendations, onConfirm, onDismiss, respondingId }: AlertsPanelProps) {
  return (
    <section className="space-y-gutter">
      <div className="soft-card bg-surface-container-low border-none h-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-label-md font-bold text-primary flex items-center gap-2">
            <Icon name="campaign" className="text-kelly-green" />
            Acciones Pendientes
          </h3>
        </div>
        {recommendations.length === 0 ? (
          <EmptyState
            icon="notifications_off"
            title="Sin acciones pendientes"
            description="Aún no tenemos nada esperando tu confirmación. Vuelve cuando tengas más actividad en tus metas."
            className="py-6"
          />
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => {
              const tone = toneClasses[toneByType[rec.type]]
              const isResponding = respondingId === rec.id
              return (
                <div
                  key={rec.id}
                  className={`flex flex-col gap-3 p-4 rounded-2xl bg-white border border-outline-variant/30 ${tone.hoverBorder} transition-colors shadow-sm`}
                >
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${tone.iconWrap}`}>
                      <Icon name={rec.icon} className="text-lg" />
                    </div>
                    <div>
                      <p className="text-label-md font-bold text-on-surface">{rec.title}</p>
                      <p className="text-[12px] text-on-surface-variant leading-tight">{rec.message}</p>
                    </div>
                  </div>
                  {rec.status === 'pending' && (
                    <div className="flex gap-2 pl-14">
                      <button
                        type="button"
                        className="text-label-sm font-bold text-kelly-green px-3 py-1.5 rounded-lg hover:bg-kelly-green/10 transition-colors disabled:opacity-50"
                        onClick={() => onConfirm(rec.id)}
                        disabled={isResponding}
                      >
                        Confirmar
                      </button>
                      <button
                        type="button"
                        className="text-label-sm font-bold text-on-surface-variant px-3 py-1.5 rounded-lg hover:bg-surface-container-low transition-colors disabled:opacity-50"
                        onClick={() => onDismiss(rec.id)}
                        disabled={isResponding}
                      >
                        {isResponding ? 'Descartando...' : 'Descartar'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
