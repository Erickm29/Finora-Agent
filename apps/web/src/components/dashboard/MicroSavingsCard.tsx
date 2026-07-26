import Icon from '../common/Icon'
import type { Transaction } from '../../types'

interface MicroSavingsCardProps {
  transactions: Transaction[]
  currency: string
}

export default function MicroSavingsCard({ transactions, currency }: MicroSavingsCardProps) {
  const microSavings = transactions.filter((tx) => tx.kind === 'micro_saving')
  const totalImpact = microSavings.reduce((sum, tx) => sum + tx.amount, 0)
  const latest = microSavings[0]

  return (
    <section className="col-span-12 md:col-span-4">
      <div className="soft-card h-full flex flex-col justify-center items-center text-center p-8 bg-mint/5 relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
          <Icon name="savings" style={{ fontSize: 120 }} />
        </div>
        <div className="w-20 h-20 rounded-full bg-pistachio/30 flex items-center justify-center mb-6 mint-glow">
          <Icon name="eco" className="text-kelly-green text-4xl" filled />
        </div>
        <h4 className="text-headline-md font-headline-md text-primary mb-2">Hábito Smart</h4>
        {latest ? (
          <p className="text-body-md text-on-surface-variant mb-6 px-4">
            "Registramos un micro-ahorro de{' '}
            <span className="text-kelly-green font-bold">
              {latest.amount.toLocaleString('es')} {currency}
            </span>{' '}
            para {latest.description.replace(/^Aporte inicial a |^Micro-ahorro aceptado en el chat para /, '')}."
          </p>
        ) : (
          <p className="text-body-md text-on-surface-variant mb-6 px-4">
            Aún no registras micro-ahorros. Acepta una recomendación de Finora para empezar.
          </p>
        )}
        <div className="bg-white px-4 py-2 rounded-full border border-outline-variant/50 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-kelly-green animate-pulse" />
          <span className="text-label-sm font-bold text-primary">
            Impacto total: +{totalImpact.toLocaleString('es')} {currency}
          </span>
        </div>
      </div>
    </section>
  )
}
