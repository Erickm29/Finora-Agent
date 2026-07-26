import clsx from '../../utils/clsx'

interface ProgressBarProps {
  percentage: number
  trackClassName?: string
  fillClassName?: string
  height?: string
}

export default function ProgressBar({
  percentage,
  trackClassName,
  fillClassName,
  height = 'h-3',
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percentage))
  return (
    <div className={clsx('w-full rounded-full overflow-hidden bg-secondary-container/20', height, trackClassName)}>
      <div
        className={clsx('h-full rounded-full bg-kelly-green transition-all duration-700 ease-out', fillClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
