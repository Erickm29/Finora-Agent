import type { Goal, InvestmentAnalysis } from "@finora/domain";

const likelihoodLabel: Record<string, string> = {
  alta: "probabilidad alta",
  media: "probabilidad media",
  baja: "probabilidad baja",
};

const cadenceLabel: Record<string, string> = {
  unica: "una vez",
  semanal: "cada semana",
  quincenal: "cada quincena",
  mensual: "cada mes",
};

/** El LLM no siempre cierra las frases; sin esto quedan pegadas al unirlas. */
function sentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

/** Render en texto plano del análisis, para el mensaje de seguimiento del bot. */
export function formatAnalysisForChat(
  goal: Goal,
  analysis: InvestmentAnalysis,
): string {
  const content = analysis.content;
  if (!content) {
    return `Ya guardé tu meta "${goal.name}", pero no pude completar el análisis económico esta vez. Lo reintento y te aviso.`;
  }

  const parts: string[] = [
    `Listo, analicé el contexto económico para tu meta "${goal.name}".`,
    "",
    sentence(content.economicSummary),
  ];

  if (content.scenarios.length) {
    parts.push("", "Escenarios posibles (no son certezas):");
    for (const s of content.scenarios) {
      parts.push(
        `• ${s.name} — ${likelihoodLabel[s.likelihood] ?? s.likelihood}. ${sentence(s.description)} Para tu meta: ${sentence(s.impactOnGoal)}`,
      );
    }
  }

  if (content.recommendations.length) {
    parts.push("", "Mi plan para vos:");
    content.recommendations.forEach((r, i) => {
      const amount =
        r.amountBobs !== null ? ` (Bs ${r.amountBobs.toLocaleString("es-BO")}` : "";
      const cadence = r.cadence ? `${amount ? " " : " ("}${cadenceLabel[r.cadence] ?? r.cadence}` : "";
      const suffix = amount || cadence ? `${amount}${cadence})` : "";
      parts.push(`${i + 1}. ${r.action}${suffix}`);
      parts.push(`   Por qué: ${sentence(r.rationale)}`);
    });
  }

  if (content.risks.length) {
    parts.push("", "A tener en cuenta:");
    for (const risk of content.risks) parts.push(`• ${risk}`);
  }

  if (content.dataCoverage === "sin-fuentes") {
    parts.push(
      "",
      "Ojo: esta vez no pude consultar noticias económicas recientes, así que el plan se apoya solo en los números de tu meta.",
    );
  }

  parts.push(
    "",
    "Ninguna conversión se ejecuta sin que vos la confirmes. Decime si querés ajustar el plan.",
  );

  return parts.join("\n");
}
