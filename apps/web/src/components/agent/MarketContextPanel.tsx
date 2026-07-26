import Icon from '../common/Icon'
import Spinner from '../common/Spinner'
import ErrorState from '../common/ErrorState'
import EmptyState from '../common/EmptyState'
import { useMarketContext } from '../../hooks/useMarketContext'
import { formatCurrency } from '../../utils/goalMetrics'
import clsx from '../../utils/clsx'

interface MarketContextPanelProps {
  /** `sidebar` (chat del agente, ancho fijo) o `card` (grid del Dashboard). */
  variant?: 'sidebar' | 'card'
  className?: string
}

/**
 * Contexto de mercado — GET /v1/market/context (Sprint 2, Track C: Wallbit + Exa).
 * Sin datos hardcodeados: si el backend todavía no expone el endpoint o Wallbit
 * falla, se muestra un estado de error/parcial honesto en vez de inventar cifras.
 */
export default function MarketContextPanel({ variant = 'sidebar', className }: MarketContextPanelProps) {
  const { data, loading, error, refetch } = useMarketContext()
  const isPartial = data?.source === 'partial'
  const isStub = data?.source === 'stub' || data?.stub === true

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
            {isPartial ? 'Datos parciales' : 'Modo demo'}
          </span>
        )}
      </div>

      <div className="bg-surface-container-low rounded-card p-4 border border-outline-variant/40">
        {loading && <Spinner label="Buscando contexto de mercado..." className="py-6" />}

        {!loading && error && <ErrorState message={error} onRetry={refetch} className="py-6 px-2" />}

        {!loading && !error && data && (
          <div className="flex flex-col gap-4">
            {data.rates.length > 0 && (
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant mb-2">
                  Tipo de cambio
                </p>
                <div className="flex flex-col gap-1">
                  {data.rates.map((rate) => (
                    <div key={rate.pair} className="flex items-center justify-between text-label-sm">
                      <span className="text-on-surface-variant">{rate.pair}</span>
                      <span className="font-bold text-on-surface">{rate.value.toLocaleString('es-BO')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.portfolio && (
              <div className="pt-3 border-t border-outline-variant/30">
                <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant mb-2">
                  Portafolio Wallbit
                </p>
                {typeof data.portfolio.totalValueBobs === 'number' && (
                  <p className="text-headline-md font-headline-md text-on-surface">
                    {formatCurrency(data.portfolio.totalValueBobs, data.portfolio.currency ?? 'BOB')}
                  </p>
                )}
              </div>
            )}

            {data.assets.length > 0 && (
              <div className="pt-3 border-t border-outline-variant/30 flex flex-col gap-2">
                <p className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">Posiciones</p>
                {data.assets.slice(0, 5).map((asset) => (
                  <div key={asset.symbol} className="flex items-center justify-between text-label-sm">
                    <span className="text-on-surface font-semibold">{asset.name ?? asset.symbol}</span>
                    <span
                      className={clsx(
                        'font-bold',
                        (asset.changePct ?? 0) < 0 ? 'text-error' : 'text-kelly-green',
                      )}
                    >
                      {typeof asset.valueBobs === 'number' ? formatCurrency(asset.valueBobs, 'BOB') : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {data.macro && (
              <p className="text-label-sm text-on-surface-variant pt-3 border-t border-outline-variant/30">
                {data.macro}
              </p>
            )}

            {data.rates.length === 0 && !data.portfolio && data.assets.length === 0 && !data.macro && (
              <EmptyState
                icon="query_stats"
                title="Sin señales por ahora"
                description="Wallbit respondió sin datos disponibles todavía."
                className="py-4 px-2"
              />
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
