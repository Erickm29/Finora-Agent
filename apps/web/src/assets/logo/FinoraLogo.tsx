import type { SVGProps } from 'react'
import clsx from '../../utils/clsx'
import FinoraMark from './FinoraMark'

interface FinoraLogoProps extends SVGProps<SVGSVGElement> {
  /** Show wordmark next to mark */
  withWordmark?: boolean
  markClassName?: string
  wordmarkClassName?: string
}

/**
 * Logotipo Finora — mark + wordmark. Colores vía currentColor / tokens de tema.
 */
export default function FinoraLogo({
  withWordmark = true,
  className,
  markClassName,
  wordmarkClassName,
  ...rest
}: FinoraLogoProps) {
  if (!withWordmark) {
    return <FinoraMark className={clsx('h-8 w-8', className, markClassName)} {...rest} />
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2.5 text-brand dark:text-bone',
        className,
      )}
    >
      <FinoraMark className={clsx('h-9 w-9 shrink-0', markClassName)} />
      <span
        className={clsx(
          'font-headline-md text-headline-md font-bold tracking-tight',
          wordmarkClassName,
        )}
      >
        Finora
      </span>
    </span>
  )
}
