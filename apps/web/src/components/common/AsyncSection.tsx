import type { ReactNode } from 'react'
import Spinner from './Spinner'
import ErrorState from './ErrorState'
import EmptyState from './EmptyState'

interface AsyncSectionProps<T> {
  loading: boolean
  error: string | null
  data: T | null
  onRetry?: () => void
  isEmpty?: (data: T) => boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  emptyIcon?: string
  loadingLabel?: string
  className?: string
  children: (data: T) => ReactNode
}

/**
 * Shared loading/error/empty orchestration so every dashboard/agent/settings section
 * follows the exact same UX contract required by the spec, instead of re-implementing
 * three branches per component.
 */
export default function AsyncSection<T>({
  loading,
  error,
  data,
  onRetry,
  isEmpty,
  emptyTitle = 'Sin datos por ahora',
  emptyDescription,
  emptyAction,
  emptyIcon,
  loadingLabel,
  className,
  children,
}: AsyncSectionProps<T>) {
  if (loading) return <Spinner className={className} label={loadingLabel} />
  if (error) return <ErrorState className={className} message={error} onRetry={onRetry} />
  if (data === null || data === undefined || (isEmpty ? isEmpty(data) : false)) {
    return <EmptyState className={className} icon={emptyIcon} title={emptyTitle} description={emptyDescription} action={emptyAction} />
  }
  return <>{children(data)}</>
}
