/**
 * PENDING VALIDATION WITH BACKEND:
 * - Endpoint method: the spec lists `/agent/recommend` as POST/GET — assumed GET for
 *   "listar recomendaciones activas" and a separate action endpoint to accept/dismiss one.
 * - Exact name/shape of the accept/dismiss action endpoint (assumed
 *   `POST /agent/recommend/{id}/respond` with `{ action: "accept" | "dismiss" }`).
 */
export type RecommendationType = 'micro_saving' | 'market_alert' | 'progress_alert' | 'wallbit_protection'

export interface RecommendationSource {
  title: string
  url?: string
  snippet?: string
}

export interface Recommendation {
  id: string
  goalId: string | null
  type: RecommendationType
  title: string
  message: string
  icon: string
  suggestedAmount?: number
  currency?: string
  createdAt: string // ISO date
  status: 'pending' | 'accepted' | 'dismissed'
  /** Digest / mentor: porqué, riesgos, beneficios y fuente. */
  rationale?: string
  risks?: string[]
  benefits?: string[]
  source?: RecommendationSource
}

export type RecommendationAction = 'accept' | 'dismiss'
