import Icon from './Icon'
import { useTheme } from '../../context/ThemeContext'
import clsx from '../../utils/clsx'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export default function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={clsx(
        'inline-flex items-center gap-2 rounded-xl px-3 py-2 transition-colors',
        'text-on-surface-variant hover:text-on-surface hover:bg-surface-container',
        className,
      )}
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={isDark ? 'Tema claro' : 'Tema oscuro'}
    >
      <Icon name={isDark ? 'light_mode' : 'dark_mode'} className="text-[22px]" />
      {showLabel && (
        <span className="text-label-md font-label-md">{isDark ? 'Claro' : 'Oscuro'}</span>
      )}
    </button>
  )
}
