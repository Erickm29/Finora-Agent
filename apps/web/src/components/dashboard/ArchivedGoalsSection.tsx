import Icon from '../common/Icon'
import type { Goal } from '../../types'
import { formatCurrency } from '../../utils/goalMetrics'

interface ArchivedGoalsSectionProps {
  goals: Goal[]
}

/**
 * Metas con status `cancelled` (soft-delete, Sprint 2 Track B): quedan fuera
 * de todos los cálculos activos pero visibles acá por si el usuario quiere
 * revisar qué eliminó. Colapsada por defecto para no competir con las metas activas.
 */
export default function ArchivedGoalsSection({ goals }: ArchivedGoalsSectionProps) {
  if (goals.length === 0) return null

  return (
    <details className="soft-card group">
      <summary className="flex items-center gap-2 cursor-pointer list-none text-label-md font-bold text-on-surface-variant">
        <Icon name="chevron_right" className="text-lg transition-transform group-open:rotate-90" />
        Archivadas ({goals.length})
      </summary>
      <div className="mt-4 flex flex-col gap-3">
        {goals.map((goal) => (
          <div key={goal.id} className="flex items-center gap-3 opacity-60">
            <div className="w-8 h-8 rounded-lg bg-on-surface-variant/10 flex items-center justify-center shrink-0">
              <Icon name={goal.icon} className="text-on-surface-variant text-sm" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-label-sm font-bold text-on-surface truncate">{goal.name}</p>
            </div>
            <span className="text-label-sm text-on-surface-variant">
              {formatCurrency(goal.currentAmount, goal.currency)} / {formatCurrency(goal.targetAmount, goal.currency)}
            </span>
          </div>
        ))}
      </div>
    </details>
  )
}
