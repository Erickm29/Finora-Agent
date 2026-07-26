import {
  researchProductPrice,
  researchMacroContext,
  generateVoiceSummary,
} from "../src/integrations/market.ts";

const price = await researchProductPrice("MacBook Air precio");
console.log(
  "PRICE",
  JSON.stringify(
    {
      ok: price.ok,
      source: price.source,
      amountBobs: price.amountBobs,
      amountForeign: price.amountForeign,
      currency: price.currency,
      title: price.title,
      error: price.error,
      note: price.note,
    },
    null,
    2,
  ),
);

const macro = await researchMacroContext("tipo de cambio");
console.log(
  "MACRO",
  JSON.stringify(
    {
      ok: macro.ok,
      source: macro.source,
      error: macro.error,
      summary: macro.summary?.slice(0, 600),
      highlights: macro.highlights?.length,
    },
    null,
    2,
  ),
);

const voice = await generateVoiceSummary(
  "Hola, soy Finora. Tu plan de ahorro en pesos bolivianos va bien.",
);
console.log(
  "VOICE",
  JSON.stringify(
    {
      ok: voice.ok,
      error: "error" in voice ? voice.error : undefined,
      bytes: "bytes" in voice ? voice.bytes : undefined,
    },
    null,
    2,
  ),
);
