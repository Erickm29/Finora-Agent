import AppShellLayout from '../layouts/AppShellLayout'
import Icon from '../components/common/Icon'
import ProfileSection from '../components/settings/ProfileSection'
import SecuritySection from '../components/settings/SecuritySection'
import TelegramSection from '../components/settings/TelegramSection'
import AlertPreferencesSection from '../components/settings/AlertPreferencesSection'
import AppearanceSection from '../components/settings/AppearanceSection'
import DangerZoneSection from '../components/settings/DangerZoneSection'

export default function SettingsPage() {
  return (
    <AppShellLayout title="Settings" searchPlaceholder="Search settings..." contentClassName="px-10 pb-12 pt-8">
      <div className="max-w-5xl mx-auto space-y-stack-lg">
        <div className="flex items-end justify-between flex-wrap gap-6">
          <div>
            <h1 className="text-display-lg font-display-lg text-primary mb-2">Configuración</h1>
            <p className="text-body-lg text-on-surface-variant max-w-xl">
              Gestiona tu identidad digital, seguridad de activos y las preferencias de inteligencia de Finora.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-4 glass-card p-4 rounded-2xl mint-glow border-primary/10">
            <div className="h-12 w-12 bg-secondary-container rounded-full flex items-center justify-center">
              <Icon name="smart_toy" className="text-on-secondary-container" />
            </div>
            <div>
              <p className="text-label-sm text-secondary font-bold uppercase tracking-wider">AI Insight</p>
              <p className="text-label-md text-on-surface">"Tu seguridad es óptima."</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          <AppearanceSection />
          <ProfileSection />
          <SecuritySection />
          <TelegramSection />
          <AlertPreferencesSection />
        </div>

        <DangerZoneSection />
      </div>
    </AppShellLayout>
  )
}
