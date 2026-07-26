import type { ReactNode } from 'react'
import Icon from './Icon'
import clsx from '../../utils/clsx'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: ReactNode
  illustration?: ReactNode
  className?: string
}

/**
 * Standard "no data yet" state, used instead of the original fixed example whenever
 * the authenticated user has no goals/recommendations/transactions/etc.
 */
export default function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
  illustration,
  className,
}: EmptyStateProps) {
  return (
    <div className={clsx('flex flex-col items-center justify-center gap-3 py-10 px-6 text-center', className)}>
      {illustration ? (
        <div className="w-full max-w-xs mb-2">{illustration}</div>
      ) : (
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand dark:bg-bone/10 dark:text-bone">
          <Icon name={icon} className="text-3xl" />
        </span>
      )}
      <p className="text-headline-sm font-headline-md font-semibold text-on-surface">{title}</p>
      {description && <p className="max-w-sm text-body-md font-body-md text-on-surface-variant">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
