import Icon from '../common/Icon'
import EmptyState from '../common/EmptyState'
import type { Transaction } from '../../types'

interface ActivityPanelProps {
  transactions: Transaction[]
}

const iconWrapByKind: Record<Transaction['kind'], string> = {
  income: 'bg-pistachio/30 text-forest-green',
  expense: 'bg-surface-variant',
  micro_saving: 'bg-mint/20 text-forest-green',
  guardrail_decision: 'bg-secondary-container text-on-secondary-container',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function ActivityPanel({ transactions }: ActivityPanelProps) {
  const recent = transactions.slice(0, 8)
  const amounts = recent.map((tx) => tx.amount)
  const maxAmount = Math.max(1, ...amounts)
  const bars = recent.slice(0, 5).map((tx) => Math.max(10, Math.round((tx.amount / maxAmount) * 100)))

  const totalIn = transactions.filter((tx) => tx.direction === 'in').reduce((sum, tx) => sum + tx.amount, 0)
  const totalOut = transactions.filter((tx) => tx.direction === 'out').reduce((sum, tx) => sum + tx.amount, 0)
  const netLabel =
    totalIn === 0 && totalOut === 0
      ? 'Aún no hay movimientos registrados.'
      : totalIn >= totalOut
        ? `Tus ingresos han superado tus egresos en este período.`
        : `Tus aportes a metas superan tus ingresos registrados en este período.`

  return (
    <section className="col-span-12">
      <div className="soft-card bg-white p-0 overflow-hidden flex flex-col md:flex-row min-h-[300px]">
        <div className="w-full md:w-1/3 bg-surface-container p-8">
          <h3 className="text-headline-md font-headline-md text-primary mb-4">Análisis de Flujo</h3>
          <p className="text-body-md text-on-surface-variant mb-8">{netLabel}</p>
          {bars.length > 0 ? (
            <div className="flex items-end gap-2 h-32 mb-8">
              {bars.map((height, index) => (
                <div
                  key={index}
                  className={`flex-grow rounded-t-lg transition-all hover:scale-x-110 cursor-pointer ${
                    index % 3 === 2 ? 'bg-forest-green' : index % 2 === 0 ? 'bg-mint' : 'bg-kelly-green'
                  }`}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          ) : (
            <div className="h-32 mb-8 flex items-center justify-center text-label-sm text-on-surface-variant">
              Sin historial suficiente para graficar
            </div>
          )}
        </div>

        <div className="flex-grow p-8">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-label-md font-bold text-on-surface">Historial de Movimientos</h4>
          </div>
          {transactions.length === 0 ? (
            <EmptyState
              icon="receipt_long"
              title="Sin movimientos todavía"
              description="Cuando registres micro-ahorros o aportes a tus metas, aparecerán aquí."
            />
          ) : (
            <table className="w-full text-left">
              <thead className="border-b border-outline-variant/30">
                <tr className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
                  <th className="pb-4 px-2">Descripción</th>
                  <th className="pb-4 px-2">Categoría</th>
                  <th className="pb-4 px-2">Fecha</th>
                  <th className="pb-4 px-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {recent.map((tx) => (
                  <tr key={tx.id} className="group hover:bg-surface-container-lowest transition-colors">
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconWrapByKind[tx.kind]}`}>
                          <Icon name={tx.icon} className="text-sm" />
                        </div>
                        <span className="text-label-md font-medium">{tx.description}</span>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <span className="text-label-sm text-on-surface-variant">{tx.category}</span>
                    </td>
                    <td className="py-4 px-2">
                      <span className="text-label-sm text-on-surface-variant">{formatDate(tx.date)}</span>
                    </td>
                    <td
                      className={`py-4 px-2 text-right text-label-md font-bold ${
                        tx.direction === 'in' ? 'text-kelly-green' : 'text-error'
                      }`}
                    >
                      {tx.direction === 'in' ? '+' : '-'} {tx.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  )
}
