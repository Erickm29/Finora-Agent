# @finora/web — Dashboard Finora

SPA **Vite + React + TypeScript + Tailwind** (integrada desde la rama `frontend`).

## Arranque

Desde la raíz del monorepo:

```bash
npm install
cp apps/web/.env.example apps/web/.env
npm run dev:web          # http://localhost:5173
```

Con API real en paralelo:

```bash
npm run dev:api          # http://localhost:3001
# en apps/web/.env:
# VITE_API_URL=http://localhost:3001/v1
# VITE_USE_MOCKS=false
```

## Variables

| Variable | Descripción | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Base de la API Hono (con `/v1`) | `http://localhost:3001/v1` |
| `VITE_USE_MOCKS` | `true` = mocks en memoria; `false` = API real | `true` |

## Contrato

Los componentes no llaman `fetch` directo: pasan por `src/services/`.

Contratos validados vs backend: [`src/types/api-contract.ts`](src/types/api-contract.ts).  
API completa: [`docs/context/api.md`](../../docs/context/api.md).

Auth local (sin JWT aún): UUID en `localStorage` → header `X-User-Id`.
