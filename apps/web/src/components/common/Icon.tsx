import type { CSSProperties } from 'react'
import clsx from '../../utils/clsx'

interface IconProps {
  name: string
  className?: string
  filled?: boolean
  style?: CSSProperties
}

export default function Icon({ name, className, filled, style }: IconProps) {
  return (
    <span
      className={clsx('material-symbols-outlined', filled && 'filled', className)}
      style={style}
    >
      {name}
    </span>
  )
}
