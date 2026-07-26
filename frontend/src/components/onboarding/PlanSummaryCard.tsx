import { useNavigate } from 'react-router-dom'
import Icon from '../common/Icon'
import type { Goal } from '../../types'

const categoryLabels: Record<Goal['category'], string> = {
  buy: 'Compra',
  save: 'Ahorro',
  emergency: 'Emergencia',
  other: 'Meta personal',
}

interface PlanSummaryCardProps {
  goal: Goal
}

export default function PlanSummaryCard({ goal }: PlanSummaryCardProps) {
  const navigate = useNavigate()
  const months = Math.max(1, Math.round((new Date(goal.deadline).getTime() - new Date(goal.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000)))

  return (
    <div className="glass-card rounded-[24px] overflow-hidden shadow-sm p-0">
      <div className="flex flex-col md:flex-row h-full">
        <div className="p-card-padding md:w-2/5 bg-secondary-fixed/10 border-r border-outline-variant/30 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <Icon name={goal.icon} className="text-secondary" />
            <h3 className="text-headline-md font-headline-md text-primary">{goal.name}</h3>
          </div>
          <p className="text-display-lg font-display-lg text-primary">
            {goal.targetAmount.toLocaleString('es')} <span className="text-headline-md">{goal.currency}</span>
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="px-2 py-1 bg-secondary-container text-on-secondary-container rounded text-label-sm font-label-sm">
              {goal.priority} Priority
            </span>
            <span className="px-2 py-1 bg-surface-container-highest text-on-surface-variant rounded text-label-sm font-label-sm">
              {categoryLabels[goal.category]}
            </span>
          </div>
        </div>
        <div className="p-card-padding md:w-3/5 grid grid-cols-2 gap-stack-md">
          <div className="space-y-1">
            <span className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Tiempo Estimado</span>
            <div className="flex items-baseline gap-1">
              <span className="text-headline-lg font-headline-lg text-on-surface">{months}</span>
              <span className="text-body-md font-body-md text-on-surface-variant">meses</span>
            </div>
            <div className="w-full h-2 bg-secondary-container/30 rounded-full mt-2">
              <div className="w-1/3 h-full bg-secondary rounded-full" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Ahorro Mensual</span>
            <div className="flex items-baseline gap-1 text-on-secondary-container font-semibold">
              <span className="text-headline-lg font-headline-lg">{goal.monthlySuggested}</span>
              <span className="text-body-md font-body-md">{goal.currency}</span>
            </div>
            <p className="text-label-sm font-label-sm text-secondary flex items-center gap-1">
              <Icon name="auto_awesome" className="text-[14px]" /> Optimizado por IA
            </p>
          </div>
          <div className="col-span-2 pt-2">
            <button
              className="w-full bg-secondary hover:bg-primary text-on-primary py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 group active:scale-95 duration-150"
              onClick={() => navigate('/dashboard')}
              type="button"
            >
              Ir a mi Dashboard
              <Icon name="arrow_forward" className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
