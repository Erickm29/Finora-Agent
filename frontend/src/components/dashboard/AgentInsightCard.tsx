import { useNavigate } from 'react-router-dom'
import Icon from '../common/Icon'
import type { Recommendation } from '../../types'

interface AgentInsightCardProps {
  recommendation: Recommendation | null
  onAccept: (id: string) => void
  accepting: boolean
}

export default function AgentInsightCard({ recommendation, onAccept, accepting }: AgentInsightCardProps) {
  const navigate = useNavigate()

  return (
    <section className="col-span-12 lg:col-span-5 relative">
      <div className="soft-card h-full flex flex-col justify-between overflow-hidden relative group border-mint/30 border-2">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-mint/20 blur-3xl rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl agent-gradient flex items-center justify-center shadow-lg border border-white/50">
              <Icon name="smart_toy" className="text-forest-green text-3xl" filled />
            </div>
            <div>
              <h3 className="text-headline-md font-headline-md text-primary">Finora analizó tu situación</h3>
              <p className="text-label-md text-on-surface-variant">Insights personalizados hoy</p>
            </div>
          </div>

          {recommendation ? (
            <div className="bg-mint/10 rounded-2xl p-6 border border-mint/20 mb-6">
              <p className="text-body-lg text-primary font-medium leading-relaxed italic">"{recommendation.message}"</p>
            </div>
          ) : (
            <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30 mb-6">
              <p className="text-body-md text-on-surface-variant">
                Sin novedades por ahora. Te avisaré en cuanto detecte una oportunidad para tus metas.
              </p>
            </div>
          )}
        </div>
        {recommendation && (
          <div className="flex flex-wrap gap-3 relative z-10">
            <button
              className="bg-cta text-brand px-6 py-3 rounded-xl font-bold text-sm hover:brightness-95 transition-transform active:scale-95 shadow-md disabled:opacity-60"
              onClick={() => onAccept(recommendation.id)}
              disabled={accepting}
              type="button"
            >
              {accepting ? 'Aplicando...' : 'Aceptar'}
            </button>
            <button
              className="text-forest-green font-bold text-sm px-4 py-3 flex items-center gap-2 hover:underline"
              onClick={() => navigate('/agente')}
              type="button"
            >
              <Icon name="chat" className="text-base" />
              Preguntar al agente
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
