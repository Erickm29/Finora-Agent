import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/common/Icon'
import ChoiceCard from '../components/onboarding/ChoiceCard'
import GoalForm from '../components/onboarding/GoalForm'
import PlanSummaryCard from '../components/onboarding/PlanSummaryCard'
import InvestmentPlanCard from '../components/analysis/InvestmentPlanCard'
import { useGoalAnalysis } from '../hooks/useGoalAnalysis'
import FinoraLogo from '../assets/logo/FinoraLogo'
import ThemeToggle from '../components/common/ThemeToggle'
import { onboardingGoalOptions } from '../data/goals'
import * as goalsService from '../services/goals.service'
import type { CreateGoalPayload, Goal, GoalCategory } from '../types'
import { ApiError } from '../types/api'

const categoryPrompt: Record<GoalCategory, string> = {
  buy: 'Quiero organizar una compra importante.',
  save: 'Quiero empezar a ahorrar de forma constante cada mes.',
  emergency: 'Quiero construir un fondo de emergencia sólido.',
  other: 'Tengo una meta distinta que quiero organizar con ayuda de Finora.',
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory | null>(null)
  const [createdGoal, setCreatedGoal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // El backend arranca el análisis al crear la meta; acá solo lo esperamos.
  const analysis = useGoalAnalysis(createdGoal?.id ?? null)

  const handleCreateGoal = async (payload: CreateGoalPayload) => {
    setLoading(true)
    setError(null)
    try {
      const goal = await goalsService.createGoal(payload)
      setCreatedGoal(goal)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear tu meta. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mesh-bg-onboarding min-h-screen">
      <div className="max-w-4xl mx-auto px-container-margin-mobile md:px-container-margin-desktop py-stack-lg">
        <header className="flex items-center justify-between mb-stack-lg">
          <div className="flex flex-col gap-1">
            <FinoraLogo />
            <p className="text-label-md font-label-md text-on-surface-variant">Wealth Intelligence Online</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-surface-container rounded-full">
              <Icon name="verified_user" className="text-decor text-[20px]" />
              <span className="text-label-md font-label-md text-decor">Secured by AES-256</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="space-y-stack-md relative">
          <div className="flex items-start gap-4 animate-in-up">
            <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center shrink-0">
              <Icon name="smart_toy" className="text-on-secondary-container" />
            </div>
            <div className="bg-secondary-container text-on-secondary-container p-card-padding rounded-2xl rounded-tl-none max-w-lg shadow-sm ai-glow">
              <p className="text-body-lg font-body-lg">¿Qué quieres lograr hoy con tu capital?</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-stack-md">
            {onboardingGoalOptions.map((option) => (
              <ChoiceCard
                key={option.id}
                icon={option.icon}
                label={option.label}
                selected={selectedCategory === option.id}
                onClick={() => {
                  setSelectedCategory(option.id)
                  setCreatedGoal(null)
                  setError(null)
                }}
              />
            ))}
          </div>

          {selectedCategory && (
            <>
              <div className="flex items-start gap-4 justify-end animate-in-up">
                <div className="bg-cta text-brand p-card-padding rounded-2xl rounded-tr-none max-w-lg shadow-sm">
                  <p className="text-body-lg font-body-lg">{categoryPrompt[selectedCategory]}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                  <Icon name="person" className="text-on-primary" />
                </div>
              </div>

              <div className="flex items-start gap-4 animate-in-up">
                <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center shrink-0">
                  <Icon name="smart_toy" className="text-on-secondary-container" />
                </div>
                <div className="space-y-4 max-w-2xl w-full">
                  {!createdGoal ? (
                    <>
                      <div className="bg-secondary-container text-on-secondary-container p-card-padding rounded-2xl rounded-tl-none shadow-sm ai-glow">
                        <p className="text-body-lg font-body-lg">
                          Cuéntame los detalles y calcularé un plan de ahorro personalizado para lograrlo sin estrés
                          financiero.
                        </p>
                      </div>
                      <GoalForm category={selectedCategory} onSubmit={handleCreateGoal} loading={loading} error={error} />
                    </>
                  ) : (
                    <>
                      <div className="bg-secondary-container text-on-secondary-container p-card-padding rounded-2xl rounded-tl-none shadow-sm ai-glow">
                        <p className="text-body-lg font-body-lg">
                          Listo. Analicé tu meta "{createdGoal.name}" y este es el plan que te propongo:
                        </p>
                      </div>
                      <PlanSummaryCard goal={createdGoal} />
                      <InvestmentPlanCard
                        analysis={analysis.analysis}
                        pending={analysis.pending}
                        refreshing={analysis.refreshing}
                        error={analysis.error}
                        onRefresh={() => void analysis.refresh()}
                      />
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </main>

        <footer className="mt-stack-lg border-t border-outline-variant/30 pt-stack-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-secondary" />
            <div className="w-2 h-2 rounded-full bg-secondary" />
            <div className="w-8 h-2 rounded-full bg-secondary" />
            <div className="w-2 h-2 rounded-full bg-surface-container-highest" />
          </div>
          <p className="text-label-md font-label-md text-on-surface-variant">Paso 3 de 4: Configuración de Metas</p>
          <div className="flex gap-4">
            <button
              className="text-label-md font-label-md text-on-surface-variant hover:text-primary transition-colors"
              onClick={() => navigate('/dashboard')}
              type="button"
            >
              Ir al dashboard
            </button>
          </div>
        </footer>
      </div>

      <div className="fixed top-20 right-[-10%] w-96 h-96 bg-secondary-fixed/5 blur-[120px] rounded-full -z-10" />
      <div className="fixed bottom-10 left-[-5%] w-72 h-72 bg-tertiary-fixed/5 blur-[100px] rounded-full -z-10" />
    </div>
  )
}
