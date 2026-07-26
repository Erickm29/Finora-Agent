import Icon from '../common/Icon'
import clsx from '../../utils/clsx'

interface ChoiceCardProps {
  icon: string
  label: string
  selected?: boolean
  onClick?: () => void
}

export default function ChoiceCard({ icon, label, selected, onClick }: ChoiceCardProps) {
  return (
    <button
      className={clsx(
        'glass-card p-stack-md rounded-2xl text-left hover:border-secondary transition-all group hover:scale-[1.02] duration-200',
        selected && 'border-secondary ring-2 ring-secondary/40',
      )}
      onClick={onClick}
      type="button"
    >
      <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center mb-3 group-hover:bg-secondary-container transition-colors">
        <Icon name={icon} className="text-primary" />
      </div>
      <span className="text-label-md font-label-md text-on-surface">{label}</span>
    </button>
  )
}
