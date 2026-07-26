import { useEffect, useState } from 'react'
import Icon from '../common/Icon'
import Toggle from '../common/Toggle'
import Spinner from '../common/Spinner'
import ErrorState from '../common/ErrorState'
import { alertPreferenceConfig } from '../../data/settings'
import { useAsync } from '../../hooks/useAsync'
import * as userService from '../../services/user.service'
import type { DigestLocalTime, UserPreferences } from '../../types'

export default function AlertPreferencesSection() {
  const { data: preferences, loading, error, refetch } = useAsync(() => userService.getPreferences(), [])
  const [prefs, setPrefs] = useState<UserPreferences | null>(null)
  const [savingKey, setSavingKey] = useState<string | null>(null)

  useEffect(() => {
    if (preferences) setPrefs(preferences)
  }, [preferences])

  const handleToggle = async (
    prefKey: (typeof alertPreferenceConfig)[number]['prefKey'],
    checked: boolean,
  ) => {
    setSavingKey(prefKey)
    try {
      const next = await userService.updatePreferences({ [prefKey]: checked })
      setPrefs(next)
    } finally {
      setSavingKey(null)
    }
  }

  const handleDigestToggle = async (checked: boolean) => {
    setSavingKey('digestEnabled')
    try {
      const next = await userService.updatePreferences({ digestEnabled: checked })
      setPrefs(next)
    } finally {
      setSavingKey(null)
    }
  }

  const handleDigestTime = async (value: DigestLocalTime) => {
    setSavingKey('digestLocalTime')
    try {
      const next = await userService.updatePreferences({ digestLocalTime: value })
      setPrefs(next)
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

      {prefs && !loading && !error && (
        <div className="space-y-8">
          <div className="rounded-2xl border border-secondary/20 bg-secondary-container/10 p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-bold text-on-surface">Briefing Wallbit</h4>
                <p className="text-label-md text-on-surface-variant mt-1">
                  Te mandamos noticias y una acción preparada; vos confirmás. Nada se ejecuta solo.
                </p>
              </div>
              <Toggle
                key={`digest-${prefs.digestEnabled}`}
                defaultChecked={prefs.digestEnabled}
                onChange={(checked) => void handleDigestToggle(checked)}
              />
            </div>
            <div>
              <label className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                Horario (America/La_Paz)
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {userService.DIGEST_TIME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={!prefs.digestEnabled || savingKey === 'digestLocalTime'}
                    onClick={() => void handleDigestTime(opt.value)}
                    className={[
                      'px-4 py-2 rounded-lg text-label-md font-label-md border transition-colors',
                      prefs.digestLocalTime === opt.value
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container-low text-on-surface border-outline-variant/40 hover:border-primary/40',
                      !prefs.digestEnabled ? 'opacity-50 cursor-not-allowed' : '',
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
            {alertPreferenceConfig.map((pref) => (
              <div
                key={pref.id}
                className="flex items-center justify-between py-4 border-b border-surface-variant/30"
              >
                <div>
                  <h4 className="font-bold text-on-surface">{pref.title}</h4>
                  <p className="text-label-md text-on-surface-variant">{pref.description}</p>
                </div>
                <Toggle
                  key={`${pref.id}-${prefs[pref.prefKey]}`}
                  defaultChecked={prefs[pref.prefKey]}
                  onChange={(checked) => void handleToggle(pref.prefKey, checked)}
                />
                {savingKey === pref.prefKey && <span className="sr-only">Guardando...</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
