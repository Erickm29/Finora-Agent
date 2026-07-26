# Construcción local — Finora

## Ownership del equipo

| Área | Owner |
|------|--------|
| Backend API + agente IA + domain + bot Telegram | Este track (`apps/api`, `packages/*`, `supabase/`) |
| Frontend / dashboard | Vite SPA en `apps/web` (integrada desde rama `frontend`) |

Contrato HTTP: [`api.md`](api.md).

```bash
npm install
cp .env.example .env
# Opcional: TELEGRAM_BOT_TOKEN, GROQ_API_KEY / GEMINI_API_KEY / OPENROUTER_API_KEY, Supabase, Firecrawl, Exa, Wallbit, ElevenLabs

npm run build:packages   # compila @finora/shared|db|domain → dist/
npm run dev:api          # http://localhost:3001  — GET /health
npm run dev:web          # http://localhost:5173 — dashboard Vite
npm test                 # build packages + tests de domain + AI layer
```

Por defecto `USE_MEMORY_STORE=true`: datos en memoria (no requiere Supabase para desarrollar). Auth local API: header `X-User-Id` (UUID).

### AI providers (HA)

Orden y modelos: [`apps/api/config/ai-providers.json`](../../apps/api/config/ai-providers.json) (cambiar el array `providers` sin tocar código).

Failover automático ante 429/5xx/timeout: Groq → Gemini → OpenRouter (por defecto).

```
GROQ_API_KEY=
GEMINI_API_KEY=
OPENROUTER_API_KEY=
DEFAULT_PROVIDER=groq
```

Sin ninguna key: el agente usa mentor local (`heuristicTurn`).

### Frontend (Vite)

```bash
cd apps/web
cp .env.example .env   # o desde la raíz: apps/web/.env
# VITE_API_URL=http://localhost:3001/v1
# VITE_USE_MOCKS=true   # UI completa sin API
# VITE_USE_MOCKS=false  # habla con Hono via X-User-Id
npm run dev:web
```

## Monorepo

| Path | Rol |
|------|-----|
| `apps/api` | Hono + grammY + agent runtime |
| `apps/web` | Dashboard Vite + React + Tailwind |
| `packages/shared` | Zod + errores + helpers |
| `packages/domain` | Goals, microahorros, guardrails, pending_actions |
| `packages/db` | Tipos / clientes Supabase |
| `supabase/migrations` | SQL + RLS |

## Auth local

- API: header `X-User-Id` (UUID) o `Authorization: Bearer <id>`
- Web (API mode): genera / persiste user id + perfil en `localStorage` y lo envía en cada request
- Telegram: crea profile por `telegram_user_id`
- JWT Supabase: pendiente

Nota: en memoria, web y Telegram no comparten el mismo user id salvo que copies el id o uses link-token tras alinear profiles.

## Spec

Ver `docs/context/architecture.md`, `data-model.md`, `api.md`, `domain.md`.
