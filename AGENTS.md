# AGENTS.md — Finora Agent

## Qué es este proyecto

Finora Agent es un mentor financiero activo: convierte metas reales del usuario (laptop, casa, viaje, fondo de emergencia) en un plan operativo con microahorros, guardrails informativos y acciones preparadas (p. ej. Wallbit), siempre con confirmación humana.

- Chat principal: **Telegram** (grammY + Telegram Bot API)
- Web: **dashboard** (metas, progreso, confirmar Wallbit) — no chat LLM en MVP
- Mercado por defecto: **Bolivia**, montos en **pesos bolivianos (Bs / BOB)**

Detalle de producto: `docs/context/product.md`  
Arquitectura y flujo: `docs/context/architecture.md`  
Dominio (mensajes y reglas de negocio): `docs/context/domain.md`  
Modelo de datos: `docs/context/data-model.md`  
API: `docs/context/api.md`  
Dev local: `docs/context/local-dev.md`

## Stack

| Rol | Servicio |
|-----|----------|
| LLM / razonamiento | Gemini (Google AI) |
| Chat principal | grammY + Telegram Bot API |
| Dashboard | Next.js |
| Precios de productos | Firecrawl |
| Contexto macro / noticias | Exa |
| Patrimonio y divisas | Wallbit |
| Notificaciones extra (opcional) | Zavu |
| Audio / resúmenes por voz | ElevenLabs |
| Persistencia | Supabase (o store en memoria local) |

## Comandos

```bash
npm install
cp .env.example .env   # USE_MEMORY_STORE=true por defecto
npm run build:packages # shared/db/domain → dist/
npm run dev:api        # API + bot (si hay TELEGRAM_BOT_TOKEN)
npm test               # domain unit tests
```

Requisitos: Node.js ≥ 18. Workspaces de este track: `apps/api`, `packages/*` (`apps/web` es stub / owner externo).

## Reglas duras

1. **Confirmación humana:** nunca ejecutar operaciones financieras reales (conversiones, retiros, transferencias) sin aprobación explícita del usuario. Preparar la acción (`pending_actions`); no cerrarla solo.
2. **Informar, no bloquear:** los guardrails calculan impacto (p. ej. retraso en meses) y preguntan; no quitan el control al usuario.
3. **Mentor, no calculadora:** priorizar planes accionables, microahorros indoloros y seguimiento; no vender productos financieros ajenos a la meta.
4. **Contexto local:** ejemplos y copy en pesos bolivianos (Bs) y realidad económica de Bolivia (tipo de cambio, inflación) salvo que el usuario indique otro mercado.
5. **Secretos:** no hardcodear API keys; usar `.env`. No commitear `.env`.
6. **Idioma:** código y comentarios según el archivo existente; docs de contexto y copy de producto en español.
7. **Canales:** conversación mentor en Telegram; confirmaciones sensibles también en dashboard web. Zavu es opcional/secundario.

## Al implementar features

- Anclar la feature a uno de los 4 pilares: metas reales, microahorros, guardrails, acciones preparadas con confirmación.
- Seguir el flujo: meta → investigación (Firecrawl/Exa) → plan → microahorros → guardrails → Wallbit (si aplica).
- Persistir metas, progreso e historial en Supabase (ver `docs/context/data-model.md`).
- Alertas in-bot vía Telegram; Zavu solo si el adapter opcional está configurado; resúmenes de voz vía ElevenLabs cuando corresponda.

## Qué no hacer

- No inventar precios o tipos de cambio: usar Firecrawl/Exa o dejar claro que faltan datos.
- No bloquear retiros de forma paternalista; informar impacto y pedir confirmación.
- No duplicar contexto largo en código: referenciar `docs/context/` cuando haga falta.
- No tratar Bs como bolívares venezolanos: **Bs = pesos bolivianos (BOB)**.
