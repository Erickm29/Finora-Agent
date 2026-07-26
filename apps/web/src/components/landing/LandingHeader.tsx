import { useNavigate } from 'react-router-dom'
import FinoraLogo from '../../assets/logo/FinoraLogo'
import ThemeToggle from '../common/ThemeToggle'

const navLinks = ['Características', 'Casos de Uso', 'Seguridad']

export default function LandingHeader() {
  const navigate = useNavigate()

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/40">
      <nav className="max-w-7xl mx-auto px-container-margin-mobile md:px-container-margin-desktop h-16 flex items-center justify-between">
        <FinoraLogo />
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link}
              className="text-label-md font-label-md text-on-surface-variant hover:text-primary transition-colors"
              href="#features"
            >
              {link}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            className="hidden sm:block text-label-md font-label-md text-primary px-4 py-2 hover:opacity-80 transition-opacity"
            onClick={() => navigate('/login')}
          >
            Iniciar sesión
          </button>
          <button
            className="bg-cta text-brand font-label-md text-label-md px-6 py-2.5 rounded-lg hover:brightness-105 transition-all active:scale-95"
            onClick={() => navigate('/registro')}
          >
            Crear cuenta
          </button>
        </div>
      </nav>
    </header>
  )
}
