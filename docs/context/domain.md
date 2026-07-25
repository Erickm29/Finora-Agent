# Dominio — metas, microahorros, guardrails y Wallbit

Contexto de ejemplo: **Venezuela / bolívares (Bs)**. Ajustar si el usuario opera en otro mercado.

## Metas

Una meta incluye al menos:

- Nombre / objeto deseado
- Precio estimado (investigación vía Firecrawl)
- Plazo objetivo
- Cuota o ritmo de ahorro sugerido
- Progreso acumulado

El agente puede enriquecer con tipo de cambio e inflación (Exa) para mantener el plan realista.

## Microahorros

Preferir acciones pequeñas frente a cuotas mensuales difíciles:

| Gatillo | Ejemplo de mensaje |
|---------|-------------------|
| Margen post-sueldo | "Detecté que puedes separar 200 Bs sin afectar tus gastos habituales. ¿Deseas agregarlos a tu meta?" |
| Gasto menor al previsto | "Puedes mover esos 15 Bs al fondo de tu laptop." |
| Vuelto / % de ingreso | Separar vuelto o un porcentaje menor tras recibir ingresos |

Siempre preguntar antes de mover fondos a la meta.

## Guardrails

Si el usuario intenta **retirar** dinero reservado a la meta:

1. Calcular el retraso aproximado en el cronograma
2. Comunicarlo de forma asertiva
3. Pedir confirmación
4. **No bloquear** de forma arbitraria

Ejemplo: *"Esa decisión retrasará tu objetivo aproximadamente dos meses. ¿Deseas continuar?"*

## Wallbit (protección patrimonial)

Cuando el contexto cambiario lo amerite:

1. Recomendar blindar poder adquisitivo (p. ej. Bs → USD)
2. **Preparar** la operación en Wallbit
3. Pedir un toque / clic de aprobación
4. No ejecutar sin confirmación

Ejemplo: *"Recomiendo convertir 300 Bs a USD para proteger tu poder de compra. ¿Preparar operación?"*

## Notificaciones y voz

- Alertas, recordatorios y seguimiento: Zavu (Telegram)
- Resúmenes de progreso por audio: ElevenLabs

## Principios de copy

- Informativo > paternalista
- Pregunta de confirmación en toda acción con impacto en dinero o plazo
- Cifras concretas (Bs, meses) cuando haya datos; si no, no inventar
