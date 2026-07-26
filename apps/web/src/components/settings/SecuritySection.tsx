import Icon from '../common/Icon'
import { securityShortcuts } from '../../data/settings'
import { useAsync } from '../../hooks/useAsync'
import * as userService from '../../services/user.service'

export default function SecuritySection() {
  const { data: profile } = useAsync(() => userService.getProfile(), [])

  return (
    <section className="md:col-span-4 glass-card p-card-padding rounded-[24px] shadow-sm flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-error-container/20 rounded-xl text-error">
          <Icon name="shield" />
        </div>
        <h3 className="text-headline-md font-headline-md text-primary">Seguridad</h3>
      </div>
      {/*
        Sin endpoints reales para cambiar contraseña / 2FA / sesiones todavía.
        En vez de un CTA que parece funcionar y no hace nada, se marca como
        "Próximamente" y no se simula un click.
      */}
      <ul className="space-y-4 flex-grow">
        {securityShortcuts.map((item) => (
          <li key={item.id} className="flex items-center justify-between p-3 rounded-xl opacity-60">
            <div className="flex items-center gap-3">
              <Icon name={item.icon} className="text-on-surface-variant" />
              <span className="text-label-md">{item.label}</span>
            </div>
            <span className="text-label-sm font-bold text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-full">
              Próximamente
            </span>
          </li>
        ))}
      </ul>
      {/* PENDING VALIDATION: no endpoint yet for real session/device history — using the
          account creation date as the only real data point we have until Backend exposes
          something like GET /user/sessions. */}
      <div className="mt-6 p-4 bg-tertiary-fixed/20 rounded-xl border border-tertiary-fixed-dim/30">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="security_update_good" className="text-tertiary text-[18px]" />
          <span className="text-label-sm font-bold text-tertiary">Cuenta creada</span>
        </div>
        <p className="text-[12px] text-on-tertiary-fixed-variant">
          {profile ? new Date(profile.createdAt).toLocaleDateString('es', { dateStyle: 'long' }) : 'Cargando...'}
        </p>
      </div>
    </section>
  )
}
