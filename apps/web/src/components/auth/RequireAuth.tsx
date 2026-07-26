import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../common/Spinner'

/** Guards every authenticated-only route (Dashboard, Agente, Configuración, creación de
 *  metas). Redirects to /login and remembers the page the user wanted, so the eventual
 *  session-restore/redirect-after-login UX (real backend) can send them back. */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner label="Verificando sesión..." />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}
