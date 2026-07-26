import Icon from '../common/Icon'
import EmptyState from '../common/EmptyState'

/**
 * Market context sidebar. Hardcoded demo prices were removed (zero hardcoded data rule).
 * PENDING VALIDATION: Backend/Integraciones endpoint for market context (e.g. GET /market/context)
 * once available, wire a service + hook here — until then show an honest empty state.
 */
export default function MarketContextPanel() {
  return (
    <aside className="w-80 bg-surface-container-lowest border-l border-outline-variant/30 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
      <h3 className="text-label-md font-bold uppercase tracking-widest text-on-surface-variant">Contexto de Mercado</h3>

      <div className="bg-surface-container-low rounded-card p-4 border border-outline-variant/40">
        <EmptyState
          icon="query_stats"
          title="Sin datos de mercado aún"
          description="Cuando el backend exponga el contexto de mercado, verás proyecciones y señales aquí — siempre desde la API, nunca valores fijos."
          className="py-6 px-2"
        />
      </div>

      <div className="mt-auto">
        <div className="glass-card rounded-[32px] p-6 text-center ai-glow border-2 border-cta/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cta/10 to-transparent" />
          <div className="w-24 h-24 mx-auto relative z-10 rounded-full bg-brand flex items-center justify-center">
            <Icon name="smart_toy" className="text-cta text-5xl" filled />
          </div>
          <h4 className="text-label-md font-bold mt-4 relative z-10 text-on-surface">Finora Co-pilot</h4>
          <p className="text-[11px] text-on-surface-variant relative z-10">
            Pregúntame por tus metas o microahorros en el chat.
          </p>
        </div>
      </div>
    </aside>
  )
}
