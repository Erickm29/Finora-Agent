import type { HTMLAttributes, ReactNode } from 'react'
import clsx from '../../utils/clsx'

interface SoftCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export default function SoftCard({ children, className, ...rest }: SoftCardProps) {
  return (
    <div className={clsx('soft-card', className)} {...rest}>
      {children}
    </div>
  )
}
