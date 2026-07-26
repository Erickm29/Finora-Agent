import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

/**
 * PENDING VALIDATION WITH BACKEND: no account-deletion endpoint exists in the current
 * contract (e.g. `DELETE /user`). Until it does, this safely logs the user out after
 * confirmation instead of silently doing nothing or pretending to delete data it can't.
 */
export default function DangerZoneSection() {
  const { logout } = useAuth()
  const [confirming, setConfirming] = useState(false)

  const handleDeactivate = async () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    await logout()
  }

  return (
    <div className="p-card-padding border-2 border-error/10 bg-error-container/5 rounded-[24px]">
      <h3 className="text-headline-md font-headline-md text-error mb-4">Zona de Peligro</h3>
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-body-md text-on-surface-variant">
          Al desactivar tu cuenta, perderás el acceso a todos tus históricos de inversión y la configuración del
          Agente de IA. Esta acción es irreversible.
        </p>
        <button
          className="whitespace-nowrap px-8 py-3 bg-error text-on-error font-bold rounded-xl hover:opacity-90 transition-opacity"
          onClick={handleDeactivate}
          type="button"
        >
          {confirming ? '¿Confirmar? Toca de nuevo' : 'Eliminar Cuenta Finora'}
        </button>
      </div>
    </div>
  )
}
