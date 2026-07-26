import { useState } from 'react'
import Toggle from '../common/Toggle'
import * as userService from '../../services/user.service'
import type { DigestLocalTime } from '../../types'

interface DigestPreferencesStepProps {
  onDone: () => void
}

/**
 * Paso de onboarding: horario del briefing Wallbit.
 * Persiste vía PATCH /preferences (o localStorage en mocks).
 */
export default function DigestPreferencesStep({ onDone }: DigestPreferencesStepProps) {
  const [enabled, setEnabled] = useState(true)
  const [time, setTime] = useState<DigestLocalTime>('08:00')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await userService.updatePreferences({
        digestEnabled: enabled,
        digestLocalTime: time,
        timezone: 'America/La_Paz',
      })
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos guardar el horario.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-card-padding space-y-5 shadow-sm">
      <div>
        <h3 className="text-headline-md font-headline-md text-primary">Briefing Wallbit</h3>
        <p className="text-body-md text-on-surface-variant mt-2">
          Te mandamos noticias y una acción preparada; vos confirmás. Nada de dinero se mueve solo.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 py-2">
        <span className="font-bold text-on-surface">Activar briefing diario</span>
        <Toggle defaultChecked={enabled} onChange={setEnabled} />
      </div>

      <div>
        <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
          Horario (America/La_Paz)
        </p>
        <div className="flex flex-wrap gap-2">
          {userService.DIGEST_TIME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={!enabled}
              onClick={() => setTime(opt.value)}
              className={[
                'px-4 py-2 rounded-lg text-label-md border transition-colors',
                time === opt.value
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-container-low border-outline-variant/40',
                !enabled ? 'opacity-50' : '',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-body-md text-error">{error}</p>}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          className="flex-1 px-4 py-3 rounded-lg border border-outline-variant text-on-surface"
          onClick={onDone}
          disabled={saving}
        >
          Saltar
        </button>
        <button
          type="button"
          className="flex-[2] px-4 py-3 rounded-lg bg-primary text-on-primary font-bold disabled:opacity-60"
          onClick={() => void save()}
          disabled={saving}
        >
          {saving ? 'Guardando...' : 'Guardar y continuar'}
        </button>
      </div>
    </div>
  )
}
