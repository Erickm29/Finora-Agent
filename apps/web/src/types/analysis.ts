export type AnalysisStatus = 'pending' | 'ready' | 'failed'

export type Likelihood = 'alta' | 'media' | 'baja'

export type Cadence = 'unica' | 'semanal' | 'quincenal' | 'mensual'

export interface EconomicSource {
  provider: 'firecrawl' | 'exa' | 'internal'
  title: string
  url: string | null
  snippet: string | null
}

export interface ProjectedScenario {
  name: string
  likelihood: Likelihood
  description: string
  impactOnGoal: string
}

export interface PlanRecommendation {
  action: string
  rationale: string
  amountBobs: number | null
  cadence: Cadence | null
}

export interface InvestmentAnalysisContent {
  economicSummary: string
  scenarios: ProjectedScenario[]
  recommendations: PlanRecommendation[]
  risks: string[]
  confidence: Likelihood
  dataCoverage: 'completa' | 'parcial' | 'sin-fuentes'
}

export interface GoalInvestmentAnalysis {
  goalId: string
  status: AnalysisStatus
  content: InvestmentAnalysisContent | null
  sources: EconomicSource[]
  generatedAt: string | null
}
