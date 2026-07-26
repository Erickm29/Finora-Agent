import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IllustrationAgent } from '../../assets/illustrations'

export default function FinalCta() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/registro', { state: { email } })
  }

  return (
    <section className="py-24 relative overflow-hidden bg-background">
      <div className="max-w-4xl mx-auto px-container-margin-mobile text-center relative z-10">
        <h2 className="text-display-lg font-display-lg leading-tight text-primary mb-8">
          ¿Listo para tomar el control de tu futuro?
        </h2>
        <p className="text-body-lg font-body-lg text-on-surface-variant mb-12">
          Únete a miles de personas que ya están transformando sus sueños en planes accionables con el apoyo de
          nuestra inteligencia artificial.
        </p>
        <form
          className="bg-surface glass-card p-8 rounded-2xl shadow-xl flex flex-col md:flex-row items-center gap-6 max-w-2xl mx-auto"
          onSubmit={handleSubmit}
        >
          <div className="w-28 h-28 shrink-0">
            <IllustrationAgent className="w-full h-full" />
          </div>
          <div className="text-left flex-grow w-full">
            <h4 className="font-bold text-headline-sm text-on-surface">Empieza hoy mismo</h4>
            <p className="text-label-md text-on-surface-variant mb-4">Crea tu cuenta en menos de 2 minutos.</p>
            <div className="flex gap-4">
              <input
                className="flex-grow bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-label-md focus:ring-cta focus:border-cta text-on-surface"
                placeholder="tu@email.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="bg-cta text-brand px-6 py-3 rounded-lg font-bold hover:brightness-105" type="submit">
                Registro
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  )
}
