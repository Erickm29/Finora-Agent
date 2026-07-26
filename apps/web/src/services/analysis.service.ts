import type {
  AnalysisStatus,
  EconomicSource,
  GoalInvestmentAnalysis,
  InvestmentAnalysisContent,
} from '../types'
import { mockGetGoalAnalysis } from '../mocks/analysis.mock'
import { apiRequest } from './apiClient'
import { USE_MOCKS } from './config'

/** DTO de `/v1/goals/:id/analysis` (snake_case). */
interface ApiAnalysisResponse {
  status: AnalysisStatus
  analysis: {
    goal_id: string
    status: AnalysisStatus
    content: InvestmentAnalysisContent | null
    sources: EconomicSource[]
    generated_at: string | null
  } | null
}

function mapAnalysis(goalId: string, res: ApiAnalysisResponse): GoalInvestmentAnalysis {
  if (!res.analysis) {
    return { goalId, status: res.status, content: null, sources: [], generatedAt: null }
  }
  return {
    goalId: res.analysis.goal_id,
    status: res.analysis.status,
    content: res.analysis.content,
    sources: res.analysis.sources ?? [],
    generatedAt: res.analysis.generated_at,
  }
}

/** Lee el análisis ya guardado; no dispara el pipeline. */
export async function getGoalAnalysis(goalId: string): Promise<GoalInvestmentAnalysis> {
  if (USE_MOCKS) return mockGetGoalAnalysis(goalId)
  const res = await apiRequest<ApiAnalysisResponse>(`/goals/${goalId}/analysis`, { method: 'GET' })
  return mapAnalysis(goalId, res)
}

/** Fuerza una regeneración; espera a que el pipeline termine. */
export async function refreshGoalAnalysis(goalId: string): Promise<GoalInvestmentAnalysis> {
  if (USE_MOCKS) return mockGetGoalAnalysis(goalId)
  const res = await apiRequest<ApiAnalysisResponse>(`/goals/${goalId}/analysis/refresh`, {
    method: 'POST',
  })
  return mapAnalysis(goalId, res)
}
