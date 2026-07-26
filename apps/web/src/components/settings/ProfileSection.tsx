import { useEffect, useState } from 'react'
import Icon from '../common/Icon'
import Spinner from '../common/Spinner'
import ErrorState from '../common/ErrorState'
import { useAsync } from '../../hooks/useAsync'
import * as userService from '../../services/user.service'
import { ApiError } from '../../types/api'

export default function ProfileSection() {
  const { data: profile, loading, error, refetch } = useAsync(() => userService.getProfile(), [])

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [country, setCountry] = useState('')
  const [timezone, setTimezone] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!profile) return
    setFullName(profile.fullName)
    setEmail(profile.email)
    setCountry(profile.country)
    setTimezone(profile.timezone)
  }, [profile])

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      await userService.updateProfile({ fullName, email, country, timezone })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'No se pudo guardar el perfil.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="md:col-span-8 glass-card p-card-padding rounded-[24px] shadow-sm relative overflow-hidden">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary-container/10 rounded-xl text-primary">
          <Icon name="person" filled />
        </div>
        <h3 className="text-headline-md font-headline-md text-primary">Perfil Personal</h3>
      </div>

      {loading && <Spinner label="Cargando tu perfil..." />}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-md">
            <div className="space-y-2">
              <label className="font-label-md text-label-md text-on-surface-variant px-1">Nombre Completo</label>
              <input
                className="w-full bg-surface-container-low border border-transparent focus:border-secondary focus:ring-0 rounded-lg px-4 py-3 text-body-md transition-all"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="font-label-md text-label-md text-on-surface-variant px-1">Correo Electrónico</label>
              <input
                className="w-full bg-surface-container-low border border-transparent focus:border-secondary focus:ring-0 rounded-lg px-4 py-3 text-body-md transition-all"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="font-label-md text-label-md text-on-surface-variant px-1">País de Residencia</label>
              <select
                className="w-full bg-surface-container-low border border-transparent focus:border-secondary focus:ring-0 rounded-lg px-4 py-3 text-body-md transition-all appearance-none"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option>España</option>
                <option>México</option>
                <option>Argentina</option>
                <option>Bolivia</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-label-md text-label-md text-on-surface-variant px-1">Zona Horaria</label>
              <input
                className="w-full bg-surface-container-low border border-transparent focus:border-secondary focus:ring-0 rounded-lg px-4 py-3 text-body-md transition-all"
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-8 flex justify-end items-center gap-4">
            {saveError && <span className="text-error text-label-md font-label-md">{saveError}</span>}
            {saved && <span className="text-secondary text-label-md font-label-md">Cambios guardados ✓</span>}
            <button
              className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
              onClick={handleSave}
              disabled={saving}
              type="button"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </>
      )}
    </section>
  )
}
