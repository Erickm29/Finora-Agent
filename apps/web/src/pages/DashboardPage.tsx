import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShellLayout from '../layouts/AppShellLayout'
import Icon from '../components/common/Icon'
import Spinner from '../components/common/Spinner'
import ErrorState from '../components/common/ErrorState'
import EmptyState from '../components/common/EmptyState'
import Button from '../components/common/Button'
import AgentInsightCard from '../components/dashboard/AgentInsightCard'
import PrimaryGoalCard from '../components/dashboard/PrimaryGoalCard'
import GoalCard from '../components/dashboard/GoalCard'
import AlertsPanel from '../components/dashboard/AlertsPanel'
import MicroSavingsCard from '../components/dashboard/MicroSavingsCard'
import CapitalDistributionCard from '../components/dashboard/CapitalDistributionCard'
import ActivityPanel from '../components/dashboard/ActivityPanel'
import ActionConfirmationModal from '../components/modals/ActionConfirmationModal'
import type { ActionConfirmationData } from '../components/modals/ActionConfirmationModal'
import { useGoals } from '../hooks/useGoals'
import { useRecommendations } from '../hooks/useRecommendations'
import { useTransactions } from '../hooks/useTransactions'
import { useTelegramLink } from '../hooks/useTelegramLink'
import { IllustrationEmptyGoals } from '../assets/illustrations'
import TelegramBanner from '../components/telegram/TelegramBanner'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data: goals, loading: goalsLoading, error: goalsError, refetch: refetchGoals } = useGoals()
  const { recommendations, loading: recsLoading, error: recsError, respond, respondingId } = useRecommendations()
  const { data: transactions, loading: txLoading, error: txError, refetch: refetchTx } = useTransactions()
  const { status: telegramStatus, loading: telegramLoading } = useTelegramLink()
  const [confirmation, setConfirmation] = useState<ActionConfirmationData | null>(null)

  const showTelegramBanner = !telegramLoading && telegramStatus !== null && !telegramStatus.linked

  if (goalsLoading) {
    return (
      <AppShellLayout title="Portfolio" searchPlaceholder="Search assets...">
        <Spinner className="min-h-[60vh]" label="Cargando tu portafolio..." />
      </AppShellLayout>
    )
  }

  if (goalsError) {
    return (
      <AppShellLayout title="Portfolio" searchPlaceholder="Search assets...">
        <ErrorState className="min-h-[60vh]" message={goalsError} onRetry={refetchGoals} />
      </AppShellLayout>
    )
  }

  if (!goals || goals.length === 0) {
    return (
      <AppShellLayout title="Portfolio" searchPlaceholder="Search assets...">
        <div className="p-8 max-w-7xl mx-auto">
          {showTelegramBanner && <TelegramBanner />}
          <EmptyState
            className="min-h-[50vh]"
            icon="flag"
            title="Aún no tienes metas"
            description="Crea tu primera meta para que Finora arme un plan de ahorro personalizado para ti."
            illustration={<IllustrationEmptyGoals className="w-full h-auto" />}
            action={
              <Button onClick={() => navigate('/onboarding')}>
                <Icon name="add" className="text-lg" /> Crear mi primera meta
              </Button>
            }
          />
        </div>
      </AppShellLayout>
    )
  }

  const primaryGoal = goals[0]
  const otherGoals = goals.slice(1)
  const pendingRecommendation = recommendations.find((rec) => rec.status === 'pending') ?? null

  const handleAcceptRecommendation = async (id: string) => {
    const recommendation = recommendations.find((rec) => rec.id === id)
    await respond(id, 'accept')
    if (recommendation) {
      setConfirmation({
        title: 'Recomendación aplicada',
        subtitle: 'Micro-ahorro confirmado',
        statement: recommendation.message,
        reason: 'Basado en el análisis de tus metas activas y tu ritmo de ahorro actual.',
        amount: recommendation.suggestedAmount ?? 0,
        currency: recommendation.currency ?? primaryGoal.currency,
        // No mostramos cuenta de origen ni probabilidad de éxito aquí: el modelo
        // `Recommendation` (ver types/recommendation.ts) todavía no expone esos campos
        // desde el backend/mock. Pendiente de validar con Backend si se agregarán.
        riskReductionNote: 'Este ajuste no afecta tu presupuesto esencial del mes.',
        reversibleNote: 'Puedes revertir este movimiento desde el historial dentro de las próximas 24 horas.',
        confirmLabel: 'Confirmar aplicación',
      })
    }
  }

  return (
    <AppShellLayout title="Portfolio" searchPlaceholder="Search assets...">
      <div className="p-8 max-w-7xl mx-auto">
        {showTelegramBanner && <TelegramBanner />}
        <div className="grid grid-cols-12 gap-gutter">
          <AgentInsightCard
            recommendation={pendingRecommendation}
            onAccept={handleAcceptRecommendation}
            accepting={respondingId === pendingRecommendation?.id}
          />
          <PrimaryGoalCard goal={primaryGoal} />

          {recsError ? (
            <div className="col-span-12 md:col-span-4">
              <ErrorState message={recsError} />
            </div>
          ) : recsLoading ? (
            <div className="col-span-12 md:col-span-4">
              <Spinner />
            </div>
          ) : (
            <AlertsPanel recommendations={recommendations} />
          )}

          {otherGoals.length > 0 && (
            <section className="col-span-12">
              <h3 className="text-label-md font-bold text-primary mb-4">Otras Metas</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                {otherGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </section>
          )}

          <MicroSavingsCard transactions={transactions ?? []} currency={primaryGoal.currency} />
          <CapitalDistributionCard goals={goals} />

          {txError ? (
            <div className="col-span-12">
              <ErrorState message={txError} onRetry={refetchTx} />
            </div>
          ) : txLoading ? (
            <div className="col-span-12">
              <Spinner />
            </div>
          ) : (
            <ActivityPanel transactions={transactions ?? []} />
          )}
        </div>
      </div>

      <button
        className="fixed bottom-8 right-8 w-16 h-16 bg-cta text-brand rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-50 mint-glow"
        onClick={() => navigate('/agente')}
        aria-label="Abrir chat con el agente"
        type="button"
      >
        <Icon name="smart_toy" className="text-3xl" filled />
      </button>

      <ActionConfirmationModal open={Boolean(confirmation)} data={confirmation} onClose={() => setConfirmation(null)} />
    </AppShellLayout>
  )
}
