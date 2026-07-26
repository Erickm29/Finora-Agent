import type { UserPreferences } from '../types'

/**
 * Pure UI copy describing each toggle — the actual on/off VALUE always comes from
 * `UserPreferences` (services/user.service.ts), never a hardcoded boolean.
 */
export interface AlertPreferenceConfig {
  id: string
  prefKey: keyof Pick<
    UserPreferences,
    'extremeVolatilityAlerts' | 'dailyAiSummary' | 'liquidationAlerts' | 'achievableGoalSuggestions'
  >
  title: string
  description: string
}

export const alertPreferenceConfig: AlertPreferenceConfig[] = [
  {
    id: 'volatility',
    prefKey: 'extremeVolatilityAlerts',
    title: 'Volatilidad Extrema',
    description: 'Notificar cuando un activo del portfolio varíe >5% en 1h.',
  },
  {
    id: 'daily-summary',
    prefKey: 'dailyAiSummary',
    title: 'Resumen Diario de IA',
    description: 'Recibe un análisis predictivo cada mañana a las 8:00 AM.',
  },
  {
    id: 'liquidation',
    prefKey: 'liquidationAlerts',
    title: 'Alertas de Liquidación',
    description: 'Aviso crítico cuando el margen de garantía sea inferior al 20%.',
  },
  {
    id: 'new-goals',
    prefKey: 'achievableGoalSuggestions',
    title: 'Nuevos Objetivos Alcanzables',
    description: 'La IA sugiere nuevos hitos basados en tus ahorros actuales.',
  },
]

export const securityShortcuts = [
  { id: 'password', icon: 'key', label: 'Cambiar Contraseña' },
  { id: '2fa', icon: 'vibration', label: 'Autenticación de Dos Factores' },
  { id: 'sessions', icon: 'devices', label: 'Sesiones Activas' },
]
