import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import TextField from '../components/common/TextField'
import Button from '../components/common/Button'
import SocialAuthButtons from '../components/common/SocialAuthButtons'
import Icon from '../components/common/Icon'
import { IllustrationAuth } from '../assets/illustrations'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../types/api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { registerAccount } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const result = await registerAccount({ fullName: name, email, password })
      navigate(result.requiresEmailVerification ? '/verificacion' : '/onboarding')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Hi Welcome!!"
      title="Let's Get Started"
      description="Create a free account to access full features for 7 days. We invite you to join us and experience better wealth intelligence."
      illustration={<IllustrationAuth className="w-full h-auto max-h-[280px]" />}
    >
      <header className="mb-stack-lg">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Sign Up</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">Empowering your financial future with AI.</p>
      </header>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-error-container px-4 py-3 text-on-error-container">
            <Icon name="error" className="text-lg" />
            <p className="text-label-md font-label-md">{error}</p>
          </div>
        )}

        <div className="relative">
          <TextField
            id="name"
            label="Your Name"
            placeholder="Enter your full name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {name && <Icon name="check_circle" className="absolute right-4 bottom-3.5 text-secondary" filled />}
        </div>

        <div className="relative">
          <TextField
            id="email"
            label="Your Email"
            placeholder="Enter your email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {email && <Icon name="check_circle" className="absolute right-4 bottom-3.5 text-secondary" filled />}
        </div>

        <div className="relative">
          <TextField
            id="password"
            label="Your Password"
            placeholder="Create a password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {password.length >= 6 && <Icon name="check_circle" className="absolute right-4 bottom-3.5 text-secondary" filled />}
        </div>

        <div className="flex items-center gap-2 py-2">
          <label className="relative flex items-center cursor-pointer">
            <input
              checked={rememberMe}
              className="sr-only peer"
              type="checkbox"
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <div className="w-6 h-6 bg-surface-container border border-outline-variant rounded-md peer-checked:bg-secondary peer-checked:border-secondary transition-all flex items-center justify-center">
              <Icon name="check" className="text-white text-[18px]" style={{ opacity: rememberMe ? 1 : 0 }} />
            </div>
            <span className="ml-3 font-label-md text-label-md text-on-surface-variant">Remember me</span>
          </label>
        </div>

        <Button className="mt-4" fullWidth size="lg" type="submit" loading={loading}>
          CREATE ACCOUNT
        </Button>
      </form>

      <div className="relative my-8 flex items-center">
        <div className="flex-grow border-t border-surface-variant" />
        <span className="px-4 font-label-sm text-label-sm text-outline uppercase tracking-widest">Or</span>
        <div className="flex-grow border-t border-surface-variant" />
      </div>

      <SocialAuthButtons />

      <footer className="mt-12 text-center">
        <p className="font-body-md text-body-md text-on-surface-variant">
          Already have an account?{' '}
          <button
            className="font-bold text-secondary hover:text-primary transition-colors underline-offset-4 hover:underline"
            onClick={() => navigate('/login')}
            type="button"
          >
            Login Here
          </button>
        </p>
      </footer>
    </AuthLayout>
  )
}
