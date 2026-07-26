import { useState } from 'react'
import Icon from '../common/Icon'
import Toggle from '../common/Toggle'
import Spinner from '../common/Spinner'
import ErrorState from '../common/ErrorState'
import { alertPreferenceConfig } from '../../data/settings'
import { useAsync } from '../../hooks/useAsync'
import * as userService from '../../services/user.service'

export default function AlertPreferencesSection() {
  const { data: preferences, loading, error, refetch } = useAsync(() => userService.getPreferences(), [])
  const [savingKey, setSavingKey] = useState<string | null>(null)

  const handleToggle = async (prefKey: (typeof alertPreferenceConfig)[number]['prefKey'], checked: boolean) => {
    setSavingKey(prefKey)
    try {
      await userService.updatePreferences({ [prefKey]: checked })
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <section className="md:col-span-12 glass-card p-card-padding rounded-[24px] shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-secondary-container/20 rounded-xl text-secondary">
            <Icon name="notifications_active" />
          </div>
          <h3 className="text-headline-md font-headline-md text-primary">Preferencias de Alertas</h3>
        </div>
      </div>

      {loading && <Spinner label="Cargando tus preferencias..." />}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}

      {preferences && !loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
          {alertPreferenceConfig.map((pref) => (
            <div key={pref.id} className="flex items-center justify-between py-4 border-b border-surface-variant/30">
              <div>
                <h4 className="font-bold text-on-surface">{pref.title}</h4>
                <p className="text-label-md text-on-surface-variant">{pref.description}</p>
              </div>
              <Toggle
                key={`${pref.id}-${preferences[pref.prefKey]}`}
                defaultChecked={preferences[pref.prefKey]}
                onChange={(checked) => handleToggle(pref.prefKey, checked)}
              />
              {savingKey === pref.prefKey && <span className="sr-only">Guardando...</span>}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
