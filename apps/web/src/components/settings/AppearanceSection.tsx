import SoftCard from '../common/SoftCard'
import Icon from '../common/Icon'
import ThemeToggle from '../common/ThemeToggle'
import { useTheme } from '../../context/ThemeContext'

export default function AppearanceSection() {
  const { theme } = useTheme()

  return (
    <section className="md:col-span-12">
      <SoftCard className="p-card-padding rounded-[24px]">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-brand/10 rounded-xl text-brand dark:bg-bone/10 dark:text-bone">
            <Icon name="palette" />
          </div>
          <div>
            <h3 className="text-headline-md font-headline-md text-primary">Apariencia</h3>
            <p className="text-label-md text-on-surface-variant">
              Tema actual: {theme === 'dark' ? 'Oscuro' : 'Claro'}. Tu preferencia se guarda en este dispositivo.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-xl bg-surface-container-low px-4 py-3">
          <span className="text-label-md font-label-md text-on-surface">Cambiar tema claro / oscuro</span>
          <ThemeToggle showLabel />
        </div>
      </SoftCard>
    </section>
  )
}
