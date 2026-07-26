/**
 * Pure UI configuration for quick-reply chips — the actual conversation now flows through
 * services/agent.service.ts + hooks/useAgentChat.ts (see types/chat.ts for the message
 * contract). Phrased so they naturally trigger the agent's contextual responses.
 */
export const quickActions = [
  { id: 'progress', icon: 'analytics', label: '¿Cómo voy con mis metas?' },
  { id: 'protect', icon: 'shield', label: 'Quiero proteger mis ahorros' },
  { id: 'withdraw', icon: 'tips_and_updates', label: 'Quiero retirar dinero' },
]
