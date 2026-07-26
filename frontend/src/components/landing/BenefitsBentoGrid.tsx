import Icon from '../common/Icon'
import { IllustrationSecurity } from '../../assets/illustrations'

export default function BenefitsBentoGrid() {
  return (
    <section id="features" className="bg-background py-24">
      <div className="max-w-7xl mx-auto px-container-margin-mobile md:px-container-margin-desktop">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-headline-lg font-headline-lg text-primary">¿Por qué elegir Finora?</h2>
          <p className="text-body-md text-on-surface-variant max-w-2xl mx-auto">
            Combinamos la precisión de los datos con la intuición de la inteligencia artificial para crear un camino
            claro hacia tu libertad financiera.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[280px]">
          <div className="md:col-span-8 md:row-span-2 glass-card rounded-2xl p-card-padding flex flex-col justify-between overflow-hidden relative group">
            <div className="relative z-10 max-w-md">
              <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center mb-6">
                <Icon name="analytics" />
              </div>
              <h3 className="text-headline-md font-headline-md mb-4">Análisis Predictivo de IA</h3>
              <p className="text-body-md text-on-surface-variant">
                Finora no solo registra tus gastos; predice tendencias futuras basándose en tus hábitos históricos.
                Recibe alertas inteligentes antes de que ocurran gastos imprevistos y optimiza tu presupuesto en
                tiempo real.
              </p>
            </div>
            <div className="absolute bottom-0 right-0 w-2/3 h-2/3 -mb-10 -mr-10 opacity-40 group-hover:opacity-60 transition-opacity">
              <svg className="w-full h-full" viewBox="0 0 400 300">
                <path className="bezier-curve" d="M0,250 Q100,50 200,200 T400,100" fill="none" stroke="#141414" strokeWidth="4" />
                <circle cx="200" cy="200" fill="#B9F5C6" r="6" />
                <circle cx="400" cy="100" fill="#CBB8F7" r="6" />
              </svg>
            </div>
          </div>

          <div className="md:col-span-4 glass-card rounded-2xl p-card-padding flex flex-col justify-between hover:bg-secondary-container/10 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
              <Icon name="savings" />
            </div>
            <div>
              <h3 className="text-headline-sm font-headline-md mb-2">Micro-ahorro Automático</h3>
              <p className="text-label-md text-on-surface-variant">
                Redondea tus compras y transfiere el excedente a tus metas sin que te des cuenta.
              </p>
            </div>
          </div>

          <div className="md:col-span-4 glass-card rounded-2xl p-card-padding flex flex-col justify-between hover:bg-tertiary-fixed/10 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
              <Icon name="map" />
            </div>
            <div>
              <h3 className="text-headline-sm font-headline-md mb-2">Hoja de Ruta Personal</h3>
              <p className="text-label-md text-on-surface-variant">
                Planes paso a paso para metas complejas como vivienda o retiro.
              </p>
            </div>
          </div>

          <div className="md:col-span-12 md:row-span-1 glass-card rounded-2xl p-card-padding flex items-center gap-8">
            <div className="hidden lg:flex flex-shrink-0 w-32 h-32 rounded-2xl bg-surface-variant items-center justify-center overflow-hidden p-3">
              <IllustrationSecurity className="w-full h-full" />
            </div>
            <div className="flex-grow">
              <h3 className="text-headline-md font-headline-md mb-2">Seguridad de Nivel Bancario</h3>
              <p className="text-body-md text-on-surface-variant">
                Tus datos están protegidos con encriptación de grado militar AES-256. Finora nunca comparte tus datos
                personales con terceros. Tu privacidad es nuestro pilar fundamental.
              </p>
            </div>
            <button className="flex-shrink-0 hidden sm:block px-6 py-3 border border-outline rounded-lg text-label-md hover:bg-surface-variant transition-colors">
              Saber más
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
