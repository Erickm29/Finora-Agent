import type { Channel } from "@finora/shared";

export type ChannelNotifier = (
  externalChatId: string,
  text: string,
) => Promise<void>;

const notifiers = new Map<Channel, ChannelNotifier>();

/**
 * Inversión de dependencias: el bot se registra al arrancar, así el runtime
 * puede empujar mensajes proactivos sin importar `bot/telegram.ts` (evita el
 * ciclo de imports).
 */
export function registerChannelNotifier(
  channel: Channel,
  notifier: ChannelNotifier,
): void {
  notifiers.set(channel, notifier);
}

export function hasChannelNotifier(channel: Channel): boolean {
  return notifiers.has(channel);
}

/** Nunca lanza: un aviso proactivo no puede tumbar el flujo que lo dispara. */
export async function notifyChannel(
  channel: Channel,
  externalChatId: string,
  text: string,
): Promise<void> {
  const notifier = notifiers.get(channel);
  if (!notifier) return;
  try {
    await notifier(externalChatId, text);
  } catch (err) {
    console.warn(`[finora] no se pudo notificar por ${channel}:`, err);
  }
}
