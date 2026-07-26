import Icon from './Icon'
import Button from './Button'
import clsx from '../../utils/clsx'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
  className?: string
}

export default function ErrorState({
  message = 'No se pudo conectar con el servidor. Intenta de nuevo.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={clsx('flex flex-col items-center justify-center gap-3 py-10 px-6 text-center', className)}>
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-error/10 text-error">
        <Icon name="error" className="text-3xl" />
      </span>
      <p className="max-w-sm text-body-md font-body-md text-on-surface-variant">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <Icon name="refresh" className="text-lg" />
          Reintentar
        </Button>
      )}
    </div>
  )
}
