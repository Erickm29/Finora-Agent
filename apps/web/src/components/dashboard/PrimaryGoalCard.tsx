import Icon from '../common/Icon'
import type { Goal } from '../../types'
import { computeGoalProgress, formatCurrency, formatDeadline } from '../../utils/goalMetrics'

interface PrimaryGoalCardProps {
  goal: Goal
}

export default function PrimaryGoalCard({ goal }: PrimaryGoalCardProps) {
  const { percentage, remainingAmount, projection } = computeGoalProgress(goal)
  const contributionsCount = Math.max(1, Math.round(goal.currentAmount / Math.max(1, goal.monthlySuggested)))

  return (
    <section className="col-span-12 lg:col-span-7">
      <div className="soft-card h-full bg-brand text-bone relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#FFF3E0 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }}
        />
        <div className="flex justify-between items-start mb-8 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-bone/10 px-3 py-1 rounded-full mb-4">
              <span className="text-label-sm font-bold tracking-wide uppercase text-cta">Meta Prioritaria</span>
            </div>
            <h2 className="text-display-lg font-display-lg leading-tight mb-1">{goal.name}</h2>
            <p className="text-bone/70 font-medium">
              Restan {formatCurrency(remainingAmount, goal.currency)} • Meta: {formatDeadline(goal.deadline)}
            </p>
          </div>
          <div className="w-16 h-16 rounded-3xl bg-cta/20 backdrop-blur-md flex items-center justify-center border border-bone/20">
            <Icon name={goal.icon} className="text-cta text-3xl" />
          </div>
        </div>

        <div className="space-y-6 relative z-10">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-cta text-label-sm uppercase font-bold tracking-wider mb-1">Ahorrado</p>
              <p className="text-headline-md font-headline-md">{formatCurrency(goal.currentAmount, goal.currency)}</p>
            </div>
            <div className="text-right">
              <p className="text-headline-md font-headline-md">{percentage}%</p>
            </div>
          </div>
          <div className="h-4 bg-bone/10 rounded-full overflow-hidden p-1">
            <div
              className="h-full bg-gradient-to-r from-decor to-cta rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-bone/10">
            <div>
              <p className="text-bone/60 text-[10px] uppercase font-bold tracking-widest mb-1">Ritmo Mensual</p>
              <p className="text-label-md font-bold text-cta">
                +{goal.monthlySuggested} {goal.currency}
              </p>
            </div>
            <div>
              <p className="text-bone/60 text-[10px] uppercase font-bold tracking-widest mb-1">Proyección</p>
              <p className="text-label-md font-bold text-bone">{projection}</p>
            </div>
            <div>
              <p className="text-bone/60 text-[10px] uppercase font-bold tracking-widest mb-1">Contribuciones</p>
              <p className="text-label-md font-bold text-bone">{contributionsCount} meses</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
