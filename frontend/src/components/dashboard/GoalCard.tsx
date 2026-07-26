import Icon from '../common/Icon'
import ProgressBar from '../common/ProgressBar'
import type { Goal } from '../../types'
import { computeGoalProgress, formatCurrency } from '../../utils/goalMetrics'

interface GoalCardProps {
  goal: Goal
}

/**
 * New component (not in the original prototype, which only rendered a single hardcoded
 * goal). Needed to satisfy "Metas: listado de metas activas del usuario con tarjetas de
 * progreso" — the Dashboard can now show more than one goal.
 */
export default function GoalCard({ goal }: GoalCardProps) {
  const { percentage, remainingAmount } = computeGoalProgress(goal)

  return (
    <div className="soft-card flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon name={goal.icon} className="text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-label-md font-bold text-on-surface truncate">{goal.name}</p>
          <p className="text-label-sm text-on-surface-variant">
            Restan {formatCurrency(remainingAmount, goal.currency)}
          </p>
        </div>
        <span className="ml-auto text-label-sm font-bold text-primary">{percentage}%</span>
      </div>
      <ProgressBar percentage={percentage} height="h-2" />
    </div>
  )
}
