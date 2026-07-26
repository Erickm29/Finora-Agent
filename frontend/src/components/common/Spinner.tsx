import clsx from '../../utils/clsx'

interface SpinnerProps {
  className?: string
  label?: string
}

export default function Spinner({ className, label = 'Cargando...' }: SpinnerProps) {
  return (
    <div className={clsx('flex flex-col items-center justify-center gap-3 py-10 text-on-surface-variant', className)}>
      <span className="h-8 w-8 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin" aria-hidden="true" />
      <p className="text-body-md font-body-md">{label}</p>
    </div>
  )
}
