# Construcción local — Finora

## Ownership del equipo

| Área | Owner |
|------|--------|
| Backend API + agente IA + domain + bot Telegram | Este track (`apps/api`, `packages/*`, `supabase/`) |
| Frontend / dashboard | Otro compañero (`apps/web` es stub de referencia) |

Contrato para frontend: [`api.md`](api.md).

```bash
npm install
cp .env.example .env
# Opcional: TELEGRAM_BOT_TOKEN, GEMINI_API_KEY, Supabase, Firecrawl, Exa, Wallbit, ElevenLabs

npm run build:packages   # compila @finora/shared|db|domain → dist/
npm run dev:api          # http://localhost:3001  — GET /health (hace build:packages)
# Frontend: otro owner; stub en apps/web (no está en workspaces de este track)
npm test                 # build packages + tests de domain
```

Por defecto `USE_MEMORY_STORE=true`: datos en memoria (no requiere Supabase para desarrollar). Auth local: header `X-User-Id` (UUID).

## Monorepo

| Path | Rol |
|------|-----|
| `apps/api` | Hono + grammY + agent runtime |
| `apps/web` | Next.js dashboard |
| `packages/shared` | Zod + errores + helpers |
| `packages/domain` | Goals, microahorros, guardrails, pending_actions |
| `packages/db` | Tipos / clientes Supabase |
| `supabase/migrations` | SQL + RLS |

## Auth local

- API: header `X-User-Id` (UUID) o `Authorization: Bearer <id>`
- Web: genera un user id en `localStorage`
- Telegram: crea profile por `telegram_user_id`

Nota: en memoria, web y Telegram no comparten el mismo user id salvo que copies el id de Ajustes o uses link-token tras alinear profiles.

## Spec

Ver `docs/context/architecture.md`, `data-model.md`, `api.md`, `domain.md`.
