import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from '../../utils/clsx'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'kelly'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
  fullWidth?: boolean
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  // CTA positivo = menta + texto carbón
  primary: 'bg-cta text-brand hover:brightness-95 shadow-sm hover:shadow-md',
  secondary: 'bg-premium text-brand hover:brightness-95 shadow-sm',
  outline:
    'border-2 border-brand text-brand dark:border-bone dark:text-bone hover:bg-brand/5 bg-transparent',
  ghost: 'text-brand dark:text-bone hover:bg-brand/5 bg-transparent',
  kelly: 'bg-cta text-brand hover:scale-[1.02] shadow-sm',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-label-md rounded-lg',
  md: 'px-6 py-3 text-label-md rounded-xl',
  lg: 'px-8 py-4 text-label-md rounded-xl',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  loading,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'font-headline-md font-bold transition-all active:scale-95 flex items-center justify-center gap-2',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        (loading || disabled) && 'opacity-70 cursor-not-allowed active:scale-100',
        className,
      )}
      disabled={loading || disabled}
      {...rest}
    >
      {loading && (
        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden="true" />
      )}
      {children}
    </button>
  )
}
