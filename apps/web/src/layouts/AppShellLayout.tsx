import type { ReactNode } from 'react'
import Sidebar from '../components/layout/Sidebar'
import TopBar from '../components/layout/TopBar'

interface AppShellLayoutProps {
  title: string
  searchPlaceholder?: string
  actions?: ReactNode
  children: ReactNode
  contentClassName?: string
}

export default function AppShellLayout({
  title,
  searchPlaceholder,
  actions,
  children,
  contentClassName = '',
}: AppShellLayoutProps) {
  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen">
      <Sidebar />
      <TopBar title={title} searchPlaceholder={searchPlaceholder} actions={actions} />
      <main className={`ml-64 pt-16 ${contentClassName}`}>{children}</main>
    </div>
  )
}
