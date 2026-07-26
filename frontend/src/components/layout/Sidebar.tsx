import { NavLink, useNavigate } from 'react-router-dom'
import Icon from '../common/Icon'
import FinoraMark from '../../assets/logo/FinoraMark'
import clsx from '../../utils/clsx'

const navItems = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/dashboard', icon: 'ads_click', label: 'Goals' },
  { to: '/agente', icon: 'forum', label: 'Agent Chat' },
  { to: '/configuracion', icon: 'settings', label: 'Settings' },
]

export default function Sidebar() {
  const navigate = useNavigate()

  return (
    <nav className="h-full w-64 fixed left-0 top-0 bg-brand flex flex-col py-6 border-r border-brand-deep shadow-sm z-50">
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-deep flex items-center justify-center">
          <FinoraMark className="h-7 w-7 text-bone" />
        </div>
        <div>
          <h1 className="text-headline-md font-headline-md font-extrabold text-bone leading-tight">
            Finora
          </h1>
          <p className="text-[10px] text-bone/60 tracking-widest uppercase">Intelligent Wealth</p>
        </div>
      </div>

      <div className="flex-grow space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-lg px-4 py-3 mx-2 transition-colors',
                isActive
                  ? 'bg-cta text-brand'
                  : 'text-bone/80 hover:text-bone hover:bg-bone/10',
              )
            }
          >
            <Icon name={item.icon} />
            <span className="text-label-md font-label-md">{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="px-4 py-6">
        <div className="bg-premium rounded-2xl p-4 mb-6 text-brand">
          <p className="text-label-sm text-brand mb-2 font-bold">Pro Account</p>
          <p className="text-[12px] mb-4 opacity-80">Access advanced AI portfolio analytics.</p>
          <button className="w-full bg-brand text-bone font-bold py-2 rounded-lg text-sm hover:opacity-90 transition-opacity">
            Upgrade to Pro
          </button>
        </div>
        <div className="space-y-1">
          <a className="flex items-center gap-3 text-bone/60 hover:text-bone px-4 py-2 transition-colors" href="#help">
            <Icon name="help" className="text-sm" />
            <span className="text-label-md">Help</span>
          </a>
          <button
            className="flex items-center gap-3 text-bone/60 hover:text-error px-4 py-2 transition-colors w-full text-left"
            onClick={() => navigate('/')}
          >
            <Icon name="logout" className="text-sm" />
            <span className="text-label-md">Sign Out</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
