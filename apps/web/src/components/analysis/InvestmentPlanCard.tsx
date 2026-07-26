import Icon from '../common/Icon'
import type { Cadence, GoalInvestmentAnalysis, Likelihood } from '../../types'

const likelihoodStyles: Record<Likelihood, string> = {
  alta: 'bg-error-container/60 text-on-error-container',
  media: 'bg-secondary-container text-on-secondary-container',
  baja: 'bg-surface-container-highest text-on-surface-variant',
}

const likelihoodLabels: Record<Likelihood, string> = {
  alta: 'Probabilidad alta',
  media: 'Probabilidad media',
  baja: 'Probabilidad baja',
}

const cadenceLabels: Record<Cadence, string> = {
  unica: 'Una vez',
  semanal: 'Cada semana',
  quincenal: 'Cada quincena',
  mensual: 'Cada mes',
}

interface InvestmentPlanCardProps {
  analysis: GoalInvestmentAnalysis | null
  pending: boolean
  refreshing: boolean
  error: string | null
  onRefresh: () => void
}

export default function InvestmentPlanCard({
  analysis,
  pending,
  refreshing,
  error,
  onRefresh,
}: InvestmentPlanCardProps) {
  const content = analysis?.content ?? null

  return (
    <section className="soft-card overflow-hidden relative">
      <div className="absolute -right-12 -top-12 w-40 h-40 bg-secondary-fixed/10 blur-3xl rounded-full" />

      <header className="relative z-10 flex items-start justify-between gap-4 mb-stack-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl agent-gradient flex items-center justify-center shadow-lg border border-white/50 shrink-0">
            <Icon name="insights" className="text-forest-green text-3xl" filled />
          </div>
          <div>
            <h3 className="text-headline-md font-headline-md text-primary">Plan de inversión</h3>
            <p className="text-label-md text-on-surface-variant">
              Basado en el contexto económico de Bolivia
            </p>
          </div>
        </div>
        {content && (
          <button
            className="text-label-md font-label-md text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 shrink-0 disabled:opacity-50"
            onClick={onRefresh}
            disabled={refreshing}
            type="button"
          >
            <Icon name="refresh" className="text-[18px]" />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
        )}
      </header>

      {pending && !content && (
        <div className="relative z-10 flex items-center gap-3 bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30">
          <span
            className="h-5 w-5 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin shrink-0"
            aria-hidden="true"
          />
          <p className="text-body-md text-on-surface-variant">
            Estoy revisando el dólar, la inflación y las noticias económicas para armar tu plan. Tarda unos
            segundos.
          </p>
        </div>
      )}

      {!pending && !content && (
        <div className="relative z-10 bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30">
          <p className="text-body-md text-on-surface-variant">
            {error ?? 'Todavía no tengo un análisis para esta meta. Probá actualizarlo en un momento.'}
          </p>
          <button
            className="mt-4 text-label-md font-label-md text-secondary hover:underline flex items-center gap-1"
            onClick={onRefresh}
            disabled={refreshing}
            type="button"
          >
            <Icon name="refresh" className="text-[18px]" />
            {refreshing ? 'Analizando...' : 'Generar análisis'}
          </button>
        </div>
      )}

      {content && (
        <div className="relative z-10 space-y-stack-md">
          <div className="bg-secondary-fixed/10 rounded-2xl p-card-padding border border-outline-variant/30">
            <p className="text-body-lg font-body-lg text-on-surface leading-relaxed">
              {content.economicSummary}
            </p>
            {content.dataCoverage === 'sin-fuentes' && (
              <p className="mt-3 text-label-md font-label-md text-on-surface-variant flex items-start gap-2">
                <Icon name="info" className="text-[18px] shrink-0" />
                No pude consultar noticias económicas recientes, así que el plan se apoya solo en los números
                de tu meta.
              </p>
            )}
          </div>

          {content.scenarios.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-title-md font-title-md text-primary flex items-center gap-2">
                <Icon name="alt_route" className="text-[20px] text-secondary" />
                Escenarios posibles
              </h4>
              <p className="text-label-md font-label-md text-on-surface-variant">
                Son proyecciones, no certezas.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {content.scenarios.map((scenario) => (
                  <article
                    key={scenario.name}
                    className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/30 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-title-sm font-title-sm text-on-surface">{scenario.name}</h5>
                      <span
                        className={`px-2 py-1 rounded text-label-sm font-label-sm shrink-0 ${likelihoodStyles[scenario.likelihood]}`}
                      >
                        {likelihoodLabels[scenario.likelihood]}
                      </span>
                    </div>
                    <p className="text-body-md font-body-md text-on-surface-variant">{scenario.description}</p>
                    <p className="text-body-md font-body-md text-secondary">{scenario.impactOnGoal}</p>
                  </article>
                ))}
              </div>
            </div>
          )}

          {content.recommendations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-title-md font-title-md text-primary flex items-center gap-2">
                <Icon name="checklist" className="text-[20px] text-secondary" />
                Qué te recomiendo
              </h4>
              <ol className="space-y-3">
                {content.recommendations.map((rec, index) => (
                  <li
                    key={`${rec.action}-${index}`}
                    className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/30"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-label-md font-label-md shrink-0">
                        {index + 1}
                      </span>
                      <div className="space-y-1 min-w-0">
                        <p className="text-body-lg font-body-lg text-on-surface">{rec.action}</p>
                        <p className="text-body-md font-body-md text-on-surface-variant">
                          <span className="text-secondary">Por qué:</span> {rec.rationale}
                        </p>
                        {(rec.amountBobs !== null || rec.cadence) && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {rec.amountBobs !== null && (
                              <span className="px-2 py-1 bg-secondary-container text-on-secondary-container rounded text-label-sm font-label-sm">
                                Bs {rec.amountBobs.toLocaleString('es-BO')}
                              </span>
                            )}
                            {rec.cadence && (
                              <span className="px-2 py-1 bg-surface-container-highest text-on-surface-variant rounded text-label-sm font-label-sm">
                                {cadenceLabels[rec.cadence]}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="text-label-md font-label-md text-on-surface-variant flex items-start gap-2">
                <Icon name="lock" className="text-[18px] shrink-0" />
                Ninguna conversión se ejecuta sin tu confirmación.
              </p>
            </div>
          )}

          {content.risks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-title-md font-title-md text-primary flex items-center gap-2">
                <Icon name="warning" className="text-[20px] text-secondary" />
                A tener en cuenta
              </h4>
              <ul className="space-y-1">
                {content.risks.map((risk) => (
                  <li key={risk} className="text-body-md font-body-md text-on-surface-variant flex gap-2">
                    <span className="text-secondary shrink-0">•</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis && analysis.sources.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-label-md font-label-md text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1">
                <Icon name="expand_more" className="text-[18px] group-open:rotate-180 transition-transform" />
                {analysis.sources.length} fuentes consultadas
              </summary>
              <ul className="mt-3 space-y-2 pl-6">
                {analysis.sources.map((source, index) => (
                  <li key={`${source.url ?? source.title}-${index}`} className="text-body-md font-body-md">
                    {source.url ? (
                      <a
                        className="text-secondary hover:underline"
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {source.title}
                      </a>
                    ) : (
                      <span className="text-on-surface-variant">{source.title}</span>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {error && (
            <p className="text-body-md font-body-md text-error">{error}</p>
          )}
        </div>
      )}
    </section>
  )
}
