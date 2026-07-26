# Finora Agent

Mentor financiero activo: convierte metas reales (laptop, viaje, casa, fondo de emergencia) en un plan operativo con microahorros, guardrails informativos y acciones preparadas (p. ej. Wallbit), **siempre con confirmación humana**.

- **Chat principal:** Telegram (grammY)
- **Dashboard:** Vite + React (`apps/web`) — metas, progreso, confirmar acciones
- **Mercado por defecto:** Bolivia — montos en **pesos bolivianos (Bs / BOB)**

---

## Pilares

1. Metas centradas en deseos reales del usuario  
2. Microahorros inteligentes e indoloros  
3. Guardrails informativos (impacto temporal), sin quitar control  
4. Acciones preparadas que requieren confirmación humana  

---

## Estado del MVP (backend / agente)

| Área | Estado |
|------|--------|
| Monorepo npm (`apps/api`, `apps/web`, `packages/*`) | Listo |
| Domain (goals, microahorros, guardrails, pending_actions) + tests | Listo |
| API REST Hono (`/v1/...`, `/health`) | Listo |
| Bot Telegram (polling local + comandos + callbacks) | Listo |
| Agente Gemini (tools + fallback 429 → mentor local) | Listo |
| Supabase (schema RLS + repos SQL) | Listo |
| Historial de conversación en Supabase | Listo |
| Firecrawl (precios) / Exa (macro BO) / ElevenLabs (voz) | Listo |
| Wallbit execute | Stub (sin cuenta/fondos aún) |
| Auth JWT Supabase para web | Pendiente (`X-User-Id` en local) |
| Dashboard Vite (`apps/web`) | Listo (mocks + adaptador `/v1`) |
| Jobs proactivos (precio / recordatorios) | Fase 2 |

---

## Stack

| Rol | Tecnología |
|-----|------------|
| LLM | AI Provider Layer: Groq / Gemini / OpenRouter (failover HA) |
| Chat | grammY + Telegram Bot API |
| API | Hono (`apps/api`) |
| Domain | `@finora/domain` (TypeScript) |
| Persistencia | Supabase (Postgres + RLS) o memoria local |
| Precios | Firecrawl |
| Macro / noticias | Exa |
| Voz | ElevenLabs |
| Divisas | Wallbit (prepare → confirm; execute stub hoy) |
| Dashboard | Vite + React + Tailwind (`apps/web`) |

---

## Monorepo

```
Finora-Agent/
├── apps/api          # Hono + grammY + agent runtime + adapters
├── apps/web          # Dashboard Vite + React + Tailwind
├── packages/shared   # Zod, errores, helpers
├── packages/domain   # Reglas de negocio + tests
├── packages/db       # Cliente / tipos Supabase
├── supabase/migrations/
└── docs/context/     # Spec producto, arquitectura, API, dominio
```

**Ownership**

| Área | Owner |
|------|--------|
| Backend + agente + bot + domain + Supabase | Este track |
| Frontend / dashboard | `apps/web` (contrato: [`docs/context/api.md`](docs/context/api.md)) |

---

## Requisitos

- Node.js ≥ 18  
- npm  
- Cuentas / keys según lo que quieras probar (ver `.env.example`)

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
npm test                 # tests de domain
```

Dashboard: copiá `apps/web/.env.example` → `apps/web/.env`. Con `VITE_USE_MOCKS=false` habla con la API (`X-User-Id`).

Detalle: [`docs/context/local-dev.md`](docs/context/local-dev.md).

### Variables de entorno relevantes

| Variable | Uso |
|----------|-----|
| `USE_MEMORY_STORE` | `true` = memoria; `false` = Supabase |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Persistencia (service role solo en API) |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_MODE=local` | Bot con long polling |
| `GROQ_API_KEY` / `GEMINI_API_KEY` / `OPENROUTER_API_KEY` | Proveedores LLM (HA; orden en `apps/api/config/ai-providers.json`) |
| `DEFAULT_PROVIDER` | Opcional: fuerza el primero del orden (ej. `groq`) |
| `GEMINI_MODEL` | Override de modelo Gemini (default en JSON: `gemini-2.5-flash`) |
| `FIRECRAWL_API_KEY` | Precios reales |
| `EXA_API_KEY` | Contexto macro Bolivia |
| `ELEVENLABS_API_KEY` / `ELEVENLABS_VOICE_ID` | Resumen por voz |
| `WALLBIT_API_KEY` / `WALLBIT_API_URL` | Vacío = stub seguro tras confirm |
| `VITE_API_URL` / `VITE_USE_MOCKS` | Dashboard Vite (`apps/web/.env`) |

Schema: aplicar / ya aplicado `supabase/migrations/20260725120000_init.sql` (Telegram-first: profiles sin exigir `auth.users`).

---

## API (resumen)

Base: `http://localhost:3001`

- `GET /health` — estado (memory/supabase, telegram, gemini)  
- `GET/POST/PATCH /v1/goals` …  
- `GET /v1/actions/pending` + `POST /v1/actions/:id/confirm|cancel`  
- `POST /v1/agent/turn`  
- `POST /v1/account/telegram/link-token`  

**Auth local hoy:** header `X-User-Id: <uuid>` (o `Authorization: Bearer <uuid>`).  
Contrato completo: [`docs/context/api.md`](docs/context/api.md).

---

## Telegram

Con `TELEGRAM_BOT_TOKEN` y `TELEGRAM_MODE=local`:

1. `npm run dev:api`  
2. Abrí el bot en Telegram  
3. `/start` → meta en lenguaje natural → microahorro → botones Confirmar / Cancelar  

Si Gemini responde 429 (cupo free), el bot **reintenta** y cae a mentor local sin cortar el flujo.

---

## Flujo de producto

1. Usuario define meta (Telegram)  
2. Investigación (Firecrawl / Exa; sin inventar precios si faltan datos)  
3. Plan en Bs (plazo + cuota base)  
4. Microahorros preparados → `pending_actions` → confirmación humana  
5. Guardrails: informan retraso en meses, no bloquean  
6. Wallbit: se prepara; execute solo tras confirm (stub hasta tener cuenta)  
7. Historial de chat persistido en Supabase  

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

1. Auth JWT Supabase en la API (para el dashboard)  
2. Commit / alinear `main` remoto  
3. Wallbit real cuando haya cuenta  
4. Jobs proactivos (fase 2)  
