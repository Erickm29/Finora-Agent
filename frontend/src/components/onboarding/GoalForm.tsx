import { useState } from 'react'
import type { FormEvent } from 'react'
import Button from '../common/Button'
import TextField from '../common/TextField'
import Icon from '../common/Icon'
import { goalCurrencyOptions } from '../../data/goals'
import type { CreateGoalPayload, GoalCategory } from '../../types'

interface GoalFormProps {
  category: GoalCategory
  onSubmit: (payload: CreateGoalPayload) => void
  loading: boolean
  error: string | null
}

/**
 * New component (not in the original prototype). The prototype's onboarding only
 * simulated a canned reply ("Quiero comprar una MacBook Pro..."); this form is what
 * actually lets the user type their real goal name, amount and deadline, satisfying the
 * "Creación de metas" requirement and "cero datos hardcodeados" principle.
 */
export default function GoalForm({ category, onSubmit, loading, error }: GoalFormProps) {
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currency, setCurrency] = useState(goalCurrencyOptions[0])
  const [deadlineMonths, setDeadlineMonths] = useState('6')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({
      name: name.trim(),
      category,
      targetAmount: Number(targetAmount),
      currency,
      deadlineMonths: Number(deadlineMonths),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-card-padding space-y-stack-sm max-w-2xl">
      <TextField
        id="goal-name"
        label="¿Cómo se llama tu meta?"
        placeholder="Ej. Laptop para el trabajo, Fondo de emergencia..."
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <TextField
            id="goal-amount"
            label="Monto objetivo"
            type="number"
            min={1}
            step="0.01"
            placeholder="0.00"
            required
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="font-label-md text-label-md text-on-surface-variant ml-1" htmlFor="goal-currency">
            Moneda
          </label>
          <select
            id="goal-currency"
            className="w-full h-14 bg-surface-container-low border border-outline-variant rounded-xl px-4 text-on-surface font-body-md focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none transition-all"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {goalCurrencyOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="font-label-md text-label-md text-on-surface-variant ml-1" htmlFor="goal-deadline">
          ¿En cuántos meses quieres lograrlo?
        </label>
        <input
          id="goal-deadline"
          type="range"
          min={1}
          max={36}
          value={deadlineMonths}
          onChange={(e) => setDeadlineMonths(e.target.value)}
          className="w-full accent-secondary"
        />
        <p className="text-label-md font-label-md text-secondary">{deadlineMonths} meses</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-error-container px-4 py-3 text-on-error-container">
          <Icon name="error" className="text-lg" />
          <p className="text-label-md font-label-md">{error}</p>
        </div>
      )}

      <Button type="submit" fullWidth size="lg" loading={loading}>
        Generar mi plan con IA
      </Button>
    </form>
  )
}
