/**
 * Smoke de la vinculación web ↔ Telegram.
 *
 * Reproduce el caso que rompía la demo: el usuario le escribe al bot primero
 * (lo que crea un perfil propio con telegram_user_id) y recién después vincula
 * desde el dashboard. La vinculación tiene que absorber ese perfil, no fallar
 * contra la constraint unique ni dejar las metas del bot huérfanas.
 *
 * Uso: npx tsx apps/api/scripts/smoke-telegram-link.ts
 */
import { randomUUID } from "node:crypto";
import { createServiceClient } from "@finora/db";
import { services } from "../src/container.js";
import { env } from "../src/env.js";

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
  const svc = services();
  const repos = svc.repos;
  const telegramUserId = Math.floor(Math.random() * 1_000_000_000) + 1_000_000;
  const webUserId = randomUUID();

  console.log("1. El usuario le escribe al bot antes de vincular");
  const botProfile = await repos.profiles.upsertTelegramProfile({
    id: randomUUID(),
    telegramUserId,
    displayName: "Usuario de Telegram",
  });
  const botGoal = await svc.goals.create(botProfile.id, {
    name: "Meta creada en Telegram",
    target_amount_bobs: 4000,
    target_months: 8,
    base_monthly_bobs: 500,
  });
  check("el bot creó un perfil propio", botProfile.id !== webUserId);

  console.log("2. El usuario abre el dashboard y crea una meta ahí");
  await repos.profiles.ensure(webUserId);
  const webGoal = await svc.goals.create(webUserId, {
    name: "Meta creada en la web",
    target_amount_bobs: 2000,
    target_months: 4,
    base_monthly_bobs: 500,
  });

  console.log("3. El dashboard genera un token de vinculación");
  const token = randomUUID().replace(/-/g, "").slice(0, 12);
  await repos.profiles.createLinkToken({
    token,
    userId: webUserId,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  });
  const consumed = await repos.profiles.consumeLinkToken(token);
  check("el token devuelve el usuario web", consumed === webUserId, consumed);
  check(
    "el token es de un solo uso",
    (await repos.profiles.consumeLinkToken(token)) === null,
  );
  check(
    "un token inexistente no vincula",
    (await repos.profiles.consumeLinkToken("noexiste")) === null,
  );

  console.log("4. El bot procesa /start link_<token>");
  await repos.profiles.linkTelegram(webUserId, telegramUserId, "@demo");

  console.log("5. Verificación");
  const linkedProfile = await repos.profiles.getByTelegramId(telegramUserId);
  check(
    "telegram apunta ahora al perfil web",
    linkedProfile?.id === webUserId,
    linkedProfile?.id,
  );
  check(
    "el perfil que creó el bot fue absorbido",
    (await repos.profiles.getById(botProfile.id)) === null,
  );

  const goals = await svc.goals.list(webUserId);
  const ids = goals.map((g) => g.id);
  check("la meta creada en Telegram migró", ids.includes(botGoal.id), ids);
  check("la meta creada en la web sigue ahí", ids.includes(webGoal.id), ids);

  console.log("6. Vincular de nuevo es idempotente");
  await repos.profiles.linkTelegram(webUserId, telegramUserId, "@demo");
  check(
    "sigue habiendo dos metas",
    (await svc.goals.list(webUserId)).length === 2,
  );

  if (!env.useMemory) {
    const db = createServiceClient(env.supabaseUrl, env.supabaseServiceRoleKey);
    // El borrado del perfil arrastra metas, transacciones y sesiones (cascade).
    await db.from("profiles").delete().eq("id", webUserId);
    console.log("   (datos de prueba eliminados)");
  }

  console.log(failures === 0 ? "\nTODO OK" : `\n${failures} FALLO(S)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("smoke falló:", err);
  process.exit(1);
});
