import type { Goal } from '../../types'
import { computeGoalProgress, formatCurrency } from '../../utils/goalMetrics'

interface ProgressInsightCardProps {
  goal: Goal
}

export default function ProgressInsightCard({ goal }: ProgressInsightCardProps) {
  const { percentage } = computeGoalProgress(goal)
  const circumference = 251.2
  const offset = circumference - (circumference * percentage) / 100

  return (
    <div className="bg-white rounded-card p-6 border border-outline-variant/30 shadow-md flex gap-6 max-w-lg">
      <div className="flex-1">
        <p className="text-label-sm text-on-surface-variant font-bold mb-2 uppercase tracking-wide">
          Progreso de "{goal.name}"
        </p>
        <div className="flex items-end gap-2 mb-4">
          <h3 className="text-display-lg text-primary leading-none">{percentage}%</h3>
          <span className="material-symbols-outlined text-secondary font-bold mb-2">trending_up</span>
        </div>
        <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden">
          <div className="h-full bg-secondary rounded-full relative" style={{ width: `${percentage}%` }}>
            <div className="absolute right-0 top-0 h-full w-4 bg-white/30 animate-pulse" />
          </div>
        </div>
        <p className="text-[11px] text-on-surface-variant mt-2">
          Ahorrado: {formatCurrency(goal.currentAmount, goal.currency)} vs Meta:{' '}
          {formatCurrency(goal.targetAmount, goal.currency)}
        </p>
      </div>
      <div className="w-24 h-24 flex items-center justify-center relative">
        <svg className="w-full h-full transform -rotate-90">
          <circle className="text-surface-container" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeWidth="8" />
          <circle
            className="text-secondary"
            cx="48"
            cy="48"
            fill="transparent"
            r="40"
            stroke="currentColor"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeWidth="8"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-label-md font-bold text-primary">{percentage}%</span>
      </div>
    </div>
  )
}
