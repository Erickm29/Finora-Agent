import type { ReactNode } from 'react'
import Icon from '../common/Icon'
import ThemeToggle from '../common/ThemeToggle'

interface TopBarProps {
  title: string
  searchPlaceholder?: string
  actions?: ReactNode
}

const tabs = ['Portfolio', 'Insights', 'History']

export default function TopBar({ title, searchPlaceholder = 'Search...', actions }: TopBarProps) {
  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-40 bg-surface/80 backdrop-blur-md border-b border-outline-variant/40 flex justify-between items-center h-16 px-8 ml-64 shadow-sm">
      <div className="flex items-center gap-8">
        <h2 className="text-headline-sm font-headline-md font-bold text-primary">{title}</h2>
        <nav className="hidden lg:flex items-center gap-6">
          {tabs.map((tab, index) => (
            <a
              key={tab}
              className={
                index === 0
                  ? 'text-primary font-bold border-b-2 border-primary pb-1 text-label-md'
                  : 'text-on-surface-variant hover:text-primary px-2 transition-colors text-label-md'
              }
              href="#top"
            >
              {tab}
            </a>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl" />
          <input
            className="bg-surface-container-low border-none rounded-full pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-cta w-64 transition-all text-on-surface"
            placeholder={searchPlaceholder}
            type="text"
          />
        </div>
        <div className="flex items-center gap-3">
          {actions}
          <ThemeToggle />
          <div className="flex items-center gap-3 border-l border-outline-variant pl-4">
            <button className="text-on-surface-variant hover:text-primary transition-colors" aria-label="Notificaciones">
              <Icon name="notifications" />
            </button>
            <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center border-2 border-cta">
              <span className="text-bone text-[10px] font-bold">TU</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
