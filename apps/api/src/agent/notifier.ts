import type { Channel } from "@finora/shared";

export type NotifyButton = { label: string; callbackData: string };

export type NotifyOptions = {
  /** Inline buttons (Telegram). Otros canales pueden ignorarlos. */
  buttons?: NotifyButton[];
};

export type ChannelNotifier = (
  externalChatId: string,
  text: string,
  options?: NotifyOptions,
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
  options?: NotifyOptions,
): Promise<void> {
  const notifier = notifiers.get(channel);
  if (!notifier) return;
  try {
    await notifier(externalChatId, text, options);
  } catch (err) {
    console.warn(`[finora] no se pudo notificar por ${channel}:`, err);
  }
}

/**
 * Helper para Track B: manda un pending action ya formateado (texto + Confirmar/Cancelar).
 * `format` viene de `bot/digest-format.ts`.
 */
export async function notifyPendingAction(
  channel: Channel,
  externalChatId: string,
  formatted: { text: string; buttons: NotifyButton[] },
): Promise<void> {
  await notifyChannel(channel, externalChatId, formatted.text, {
    buttons: formatted.buttons,
  });
}
