import Icon from '../common/Icon'
import Spinner from '../common/Spinner'
import ErrorState from '../common/ErrorState'
import { useMarketContext } from '../../hooks/useMarketContext'
import clsx from '../../utils/clsx'

interface MarketContextPanelProps {
  /** `sidebar` (chat del agente, ancho fijo) o `card` (grid del Dashboard). */
  variant?: 'sidebar' | 'card'
  className?: string
}

/**
 * Contexto de mercado — GET /v1/market/context (Sprint 2, Track C: Wallbit + Exa).
 * El backend ya arma `insights` en texto: acá solo se muestran tal cual, más el
 * detalle de tipo de cambio/posiciones cuando hay. Si la request falla (red o
 * backend caído), se muestra un error real en vez de inventar datos.
 */
export default function MarketContextPanel({ variant = 'sidebar', className }: MarketContextPanelProps) {
  const { data, loading, error, refetch } = useMarketContext()
  const isPartial = data?.source === 'partial' || data?.source === 'fallback'
  const isStub = data?.stub === true

  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-label-md font-bold uppercase tracking-widest text-on-surface-variant">
          Contexto de Mercado
        </h3>
        {data && (isPartial || isStub) && (
          <span
            className={clsx(
              'text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0',
              isPartial ? 'bg-error/10 text-error' : 'bg-secondary-container text-on-secondary-container',
            )}
          >
            {isStub ? 'Modo demo' : 'Datos parciales'}
          </span>
        )}
      </div>

      <div className="bg-surface-container-low rounded-card p-4 border border-outline-variant/40">
        {loading && <Spinner label="Buscando contexto de mercado..." className="py-6" />}

        {!loading && error && <ErrorState message={error} onRetry={refetch} className="py-6 px-2" />}

        {!loading && !error && data && (
          <div className="flex flex-col gap-4">
            <ul className="flex flex-col gap-2">
              {data.insights.map((insight, index) => (
                <li key={index} className="flex items-start gap-2 text-label-sm text-on-surface">
                  <Icon name="insights" className="text-primary text-base mt-0.5 shrink-0" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>

            {data.assets.length > 0 && (
              <div className="pt-3 border-t border-outline-variant/30 flex flex-col gap-2">
                <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">Posiciones</p>
                {data.assets.slice(0, 5).map((asset) => (
                  <div key={asset.symbol} className="flex items-center justify-between text-label-sm">
                    <span className="text-on-surface font-semibold">{asset.name ?? asset.symbol}</span>
                    <span className="font-bold text-on-surface-variant">
                      {typeof asset.price === 'number'
                        ? `${asset.price.toLocaleString('es-BO')} ${asset.currency ?? ''}`.trim()
                        : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {data.macro?.summary && (
              <p className="text-label-sm text-on-surface-variant pt-3 border-t border-outline-variant/30">
                {data.macro.summary}
              </p>
            )}
          </div>
        )}
      </div>
    </>
  )

  if (variant === 'card') {
    return <section className={clsx('col-span-12 lg:col-span-4 flex flex-col gap-4', className)}>{content}</section>
  }

  return (
    <aside
      className={clsx(
        'w-80 bg-surface-container-lowest border-l border-outline-variant/30 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar',
        className,
      )}
    >
      {content}

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
