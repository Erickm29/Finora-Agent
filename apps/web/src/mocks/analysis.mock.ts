import type { GoalInvestmentAnalysis } from '../types'
import { delay } from './store'

/**
 * El pipeline real tarda unos segundos, así que el mock también arranca en
 * `pending` la primera vez para poder probar el estado de carga.
 */
const served = new Set<string>()

export async function mockGetGoalAnalysis(goalId: string): Promise<GoalInvestmentAnalysis> {
  if (!served.has(goalId)) {
    served.add(goalId)
    return delay({ goalId, status: 'pending', content: null, sources: [], generatedAt: null })
  }

  return delay<GoalInvestmentAnalysis>({
    goalId,
    status: 'ready',
    generatedAt: new Date().toISOString(),
    sources: [
      {
        provider: 'exa',
        title: 'El tipo de cambio oficial sube y el mercado paralelo se tensiona',
        url: 'https://example.bo/economia/tipo-de-cambio',
        snippet: 'El dólar oficial pasó de Bs 9,73 a Bs 10,24 en las últimas semanas.',
      },
      {
        provider: 'firecrawl',
        title: 'Inflación acumulada y precios de importados en Bolivia',
        url: 'https://example.bo/economia/inflacion',
        snippet: 'Los bienes importados acumulan una subida sostenida en el último trimestre.',
      },
    ],
    content: {
      economicSummary:
        'El boliviano viene perdiendo terreno frente al dólar y los bienes importados se encarecieron. Mientras no se despeje el ingreso de divisas, conviene asumir que el costo de tu meta puede moverse.',
      confidence: 'media',
      dataCoverage: 'completa',
      scenarios: [
        {
          name: 'El dólar sigue subiendo',
          likelihood: 'alta',
          description: 'Si la escasez de divisas se mantiene, es probable que el tipo de cambio siga presionado.',
          impactOnGoal: 'Tu meta en Bs compraría menos, así que el monto objetivo podría quedarse corto.',
        },
        {
          name: 'Estabilidad cambiaria',
          likelihood: 'media',
          description: 'Si entran divisas y el plan económico se consolida, el tipo de cambio podría estabilizarse.',
          impactOnGoal: 'El plan de ahorro en bolivianos alcanzaría sin ajustes.',
        },
      ],
      recommendations: [
        {
          action: 'Sostener el aporte mensual en bolivianos',
          rationale: 'Es la base del plan y no depende de cómo se mueva el tipo de cambio.',
          amountBobs: 1500,
          cadence: 'mensual',
        },
        {
          action: 'Convertir una parte a dólares como cobertura',
          rationale: 'Si el boliviano sigue perdiendo valor, esa porción protege el poder de compra de tu meta.',
          amountBobs: 500,
          cadence: 'mensual',
        },
      ],
      risks: [
        'El precio final de tu meta puede subir si el tipo de cambio se sigue moviendo.',
        'Mantener todo en efectivo expone el ahorro a la inflación.',
      ],
    },
  })
}
