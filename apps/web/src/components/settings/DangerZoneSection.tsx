import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

/**
 * PENDING VALIDATION WITH BACKEND: no account-deletion endpoint exists in the current
 * contract (e.g. `DELETE /user`). El copy es honesto sobre esto: el único botón real
 * disponible hoy es cerrar sesión, no borrar la cuenta ni sus datos.
 */
export default function DangerZoneSection() {
  const { logout } = useAuth()
  const [confirming, setConfirming] = useState(false)

  const handleLogout = async () => {
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
        <div>
          <p className="text-body-md text-on-surface-variant">
            Eliminar la cuenta y sus datos todavía no está disponible.{' '}
            <span className="font-bold text-error">Próximamente.</span>
          </p>
          <p className="text-label-sm text-on-surface-variant mt-1">
            Por ahora podés cerrar tu sesión en este dispositivo.
          </p>
        </div>
        <button
          className="whitespace-nowrap px-8 py-3 bg-error text-on-error font-bold rounded-xl hover:opacity-90 transition-opacity"
          onClick={handleLogout}
          type="button"
        >
          {confirming ? '¿Confirmar? Toca de nuevo' : 'Cerrar Sesión'}
        </button>
      </div>
    </div>
  )
}
