/**
 * Smoke Track A: Wallbit saldo/cotización + formato digest Telegram.
 *
 * Uso: npx tsx apps/api/scripts/smoke-telegram-track-a.ts
 */
import { getAssetQuote, getStocksPortfolio } from "../src/integrations/wallbit.js";
import { formatPendingActionMessage } from "../src/bot/digest-format.js";
import { validateToolArgs } from "../src/agent/tool-schemas.js";

let failures = 0;

function check(label: string, condition: boolean, detail?: unknown) {
  if (condition) {
    console.log(`  ok   ${label}`);
    return;
  }
  failures++;
  console.error(`  FAIL ${label}`, detail ?? "");
}

async function main() {
  console.log("1. Portfolio /saldo (Wallbit)");
  try {
    const portfolio = await getStocksPortfolio();
    console.log(
      `   cash=${portfolio.usdCash} positions=${portfolio.positions.length}`,
    );
    check("portfolio respondió", true);
  } catch (err) {
    check(
      "portfolio respondió",
      false,
      err instanceof Error ? err.message : err,
    );
  }

  console.log("\n2. getAssetQuote NVDA");
  try {
    const quote = await getAssetQuote("NVDA");
    console.log(
      `   symbol=${quote?.symbol} price=${quote?.price} currency=${quote?.currency}`,
    );
    check("encontró NVDA o devolvió null sin throw", true);
    if (quote) {
      check("tiene symbol", Boolean(quote.symbol));
    }
  } catch (err) {
    check("getAssetQuote", false, err instanceof Error ? err.message : err);
  }

  console.log("\n3. tool lookup_asset_price validation");
  const ok = validateToolArgs("lookup_asset_price", { symbol: "aapl" });
  check("normaliza a AAPL", ok.ok && ok.args.symbol === "AAPL", ok);
  const bad = validateToolArgs("lookup_asset_price", { symbol: "" });
  check("rechaza symbol vacío", !bad.ok);

  console.log("\n4. format digest pending action");
  const formatted = formatPendingActionMessage({
    id: "00000000-0000-4000-8000-000000000001",
    kind: "wallbit_convert",
    payload: {
      amount_bobs: 350,
      to: "USD",
      digest: true,
      title: "Briefing de prueba",
      rationale: "El tipo de cambio y la meta primaria sugieren proteger Bs.",
      risks: ["El USD puede bajar en el corto plazo", "Stub: no hay trade real"],
      benefits: ["Reduce exposición a Bs", "Acción reversible hasta confirmar"],
      source: {
        title: "Nota macro BO",
        url: "https://example.com/noticia",
        snippet: "Contexto de prueba",
      },
    },
  });
  check("incluye Por qué ahora", formatted.text.includes("Por qué ahora"));
  check("incluye Riesgos", formatted.text.includes("Riesgos"));
  check("incluye Beneficios", formatted.text.includes("Beneficios"));
  check("incluye Origen", formatted.text.includes("Origen"));
  check("botón Confirmar", formatted.buttons[0]?.callbackData.includes("confirm"));
  check("botón Cancelar", formatted.buttons[1]?.callbackData.includes("cancel"));
  console.log("---\n" + formatted.text.slice(0, 400) + "\n---");

  console.log(`\n${failures === 0 ? "SMOKE A OK" : `SMOKE A CON ${failures} FALLOS`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("smoke A falló", err);
  process.exit(1);
});
