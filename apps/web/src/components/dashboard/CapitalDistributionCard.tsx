import Icon from '../common/Icon'
import type { Goal } from '../../types'
import { formatCurrency } from '../../utils/goalMetrics'

interface CapitalDistributionCardProps {
  goals: Goal[]
}

const palette = [
  { colorClass: 'bg-kelly-green', iconWrapClass: 'bg-kelly-green/10 text-kelly-green' },
  { colorClass: 'bg-primary', iconWrapClass: 'bg-primary/10 text-primary' },
  { colorClass: 'bg-mint', iconWrapClass: 'bg-mint/20 text-forest-green' },
  { colorClass: 'bg-forest-green', iconWrapClass: 'bg-forest-green/10 text-forest-green' },
]

export default function CapitalDistributionCard({ goals }: CapitalDistributionCardProps) {
  return (
    <section className="col-span-12 md:col-span-4">
      <div className="soft-card h-full">
        <h3 className="text-label-md font-bold text-primary mb-6">Distribución de Capital por Meta</h3>
        <div className="space-y-5">
          {goals.map((goal, index) => {
            const swatch = palette[index % palette.length]
            const percentage = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0
            return (
              <div key={goal.id} className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${swatch.iconWrapClass}`}>
                  <Icon name={goal.icon} className="text-lg" />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between text-label-sm mb-1">
                    <span className="text-on-surface-variant">{goal.name}</span>
                    <span className="text-on-surface font-bold">{formatCurrency(goal.currentAmount, goal.currency)}</span>
                  </div>
                  <div className="progress-capsule">
                    <div className={`progress-fill ${swatch.colorClass}`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-8 pt-6 border-t border-outline-variant/30">
          <div className="flex items-center justify-between">
            <span className="text-label-sm font-bold text-on-surface-variant flex items-center gap-2">
              <Icon name="flag" className="text-kelly-green text-sm" />
              Metas Activas
            </span>
            <span className="bg-pistachio text-forest-green text-[10px] px-2 py-0.5 rounded-full font-bold">
              {goals.filter((g) => g.status === 'active').length} ACTIVAS
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
