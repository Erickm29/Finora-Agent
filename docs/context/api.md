# API — contratos REST y webhooks

Base URL conceptual: `https://api.<host>/v1` (o el mismo host de `apps/api` con Hono).

Auth:

| Cliente | Mecanismo |
|---------|-----------|
| Dashboard web | `Authorization: Bearer <supabase_jwt>` |
| Bot / jobs internos | Service role en servidor; webhook Telegram validado con secret del bot |
| Debug agent (si se expone) | Auth + rate limit; no exponer abierto al browser |

Montos en respuestas: pesos bolivianos (Bs / BOB) salvo que el profile indique otra moneda.

---

## Goals

### `GET /goals`

Lista metas del usuario autenticado.

**Response 200**

```json
{
  "goals": [
    {
      "id": "uuid",
      "name": "MacBook",
      "target_amount_bobs": 8500,
      "target_months": 10,
      "base_monthly_bobs": 850,
      "accumulated_bobs": 1200,
      "status": "active",
      "progress_ratio": 0.14
    }
  ]
}
```

### `GET /goals/:id`

Detalle de meta + progreso.

**Response 200** — objeto goal + campos de progreso; `404` si no existe o no es del usuario.

### `POST /goals`

Crear meta (también lo hace el agente vía domain; este endpoint sirve al dashboard o herramientas internas).

**Body**

```json
{
  "name": "MacBook",
  "target_amount_bobs": 8500,
  "target_months": 10,
  "base_monthly_bobs": 850,
  "product_url": null,
  "metadata": {}
}
```

**Response 201** — goal creado (`status` tipicamente `active` o `paused` según flujo de confirmación del plan).

### `PATCH /goals/:id`

Actualizar campos permitidos: `status`, `target_months`, `base_monthly_bobs`, `name`, `metadata`, etc.

**Body** (parcial)

```json
{ "status": "paused" }
```

### `GET /goals/:id/transactions`

Historial de `goal_transactions` ordenado por `created_at` desc.

**Response 200**

```json
{
  "transactions": [
    {
      "id": "uuid",
      "type": "contribution",
      "amount_bobs": 200,
      "source": "microsaving",
      "note": "Margen post-sueldo",
      "created_at": "2026-07-25T12:00:00Z"
    }
  ]
}
```

---

## Actions (confirmación humana)

### `GET /actions/pending`

Bandeja del dashboard: acciones `pending` no expiradas del usuario.

**Response 200**

```json
{
  "actions": [
    {
      "id": "uuid",
      "kind": "wallbit_convert",
      "payload": { "amount_bobs": 300, "to": "USD" },
      "channel_created": "telegram",
      "expires_at": "2026-07-26T12:00:00Z",
      "goal_id": "uuid"
    }
  ]
}
```

### `POST /actions/:id/confirm`

Confirma Wallbit / microahorro / retiro. Ejecuta el side-effect de dominio (incl. llamada Wallbit si aplica) y audita.

**Response 200**

```json
{
  "id": "uuid",
  "status": "confirmed",
  "confirmed_at": "2026-07-25T12:05:00Z",
  "result": {}
}
```

Errores: `404`, `409` si ya no está `pending`, `410` si expiró, `502`/`failed` si Wallbit falla (status `failed` persistido).

### `POST /actions/:id/cancel`

Cancela una acción pendiente.

**Response 200** — `{ "id", "status": "cancelled" }`

### Callback Telegram (interno)

Inline keyboard / `callback_query` con data tipo `action:confirm:{id}` o `action:cancel:{id}` invoca el mismo `PendingActionsService.confirm` / `cancel` que los endpoints anteriores. No es una ruta pública distinta; vive en el handler grammY → domain.

---

## Agent

### `POST /agent/turn`

Usado por grammY. No exponer al browser sin auth fuerte y rate limit.

**Body**

```json
{
  "userId": "uuid",
  "channel": "telegram",
  "text": "Quiero comprar una laptop",
  "callbackData": null,
  "externalChatId": "123456789"
}
```

**Response 200**

```json
{
  "replies": [
    {
      "type": "text",
      "text": "Encontré precios alrededor de 8,500 Bs...",
      "buttons": [
        { "label": "Confirmar plan", "callbackData": "action:confirm:uuid" }
      ]
    }
  ],
  "sessionId": "uuid"
}
```

El runtime puede devolver varios `replies` (texto, audio URL ElevenLabs, botones).

---

## Account linking

### `POST /account/telegram/link-token`

Genera token de un solo uso para vincular Telegram al usuario Auth web.

**Response 201**

```json
{
  "token": "abc123",
  "deep_link": "https://t.me/<bot>?start=link_abc123",
  "expires_at": "2026-07-25T13:00:00Z"
}
```

Flujo bot: `/start link_<token>` → asocia `profiles.telegram_user_id` y marca token usado.

---

## Webhooks

### `POST /webhooks/telegram`

Update de Telegram (grammY webhook). Validar secret/header del bot. Responder `200` rápido; procesar turn de forma async si hace falta.

### `POST /webhooks/wallbit` (futuro)

Callback de estado de operación Wallbit si el proveedor lo soporta. Actualizar `pending_actions` / auditoría sin saltarse confirmación humana inicial.

---

## Errores comunes

| Código | Uso |
|--------|-----|
| `400` | Body inválido |
| `401` | JWT ausente o inválido |
| `403` | Recurso de otro usuario |
| `404` | No encontrado |
| `409` | Conflicto de estado (acción ya confirmada) |
| `410` | Token / acción expirada |
| `429` | Rate limit (esp. agent/turn y Telegram) |
| `502` | Fallo de integración externa (Firecrawl, Exa, Wallbit) con mensaje claro al cliente |

Cuerpo de error sugerido:

```json
{
  "error": {
    "code": "ACTION_EXPIRED",
    "message": "Esta acción ya expiró. Pedile al agente que la prepare de nuevo."
  }
}
```
