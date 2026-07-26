import { Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import TwoFactorPage from './pages/TwoFactorPage'
import OnboardingPage from './pages/OnboardingPage'
import TelegramOnboardingPage from './pages/TelegramOnboardingPage'
import DashboardPage from './pages/DashboardPage'
import AgentChatPage from './pages/AgentChatPage'
import SettingsPage from './pages/SettingsPage'
import RequireAuth from './components/auth/RequireAuth'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verificacion" element={<TwoFactorPage />} />
      <Route
        path="/vincular-telegram"
        element={
          <RequireAuth>
            <TelegramOnboardingPage />
          </RequireAuth>
        }
      />
      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <OnboardingPage />
          </RequireAuth>
        }
      />
      <Route
        path="/metas/nueva"
        element={
          <RequireAuth>
            <OnboardingPage />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/agente"
        element={
          <RequireAuth>
            <AgentChatPage />
          </RequireAuth>
        }
      />
      <Route
        path="/configuracion"
        element={
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<LandingPage />} />
    </Routes>
  )
}
