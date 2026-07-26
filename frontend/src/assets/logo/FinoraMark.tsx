import type { SVGProps } from 'react'
import clsx from '../../utils/clsx'

/**
 * Isotipo Finora — trayectoria ascendente hacia una meta.
 * Usa currentColor para el cuerpo (tema) + acento CTA fijo (naranja calaza).
 */
export default function FinoraMark({ className, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx('text-current', className)}
      aria-hidden={rest['aria-label'] ? undefined : true}
      {...rest}
    >
      {/* Path / trail */}
      <path
        d="M6 24c4-1 7-6 9-11 2 4 5 8 11 9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Goal node — accent CTA */}
      <circle cx="26" cy="8" r="3.5" className="fill-cta" />
      <path
        d="M26 4.5V2.5M26 13.5v-2M29.5 8h2M20.5 8h2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  )
}
