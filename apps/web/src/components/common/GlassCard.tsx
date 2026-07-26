import type { HTMLAttributes, ReactNode } from 'react'
import clsx from '../../utils/clsx'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  as?: 'div' | 'section'
}

export default function GlassCard({ children, className, as = 'div', ...rest }: GlassCardProps) {
  const Component = as
  return (
    <Component className={clsx('glass-card rounded-2xl', className)} {...rest}>
      {children}
    </Component>
  )
}
