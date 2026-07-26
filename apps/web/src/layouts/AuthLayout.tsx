import type { ReactNode } from 'react'
import FinoraLogo from '../assets/logo/FinoraLogo'
import ThemeToggle from '../components/common/ThemeToggle'
import clsx from '../utils/clsx'

interface AuthLayoutProps {
  eyebrow: string
  title: string
  description: string
  illustration: ReactNode
  illustrationAlt?: string
  children: ReactNode
  panelBgClassName?: string
}

export default function AuthLayout({
  eyebrow,
  title,
  description,
  illustration,
  children,
  panelBgClassName = 'bg-brand',
}: AuthLayoutProps) {
  return (
    <div className="mesh-bg min-h-screen flex items-center justify-center p-4 md:p-8 text-on-surface">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <main className="w-full max-w-6xl flex flex-col md:flex-row overflow-hidden bg-surface-container-lowest rounded-[32px] shadow-2xl relative">
        <section
          className={clsx(
            'w-full md:w-[45%] relative p-8 md:p-12 overflow-hidden flex flex-col justify-between',
            panelBgClassName,
          )}
        >
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-cta/20 rounded-full blur-[100px]" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-decor/15 rounded-full blur-[100px]" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-stack-lg">
              <FinoraLogo className="text-bone" markClassName="h-10 w-10" />
            </div>

            <div className="glass-card p-8 rounded-[24px] border border-bone/15 shadow-xl bg-brand-deep/40">
              <span className="text-cta font-label-md text-label-md mb-2 block uppercase tracking-widest">
                {eyebrow}
              </span>
              <h1 className="text-bone font-headline-lg text-headline-lg mb-4">{title}</h1>
              <p className="text-bone/80 font-body-md text-body-md leading-relaxed">{description}</p>
            </div>
          </div>

          <div className="relative mt-stack-lg flex justify-center items-center h-64 md:h-80">
            <div className="floating-agent relative z-10 w-full h-full flex items-center justify-center">
              <div className="ai-glow rounded-3xl p-4 bg-bone/5 backdrop-blur-sm w-full max-w-sm">
                {illustration}
              </div>
            </div>
          </div>

          <div className="absolute top-1/4 right-0 w-32 h-1 bg-cta/40 -rotate-45" />
          <div className="absolute top-[28%] right-0 w-24 h-1 bg-decor/30 -rotate-45" />
          <div className="absolute top-[31%] right-0 w-16 h-1 bg-bone/20 -rotate-45" />
        </section>

        <section className="w-full md:w-[55%] p-8 md:p-16 bg-surface-container-lowest flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">{children}</div>
        </section>
      </main>
    </div>
  )
}
