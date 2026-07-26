# Dominio — metas, microahorros, guardrails y Wallbit

Contexto por defecto: **Bolivia / pesos bolivianos (Bs, BOB)**. Ajustar si el usuario opera en otro mercado.

## Canales

| Canal | Rol |
|-------|-----|
| **Telegram** (bot grammY) | Chat principal con el agente: definir metas, microahorros, guardrails, conversación mentor |
| **Web** (dashboard) | Metas, progreso, historial y **confirmación** de acciones (Wallbit, retiros sensibles) |
| **Zavu** | Opcional / secundario: push multi-canal si se configura; no sustituye al bot |

La conversación “mentor” vive en Telegram. La web es control y confirmación, no un segundo chat LLM en el MVP.

## Metas

Una meta incluye al menos:

- Nombre / objeto deseado
- Precio estimado en Bs (investigación vía Firecrawl)
- Plazo objetivo
- Cuota o ritmo de ahorro sugerido
- Progreso acumulado

El agente puede enriquecer con tipo de cambio e inflación en contexto boliviano (Exa) para mantener el plan realista.

### Ejemplo de plan estructurado

- Meta: MacBook
- Precio: 8,500 Bs
- Plazo: 10 meses
- Cuota base estimada: 850 Bs/mes

## Microahorros

Preferir acciones pequeñas frente a cuotas mensuales difíciles:

| Gatillo | Ejemplo de mensaje |
|---------|-------------------|
| Margen post-sueldo | "Detecté que puedes separar 200 Bs sin afectar tus gastos habituales. ¿Deseas agregarlos a tu meta?" |
| Gasto menor al previsto | "Puedes mover esos 15 Bs al fondo de tu laptop." |
| Vuelto / % de ingreso | Separar vuelto o un porcentaje menor tras recibir ingresos |

Siempre preguntar antes de mover fondos a la meta (botones en Telegram o acción pendiente en web).

### Flujo

1. Agente o job detecta margen → sugiere microahorro
2. Usuario confirma (Telegram inline o dashboard)
3. Se registra `goal_transactions` (contribution) y se actualiza acumulado
4. Si rechaza → solo log; no insistir de forma paternalista

## Guardrails

Si el usuario intenta **retirar** dinero reservado a la meta:

1. Calcular el retraso aproximado en el cronograma
2. Comunicarlo de forma asertiva
3. Pedir confirmación (Telegram y/o bandeja web)
4. **No bloquear** de forma arbitraria

Ejemplo: *"Esa decisión retrasará tu objetivo aproximadamente dos meses. ¿Deseas continuar?"*

## Wallbit (protección patrimonial)

Cuando el contexto cambiario lo amerite:

1. Recomendar blindar poder adquisitivo (p. ej. Bs → USD)
2. **Preparar** la operación → fila `pending_actions` (nunca ejecutar desde el LLM solo)
3. Pedir aprobación: botones en Telegram y/o tarjeta en el dashboard web
4. Ejecutar Wallbit **solo** tras confirmación humana

Ejemplo: *"Recomiendo convertir 300 Bs a USD para proteger tu poder de compra. ¿Preparar operación?"*

Confirmación posible en:

- Telegram: callback `Confirmar aquí`
- Web: bandeja de acciones pendientes → confirmar / cancelar

## Notificaciones y voz

- Alertas y recordatorios in-bot: Telegram nativo (grammY)
- Push extra (SMS u otros): Zavu, solo si está configurado
- Resúmenes de progreso por audio: ElevenLabs (p. ej. enviado por Telegram)

## Principios de copy

- Informativo > paternalista
- Pregunta de confirmación en toda acción con impacto en dinero o plazo
- Cifras concretas (Bs, meses) cuando haya datos; si no, no inventar
- Contexto local Bolivia salvo otra indicación del usuario
