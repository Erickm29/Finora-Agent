import Icon from '../common/Icon'
import EmptyState from '../common/EmptyState'
import type { Recommendation, RecommendationType } from '../../types'

interface AlertsPanelProps {
  recommendations: Recommendation[]
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

export default function AlertsPanel({ recommendations }: AlertsPanelProps) {
  return (
    <section className="col-span-12 md:col-span-4 space-y-gutter">
      <div className="soft-card bg-surface-container-low border-none h-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-label-md font-bold text-primary flex items-center gap-2">
            <Icon name="campaign" className="text-kelly-green" />
            Alertas Inteligentes
          </h3>
        </div>
        {recommendations.length === 0 ? (
          <EmptyState
            icon="notifications_off"
            title="Sin alertas"
            description="Aún no tenemos alertas para ti. Vuelve cuando tengas más actividad en tus metas."
            className="py-6"
          />
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => {
              const tone = toneClasses[toneByType[rec.type]]
              return (
                <div
                  key={rec.id}
                  className={`flex gap-4 p-4 rounded-2xl bg-white border border-outline-variant/30 ${tone.hoverBorder} transition-colors group cursor-pointer shadow-sm`}
                >
                  <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${tone.iconWrap}`}>
                    <Icon name={rec.icon} className="text-lg" />
                  </div>
                  <div>
                    <p className="text-label-md font-bold text-on-surface">{rec.title}</p>
                    <p className="text-[12px] text-on-surface-variant leading-tight">{rec.message}</p>
                  </div>
                  <Icon name="chevron_right" className={`text-outline-variant ml-auto ${tone.chevronHover}`} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
