import clsx from '../../utils/clsx'

interface LogoProps {
  /** 'isotype' = symbol only (favicon/icon size). 'logotype' = symbol + wordmark. */
  variant?: 'isotype' | 'logotype'
  className?: string
  /** Size (px) of the symbol. Wordmark scales relative to it. */
  size?: number
  /** Text color class for the wordmark + symbol body. Defaults to currentColor so the
   *  logo follows whatever text color the parent sets (e.g. text-primary on light
   *  panels, text-on-primary on dark navbar/sidebar) — this is what makes it theme-aware
   *  without swapping image files. */
  colorClassName?: string
}

/**
 * Original Finora Agent mark: an abstract ascending path/chevron reaching a fixed point —
 * "trayectoria hacia una meta". The badge shape uses `currentColor` (so it inherits
 * text-primary / text-on-primary depending on where it's placed and the active theme);
 * the ascending accent stroke is a fixed naranja calaza (#FB8B24), which per the brand
 * spec stays equally vibrant in both light and dark themes.
 */
export default function Logo({ variant = 'logotype', className, size = 32, colorClassName = 'text-current' }: LogoProps) {
  return (
    <span className={clsx('inline-flex items-center gap-2.5', colorClassName, className)}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="40" height="40" rx="12" fill="currentColor" />
        <path
          d="M11 27L17 20L22 24L29 14"
          stroke="#FB8B24"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="29" cy="14" r="2.6" fill="#FB8B24" />
      </svg>
      {variant === 'logotype' && (
        <span className="font-headline-md text-headline-md font-extrabold tracking-tight leading-none">Finora</span>
      )}
    </span>
  )
}
