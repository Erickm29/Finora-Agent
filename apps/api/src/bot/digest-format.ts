/**
 * Formato Telegram del contrato compartido Sprint 3 (payload de pending_actions
 * enriquecido por el digest de Track B). Track A lo usa al notificar y al
 * mostrar acciones preparadas; Track B puede reutilizarlo al armar el mensaje.
 */

export type DigestSource = {
  title?: string;
  url?: string;
  snippet?: string;
};

export type DigestPayload = {
  amount_bobs?: number;
  to?: string;
  title?: string;
  rationale?: string;
  risks?: unknown;
  benefits?: unknown;
  source?: DigestSource;
  digest?: boolean;
  note?: string;
};

function asStringList(value: unknown, max = 3): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim())
    .slice(0, max);
}

function kindLabel(kind: string): string {
  switch (kind) {
    case "wallbit_convert":
      return "Conversión Wallbit (Bs → USD)";
    case "apply_microsaving":
      return "Microahorro";
    case "confirm_withdrawal":
      return "Retiro de meta";
    default:
      return "Acción preparada";
  }
}

/**
 * Arma el texto del digest / pending action con origen, porqué, riesgos y beneficios.
 * Si el payload no trae campos de digest, cae a un resumen corto clásico.
 */
export function formatPendingActionMessage(action: {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
}): {
  text: string;
  buttons: { label: string; callbackData: string }[];
} {
  const p = action.payload as DigestPayload;
  const amount =
    typeof p.amount_bobs === "number" && Number.isFinite(p.amount_bobs)
      ? p.amount_bobs
      : null;
  const to = typeof p.to === "string" && p.to ? p.to : "USD";
  const risks = asStringList(p.risks);
  const benefits = asStringList(p.benefits);
  const isDigest = p.digest === true || Boolean(p.rationale) || risks.length > 0;

  const lines: string[] = [];

  if (isDigest) {
    lines.push(p.title?.trim() || "Briefing Finora — acción preparada");
    lines.push("");
    lines.push(`Tipo: ${kindLabel(action.kind)}`);
    if (amount != null) {
      lines.push(
        action.kind === "wallbit_convert"
          ? `Monto: Bs ${amount.toLocaleString("es-BO")} → ${to}`
          : `Monto: Bs ${amount.toLocaleString("es-BO")}`,
      );
    }
    if (p.rationale?.trim()) {
      lines.push("");
      lines.push(`Por qué ahora:\n${p.rationale.trim()}`);
    }
    if (benefits.length) {
      lines.push("");
      lines.push("Beneficios:");
      for (const b of benefits) lines.push(`• ${b}`);
    }
    if (risks.length) {
      lines.push("");
      lines.push("Riesgos:");
      for (const r of risks) lines.push(`• ${r}`);
    }
    if (p.source?.title || p.source?.url) {
      lines.push("");
      const srcTitle = p.source.title?.trim() || "Fuente";
      lines.push(
        p.source.url
          ? `Origen: ${srcTitle}\n${p.source.url}`
          : `Origen: ${srcTitle}`,
      );
      if (p.source.snippet?.trim()) {
        lines.push(p.source.snippet.trim().slice(0, 200));
      }
    }
    lines.push("");
    lines.push("Nada se ejecuta hasta que confirmés.");
  } else {
    lines.push(`${kindLabel(action.kind)} lista para tu OK.`);
    if (amount != null) {
      lines.push(
        action.kind === "wallbit_convert"
          ? `Monto: Bs ${amount.toLocaleString("es-BO")} → ${to}`
          : `Monto: Bs ${amount.toLocaleString("es-BO")}`,
      );
    }
    if (typeof p.note === "string" && p.note.trim()) {
      lines.push(p.note.trim());
    }
    lines.push("Confirmá o cancelá con los botones.");
  }

  return {
    text: lines.join("\n"),
    buttons: [
      { label: "Confirmar", callbackData: `action:confirm:${action.id}` },
      { label: "Cancelar", callbackData: `action:cancel:${action.id}` },
    ],
  };
}
