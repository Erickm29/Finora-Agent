import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/common/Icon'
import OtpInput from '../components/common/OtpInput'
import Button from '../components/common/Button'
import { IllustrationSecurity } from '../assets/illustrations'
import FinoraLogo from '../assets/logo/FinoraLogo'
import ThemeToggle from '../components/common/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../types/api'

// Demo-only client-side captcha (no backend contract defines a captcha endpoint yet).
// It only exists to preserve the prototype's visual/UX friction step.
const CAPTCHA_CODE = '49FX2'

export default function TwoFactorPage() {
  const navigate = useNavigate()
  const { pendingVerificationEmail, verifyEmailCode, resendCode } = useAuth()

  const [otp, setOtp] = useState('')
  const [captcha, setCaptcha] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  useEffect(() => {
    if (!pendingVerificationEmail) {
      navigate('/login', { replace: true })
    }
  }, [pendingVerificationEmail, navigate])

  const handleConfirm = async () => {
    if (otp.length < 6) {
      setError('Ingresa el código de 6 dígitos que enviamos a tu correo.')
      return
    }
    if (captcha.trim().toUpperCase() !== CAPTCHA_CODE) {
      setError('El código de verificación no coincide. Inténtalo de nuevo.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await verifyEmailCode(otp)
      // Product rule: Telegram link step is mandatory after email verify, before Dashboard.
      navigate('/vincular-telegram', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo verificar el código.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setResendMessage('')
    try {
      await resendCode()
      setResendMessage('Enviamos un nuevo código a tu correo.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo reenviar el código.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="mesh-bg min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <main className="w-full max-w-xl">
        <div className="text-center mb-8 flex flex-col items-center gap-2">
          <FinoraLogo />
          <p className="text-body-md font-body-md text-on-surface-variant mt-2">Intelligent Wealth Protection</p>
        </div>

        <div className="glass-card rounded-[24px] p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-40 h-40 opacity-20 pointer-events-none">
            <IllustrationSecurity className="w-full h-full" />
          </div>

          <div className="flex flex-col gap-stack-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container ai-glow">
                <Icon name="security" />
              </div>
              <div>
                <h2 className="text-headline-md font-headline-md text-on-surface">Security Verification</h2>
                <p className="text-label-md font-label-md text-on-surface-variant">
                  {pendingVerificationEmail
                    ? `Verifica el código que enviamos a ${pendingVerificationEmail}.`
                    : 'Verify your identity to secure your financial insights.'}
                </p>
              </div>
            </div>

            <section className="space-y-4">
              <label className="block text-label-md font-label-md text-on-surface-variant">
                Enter the 6-digit code sent to your email
              </label>
              <OtpInput onComplete={setOtp} />
              <div className="flex justify-between items-center px-1">
                <p className="text-label-sm font-label-sm text-on-surface-variant">
                  {resendMessage || "Didn't receive a code?"}
                </p>
                <button
                  className="text-secondary font-semibold text-label-md hover:underline transition-all active:scale-95 disabled:opacity-50"
                  type="button"
                  disabled={resending}
                  onClick={handleResend}
                >
                  {resending ? 'Enviando...' : 'Resend Code'}
                </button>
              </div>
            </section>

            <section className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-label-md font-label-md text-on-surface-variant">Confirm you are human</label>
                <Icon name="verified_user" className="text-secondary opacity-50" />
              </div>
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="w-full h-16 bg-surface-container-lowest rounded-lg border border-outline-variant flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-cta transition-colors">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_30%,#141414_0.5px,transparent_0.5px)] bg-[length:10px_10px]" />
                  <span className="relative text-headline-md font-bold tracking-widest text-primary italic select-none">
                    {CAPTCHA_CODE.split('').join(' ')}
                  </span>
                </div>
                <input
                  className="w-full md:w-40 h-16 px-4 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-cta/20 focus:border-cta transition-all outline-none text-on-surface"
                  placeholder="Type letters"
                  type="text"
                  value={captcha}
                  onChange={(e) => setCaptcha(e.target.value)}
                />
              </div>
            </section>

            {error && <p className="text-error text-label-md font-label-md -mt-2">{error}</p>}

            <div className="flex flex-col gap-3 pt-4">
              <button
                className="w-full h-14 bg-cta text-brand font-headline-md text-headline-md rounded-xl hover:brightness-105 active:scale-[0.98] transition-all shadow-md disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center gap-2"
                onClick={handleConfirm}
                type="button"
                disabled={loading}
              >
                {loading && (
                  <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden="true" />
                )}
                Confirm
              </button>
              <Button variant="outline" fullWidth onClick={() => navigate('/login')} type="button" className="h-12">
                Back to Login
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center items-center gap-6 text-on-surface-variant">
          <a className="flex items-center gap-1 text-label-sm font-label-sm hover:text-primary transition-colors" href="#support">
            <Icon name="help" className="text-[18px]" /> Support
          </a>
          <span className="w-1 h-1 bg-outline-variant rounded-full" />
          <a className="flex items-center gap-1 text-label-sm font-label-sm hover:text-primary transition-colors" href="#privacy">
            <Icon name="privacy_tip" className="text-[18px]" /> Privacy Policy
          </a>
          <span className="w-1 h-1 bg-outline-variant rounded-full" />
          <a className="flex items-center gap-1 text-label-sm font-label-sm hover:text-primary transition-colors" href="#secure">
            <Icon name="verified" className="text-[18px]" /> Secure Protocol
          </a>
        </div>
      </main>
    </div>
  )
}
