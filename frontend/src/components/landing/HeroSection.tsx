import { useNavigate } from 'react-router-dom'
import Icon from '../common/Icon'
import { IllustrationAgent } from '../../assets/illustrations'

const avatarColors = ['bg-brand', 'bg-premium', 'bg-decor']

export default function HeroSection() {
  const navigate = useNavigate()

  return (
    <section className="relative max-w-7xl mx-auto px-container-margin-mobile md:px-container-margin-desktop py-12 md:py-24 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="relative z-10 space-y-stack-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-label-sm font-label-sm">
            <Icon name="verified" className="text-[16px]" />
            IA Financiera de Próxima Generación
          </div>
          <h1 className="text-display-lg font-display-lg leading-tight gradient-text">
            Convierte tus metas financieras en un plan automático.
          </h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant max-w-xl">
            Finora te ayuda a cumplir objetivos personales: comprar una laptop, ahorrar para una vivienda o crear un
            fondo de emergencia con ayuda de un agente inteligente.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <button
              className="bg-cta text-brand font-headline-md text-label-md px-8 py-4 rounded-xl shadow-lg hover:brightness-105 transition-all flex items-center gap-2"
              onClick={() => navigate('/registro')}
            >
              Comenzar gratis <Icon name="arrow_forward" />
            </button>
            <button
              className="border-2 border-brand text-brand dark:border-bone dark:text-bone font-headline-md text-label-md px-8 py-4 rounded-xl hover:bg-brand/5 transition-all"
              onClick={() => navigate('/dashboard')}
            >
              Ver demo interactiva
            </button>
          </div>
          <div className="flex items-center gap-4 pt-8 border-t border-outline-variant/50">
            <div className="flex -space-x-3">
              {avatarColors.map((color) => (
                <div
                  key={color}
                  className={`w-10 h-10 rounded-full border-2 border-surface ${color} flex items-center justify-center`}
                >
                  <span className="text-bone text-[10px] font-bold">F</span>
                </div>
              ))}
            </div>
            <p className="text-label-sm font-label-sm text-on-surface-variant">
              Únete a más de <span className="text-primary font-bold">15,000</span> usuarios alcanzando sus metas hoy.
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="relative z-20 agent-float">
            <div className="glass-card rounded-2xl p-6 shadow-2xl mint-glow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">Panel de Control</h3>
                  <p className="text-label-sm text-on-surface-variant">Actualizado hace 1 min</p>
                </div>
                <div className="bg-brand text-bone p-2 rounded-lg">
                  <Icon name="insights" />
                </div>
              </div>
              <div className="mb-6 rounded-xl overflow-hidden bg-surface-container-low p-4">
                <IllustrationAgent className="w-full h-auto max-h-36 mx-auto" />
              </div>
              <div className="space-y-4">
                <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-label-md font-bold text-on-surface">Meta: Vivienda propia</span>
                    <span className="text-cta font-bold">64%</span>
                  </div>
                  <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-cta rounded-full w-[64%]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-secondary-container rounded-xl p-4">
                    <span className="text-label-sm block mb-1 text-on-secondary-container">Ahorro Mensual</span>
                    <span className="text-headline-md font-bold text-brand">$1,250</span>
                  </div>
                  <div className="bg-cta rounded-xl p-4">
                    <span className="text-label-sm block mb-1 text-brand">Días para Meta</span>
                    <span className="text-headline-md font-bold text-brand">142</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -top-10 -right-10 w-64 h-64 bg-cta/15 rounded-full blur-3xl -z-10" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-premium/10 rounded-full blur-3xl -z-10" />
        </div>
      </div>
    </section>
  )
}
