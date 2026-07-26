import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import Button from '../components/common/Button'
import SocialAuthButtons from '../components/common/SocialAuthButtons'
import Icon from '../components/common/Icon'
import { IllustrationAuth } from '../assets/illustrations'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../types/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = (location.state as { from?: Location } | null)?.from?.pathname ?? '/dashboard'
  const { loginWithCredentials } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { requiresEmailVerification } = await loginWithCredentials({ email, password })
      navigate(requiresEmailVerification ? '/verificacion' : redirectTo, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Intelligent Wealth"
      title="Let's Secure Your Future"
      description="Access your AI-powered financial dashboard and let Finora optimize your portfolio with professional-grade intelligence."
      illustration={<IllustrationAuth className="w-full h-auto max-h-[280px]" />}
      panelBgClassName="bg-brand"
    >
      <div className="mb-stack-lg">
        <h2 className="text-on-surface font-headline-lg text-headline-lg mb-2">Login</h2>
        <p className="text-on-surface-variant font-body-md text-body-md">Welcome back! Please enter your details.</p>
      </div>

      <form className="space-y-stack-md" onSubmit={handleSubmit}>
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-error-container px-4 py-3 text-on-error-container">
            <Icon name="error" className="text-lg" />
            <p className="text-label-md font-label-md">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-on-surface-variant font-label-md text-label-md ml-1" htmlFor="email">
            Your Email
          </label>
          <div className="relative group">
            <input
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-4 text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all duration-200 font-body-md"
              id="email"
              placeholder="hello@finora.ai"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {email && (
              <Icon
                name="check_circle"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-secondary-container"
                filled
              />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-on-surface-variant font-label-md text-label-md" htmlFor="password">
              Your Password
            </label>
            <a className="text-secondary font-label-md text-label-md hover:underline decoration-2 underline-offset-4" href="#forgot">
              Forgot password?
            </a>
          </div>
          <div className="relative group">
            <input
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-4 text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all duration-200 font-body-md"
              id="password"
              placeholder="••••••••"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-secondary"
              onClick={() => setShowPassword((v) => !v)}
              aria-label="Mostrar u ocultar contraseña"
            >
              <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
            </button>
          </div>
        </div>

        <div className="flex items-center py-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                checked={rememberMe}
                className="peer sr-only"
                id="remember"
                type="checkbox"
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <div className="w-6 h-6 border-2 border-outline rounded-md peer-checked:bg-primary peer-checked:border-primary transition-all duration-200 flex items-center justify-center">
                <Icon name="check" className="text-white text-[18px]" style={{ opacity: rememberMe ? 1 : 0 }} />
              </div>
            </div>
            <span className="text-on-surface-variant font-label-md text-label-md select-none">Remember me</span>
          </label>
        </div>

        <Button fullWidth size="lg" type="submit" loading={loading}>
          Login
        </Button>

        <div className="relative flex items-center py-4">
          <div className="flex-grow border-t border-outline-variant/30" />
          <span className="flex-shrink mx-4 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-widest">Or</span>
          <div className="flex-grow border-t border-outline-variant/30" />
        </div>

        <SocialAuthButtons />

        <p className="text-center text-on-surface-variant font-body-md text-body-md pt-stack-md">
          Don't have an account?{' '}
          <button
            className="text-primary font-bold hover:underline decoration-2 underline-offset-4 ml-1 transition-all"
            onClick={() => navigate('/registro')}
            type="button"
          >
            Sign up now
          </button>
        </p>
      </form>
    </AuthLayout>
  )
}
