# Arquitectura y flujo — Finora Agent

## Stack

| Capa | Tecnología | Responsabilidad |
|------|------------|-----------------|
| Conversación / razonamiento | OpenAI (LLM) | Cerebro del agente |
| Precios de productos | Firecrawl | Scraping / extracción de precios reales |
| Contexto económico | Exa | Búsqueda macro, noticias, mercado |
| Patrimonio / divisas | Wallbit | Consulta patrimonio; preparar protección de ahorro |
| Notificaciones | Zavu | Recordatorios y seguimiento (Telegram) |
| Audio | ElevenLabs | Resúmenes financieros por voz |
| Persistencia | Supabase | Metas, progreso, historial de transacciones |

Runtime previsto: **Node.js ≥ 18**, gestor npm/pnpm/yarn.

## Flujo de una interacción típica

```text
1. Meta          Usuario define objetivo (ej. "Quiero comprar una MacBook")
2. Investigación Firecrawl + Exa → precio, FX, inflación, contexto
3. Plan          Meta estructurada (precio, plazo, cuota base)
4. Microahorros  Sugerencias al detectar margen o menor gasto
5. Guardrails    Si hay retiro del fondo → impacto en plazo + confirmación
6. Wallbit       Si conviene proteger poder de compra → preparar op. + confirmación
```

### Ejemplo de plan estructurado

- Meta: MacBook
- Precio: 8,500 Bs
- Plazo: 10 meses
- Cuota base estimada: 850 Bs/mes

## Límites de automatización

- **Preparar** conversiones, alertas y sugerencias: sí (agente)
- **Ejecutar** movimiento de dinero o conversión real: solo tras confirmación del usuario
- Persistencia de estado de meta y transacciones: Supabase

## Variables de entorno (conceptual)

API keys para: OpenAI, Firecrawl, Exa, Wallbit, Zavu, ElevenLabs, Supabase.  
Plantilla: `.env.example` → `.env` (nunca commitear `.env`).
