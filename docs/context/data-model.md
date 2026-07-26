# Modelo de datos — Supabase

Persistencia de Finora: Postgres + Auth + RLS en Supabase. Moneda por defecto: **BOB (pesos bolivianos)**. Campos `*_bobs` guardan montos en Bs.

Esquema conceptual para migraciones en `supabase/migrations/`.

## Auth y usuarios

- **Web:** Supabase Auth (email / magic link u OAuth).
- **Telegram:** `profiles.telegram_user_id` (bigint único). Vinculación: deep link `/start link_<token>` o código desde el dashboard.
- **RLS:** filas filtradas por `auth.uid()`. El **service role** solo en `apps/api` (webhook del bot y jobs).

## Tablas

### `profiles`

| Columna | Tipo | Notas |
|---------|------|--------|
| `id` | uuid PK | `= auth.users.id` |
| `display_name` | text | |
| `telegram_user_id` | bigint UNIQUE NULL | ID de Telegram |
| `locale` | text | default `es-BO` |
| `currency` | text | default `BOB` |
| `created_at` | timestamptz | |

### `goals`

| Columna | Tipo | Notas |
|---------|------|--------|
| `id` | uuid PK | |
| `user_id` | uuid FK → profiles | |
| `name` | text | ej. "MacBook" |
| `target_amount_bobs` | numeric | precio objetivo en Bs |
| `target_months` | int | plazo |
| `base_monthly_bobs` | numeric | cuota base sugerida |
| `accumulated_bobs` | numeric | default 0 |
| `status` | text | `active` \| `paused` \| `completed` \| `cancelled` |
| `product_url` | text NULL | |
| `last_price_check_at` | timestamptz NULL | |
| `metadata` | jsonb | FX snapshot, notas |
| `created_at` / `updated_at` | timestamptz | |

### `goal_transactions`

| Columna | Tipo | Notas |
|---------|------|--------|
| `id` | uuid PK | |
| `goal_id` | uuid FK → goals | |
| `user_id` | uuid FK → profiles | |
| `type` | text | `contribution` \| `withdrawal` \| `adjustment` |
| `amount_bobs` | numeric | |
| `source` | text | `microsaving` \| `manual` \| `salary_margin` \| `change` |
| `note` | text NULL | |
| `created_at` | timestamptz | |

Auditoría: **todo** movimiento de dinero lógico de una meta pasa por esta tabla. Actualizar `goals.accumulated_bobs` en la misma transacción de dominio.

### `pending_actions`

| Columna | Tipo | Notas |
|---------|------|--------|
| `id` | uuid PK | |
| `user_id` | uuid FK → profiles | |
| `goal_id` | uuid NULL FK → goals | |
| `kind` | text | `wallbit_convert` \| `apply_microsaving` \| `confirm_withdrawal` |
| `payload` | jsonb | montos, de/a, refs Wallbit |
| `status` | text | `pending` \| `confirmed` \| `cancelled` \| `expired` \| `failed` |
| `channel_created` | text | `telegram` \| `web` |
| `confirm_token` | text UNIQUE | deep link web / callback |
| `expires_at` | timestamptz | |
| `confirmed_at` | timestamptz NULL | |
| `created_at` | timestamptz | |

Toda operación financiera externa (Wallbit) y toda mutación sensible que el agente solo **prepara** pasa por aquí. El LLM no marca `confirmed` ni llama a Wallbit execute.

### `conversation_sessions`

| Columna | Tipo | Notas |
|---------|------|--------|
| `id` | uuid PK | |
| `user_id` | uuid FK → profiles | |
| `channel` | text | MVP: `telegram` |
| `external_chat_id` | text | chat id Telegram |
| `active_goal_id` | uuid NULL | |
| `updated_at` | timestamptz | |

### `conversation_messages`

| Columna | Tipo | Notas |
|---------|------|--------|
| `id` | uuid PK | |
| `session_id` | uuid FK → sessions | |
| `role` | text | `user` \| `assistant` \| `tool` \| `system` |
| `content` | text | |
| `tool_name` | text NULL | |
| `created_at` | timestamptz | |

### `market_snapshots`

| Columna | Tipo | Notas |
|---------|------|--------|
| `id` | uuid PK | |
| `query` | text | |
| `source` | text | `firecrawl` \| `exa` |
| `data` | jsonb | |
| `fetched_at` | timestamptz | |

Cache corto de investigación; no inventar datos si la API falló (no escribir snapshots falsos).

### Vinculación Telegram (sugerido)

Tabla o uso de payload efímero para link tokens:

| Columna | Tipo | Notas |
|---------|------|--------|
| `token` | text PK | un solo uso |
| `user_id` | uuid FK | |
| `expires_at` | timestamptz | |
| `used_at` | timestamptz NULL | |

Alternativa: guardar el token en `pending_actions` con `kind = link_telegram` si se unifica el patrón.

## Índices recomendados

- `goals (user_id, status)`
- `pending_actions (user_id, status)`
- `profiles (telegram_user_id)` donde no sea null
- `goal_transactions (goal_id, created_at)`
- `conversation_sessions (user_id, channel)`

## RLS (política base)

Para tablas con `user_id` (o `profiles.id`):

- `SELECT` / `INSERT` / `UPDATE` / `DELETE`: `user_id = auth.uid()` (o `id = auth.uid()` en profiles)
- El bot y jobs usan **service role** y deben filtrar siempre por el `user_id` resuelto desde `telegram_user_id`

No exponer service role al browser.

## Invariantes de dominio

1. `accumulated_bobs` coherente con la suma neta de `goal_transactions` de esa meta
2. Wallbit execute solo si `pending_actions.status` pasa de `pending` → `confirmed` por acción humana
3. Tokens de confirmación: un solo uso; tras uso o `expires_at`, inválidos
4. Montos en Bs (BOB) salvo que `profiles.currency` indique otro mercado en el futuro
