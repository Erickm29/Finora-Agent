# Finora Agent

Mentor financiero activo: convierte metas reales (laptop, viaje, casa, fondo de emergencia) en un plan operativo con microahorros, guardrails informativos y acciones preparadas (p. ej. Wallbit), **siempre con confirmación humana**.

- **Chat principal:** Telegram (grammY) — wizard `/nuevameta`, comandos y teclado
- **Dashboard:** Vite + React (`apps/web`) — metas, plan de inversión, progreso, preferencias de digest
- **Mercado por defecto:** Bolivia — montos en **pesos bolivianos (Bs / BOB)**
- **Deploy MVP:** web en [Vercel](https://vercel.com) · API + bot en [Render](https://render.com) · datos en Supabase

---

## Pilares

1. Metas centradas en deseos reales del usuario  
2. Microahorros inteligentes e indoloros  
3. Guardrails informativos (impacto temporal), sin quitar control  
4. Acciones preparadas que requieren confirmación humana  

---

## Estado del MVP

| Área | Estado |
|------|--------|
| Monorepo npm (`apps/api`, `apps/web`, `packages/*`) | Listo |
| Domain (goals, microahorros, guardrails, pending_actions) + tests | Listo |
| API REST Hono (`/v1/...`, `/health`) | Listo |
| Bot Telegram (polling local / webhook prod + comandos + callbacks) | Listo |
| Wizard `/nuevameta` + informe de inversión (Firecrawl / Exa / IA) | Listo |
| Capa IA HA (Groq → Gemini → OpenRouter; fallback mentor local) | Listo |
| Supabase (schema RLS + repos SQL + historial de chat) | Listo |
| Preferencias de digest + scheduler en el proceso API | Listo |
| Wallbit lecturas (saldo, mercado, cotización) | Listo |
| Wallbit convert (prepare → confirm) | Stub seguro tras confirmación |
| Dashboard Vite (`apps/web`) | Listo (mocks o API real vía `VITE_USE_MOCKS`) |
| Deploy Vercel (web) + Render (API) | Listo — ver [`docs/context/deploy.md`](docs/context/deploy.md) |
| Auth JWT Supabase para web | Pendiente (`X-User-Id` en local / demo) |
| Jobs proactivos de precio | Fase 2 |

---

## Stack

| Rol | Tecnología |
|-----|------------|
| LLM | AI Provider Layer: Groq / Gemini / OpenRouter (failover HA) |
| Chat | grammY + Telegram Bot API |
| API | Hono (`apps/api`) |
| Domain | `@finora/domain` (TypeScript) |
| Persistencia | Supabase (Postgres + RLS) o memoria local |
| Precios / research | Firecrawl |
| Macro / noticias | Exa |
| Voz | ElevenLabs |
| Divisas / mercado | Wallbit (lecturas reales; convert prepare → confirm; execute stub hoy) |
| Dashboard | Vite + React + Tailwind (`apps/web`) |
| Hosting | Vercel (web) + Render (API) |

---

## Monorepo

```
Finora-Agent/
├── apps/api          # Hono + grammY + agent runtime + adapters + digest job
├── apps/web          # Dashboard Vite + React + Tailwind
├── packages/shared   # Zod, errores, helpers
├── packages/domain   # Reglas de negocio + tests
├── packages/db       # Cliente / tipos Supabase
├── supabase/migrations/
├── render.yaml       # Blueprint API en Render
└── docs/context/     # Spec producto, arquitectura, API, deploy
```

| Área | Owner |
|------|--------|
| Backend + agente + bot + domain + Supabase | `apps/api`, `packages/*`, `supabase/` |
| Frontend / dashboard | `apps/web` (contrato: [`docs/context/api.md`](docs/context/api.md)) |

---

## Requisitos

- Node.js ≥ 18  
- npm  
- Cuentas / keys según lo que quieras probar (ver [`.env.example`](.env.example))

---

## Arranque local

```bash
npm install
cp .env.example .env
# Completar al menos: TELEGRAM_BOT_TOKEN + alguna AI key (GROQ_/GEMINI_/OPENROUTER_)
# Para persistir: SUPABASE_* y USE_MEMORY_STORE=false

npm run build:packages
npm run dev:api          # http://localhost:3001/health
npm run dev:web          # http://localhost:5173 (Vite dashboard)
npm test                 # tests de domain + API
```

Dashboard: copiá `apps/web/.env.example` → `apps/web/.env`. Con `VITE_USE_MOCKS=false` habla con la API (`X-User-Id`).

Detalle: [`docs/context/local-dev.md`](docs/context/local-dev.md).

### Variables de entorno relevantes

| Variable | Uso |
|----------|-----|
| `USE_MEMORY_STORE` | `true` = memoria; `false` = Supabase |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Persistencia (service role solo en API) |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_MODE` | `local` = polling; `webhook` = producción |
| `TELEGRAM_WEBHOOK_SECRET` / `PUBLIC_API_URL` | Webhook en Render (`…/webhooks/telegram`) |
| `WEB_APP_URL` | Origen del dashboard (CORS) |
| `GROQ_API_KEY` / `GEMINI_API_KEY` / `OPENROUTER_API_KEY` | Proveedores LLM (orden en `apps/api/config/ai-providers.json`) |
| `DEFAULT_PROVIDER` | Opcional: fuerza el primero del orden (ej. `groq`) |
| `GEMINI_MODEL` | Override de modelo Gemini (default: `gemini-2.5-flash`) |
| `FIRECRAWL_API_KEY` | Precios / research de productos |
| `EXA_API_KEY` | Contexto macro Bolivia |
| `ELEVENLABS_API_KEY` / `ELEVENLABS_VOICE_ID` | Resumen por voz |
| `WALLBIT_API_KEY` / `WALLBIT_API_URL` | Mercado / saldo; convert sigue en stub tras confirm |
| `GOAL_ANALYSIS_ENABLED` | Pipeline de análisis al crear meta (`false` lo apaga) |
| `DIGEST_SCHEDULER_ENABLED` | Loop de digest en el proceso API |
| `VITE_API_URL` / `VITE_USE_MOCKS` | Dashboard Vite (`apps/web/.env`) |

Migraciones en `supabase/migrations/` (init Telegram-first, link tokens, análisis de inversión, preferencias de digest).

---

## API (resumen)

Base: `http://localhost:3001`

- `GET /health` — estado (store, telegram, providers)
- `GET/POST/PATCH /v1/goals` · `GET /v1/goals/primary` · `POST /v1/goals/:id/primary|cancel`
- `GET /v1/goals/:id/analysis` · `POST /v1/goals/:id/analysis/refresh`
- `GET /v1/goals/:id/transactions`
- `GET /v1/market/context`
- `GET/PATCH /v1/preferences` · `POST /v1/jobs/digest/run` (smoke)
- `GET /v1/actions/pending` + `POST /v1/actions/:id/confirm|cancel`
- `POST /v1/agent/turn`
- `POST /v1/account/telegram/link-token` · `GET …/status` · `POST …/unlink`

**Auth local hoy:** header `X-User-Id: <uuid>` (o `Authorization: Bearer <uuid>`).  
Contrato completo: [`docs/context/api.md`](docs/context/api.md).

---

## Telegram

Con `TELEGRAM_BOT_TOKEN` y `TELEGRAM_MODE=local`:

1. `npm run dev:api`  
2. Abrí el bot en Telegram  
3. `/start` → `/nuevameta` (o lenguaje natural) → microahorro / proteger → botones Confirmar / Cancelar  

Comandos útiles: `/ayuda`, `/nuevameta`, `/meta`, `/progreso`, `/plan`, `/microahorro`, `/proteger`, `/priorizar`, `/eliminar`, `/saldo`, `/mercado`, `/cancelar`.

Si un proveedor IA responde 429/5xx, el bot **falla over** al siguiente y, si hace falta, al mentor local sin cortar el flujo.

En producción (`TELEGRAM_MODE=webhook`) el webhook se registra en `${PUBLIC_API_URL}/webhooks/telegram`.

---

## Flujo de producto

1. Usuario define meta (Telegram `/nuevameta` o dashboard)  
2. Investigación (Firecrawl / Exa; sin inventar precios si faltan datos)  
3. Informe / plan de inversión en Bs (plazo + cuota base)  
4. Microahorros o protección USD preparados → `pending_actions` → confirmación humana  
5. Guardrails: informan retraso en meses, no bloquean  
6. Wallbit: lecturas de mercado/saldo; convert se prepara y solo tras confirm (execute stub hasta cuenta real)  
7. Digest opcional según preferencias; historial de chat en Supabase  

---

## Deploy

| Pieza | Plataforma |
|-------|------------|
| Dashboard (`apps/web`) | Vercel |
| API + bot + digest (`apps/api`) | Render (`render.yaml`) |
| Datos | Supabase |

Guía paso a paso: [`docs/context/deploy.md`](docs/context/deploy.md).

---

## Reglas duras

1. Nunca ejecutar dinero real sin confirmación explícita  
2. Informar, no bloquear de forma paternalista  
3. Mentor accionable, no calculadora genérica  
4. Bs = pesos bolivianos (BOB), no bolívares  
5. Secretos solo en `.env` (nunca commitear `.env`)  

---

## Contexto para IA / Cursor

| Archivo | Uso |
|---------|-----|
| [`AGENTS.md`](AGENTS.md) | Entrada del agente: reglas y comandos |
| [`.cursor/rules/finora-product.mdc`](.cursor/rules/finora-product.mdc) | Producto (siempre activo) |
| [`.cursor/rules/finora-integrations.mdc`](.cursor/rules/finora-integrations.mdc) | Integraciones |
| [`docs/context/product.md`](docs/context/product.md) | Visión y features |
| [`docs/context/architecture.md`](docs/context/architecture.md) | C4, monorepo, canales |
| [`docs/context/domain.md`](docs/context/domain.md) | Metas, microahorros, guardrails |
| [`docs/context/data-model.md`](docs/context/data-model.md) | Tablas y RLS |
| [`docs/context/api.md`](docs/context/api.md) | Contratos REST |
| [`docs/context/local-dev.md`](docs/context/local-dev.md) | Dev local |
| [`docs/context/deploy.md`](docs/context/deploy.md) | Deploy: Vercel (web) + Render (API) |

---

## Próximos pasos sugeridos

1. Auth JWT Supabase en la API (reemplazar `X-User-Id` en producción)  
2. Confirmaciones atómicas / idempotentes en `pending_actions`  
3. Wallbit convert real cuando haya cuenta/fondos  
4. Jobs proactivos de precio (fase 2)  
