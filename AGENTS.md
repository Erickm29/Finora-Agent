# AGENTS.md — Finora Agent

## Qué es este proyecto

Finora Agent es un mentor financiero activo: convierte metas reales del usuario (laptop, casa, viaje, fondo de emergencia) en un plan operativo con microahorros, guardrails informativos y acciones preparadas (p. ej. Wallbit), siempre con confirmación humana.

Detalle de producto: `docs/context/product.md`
Arquitectura y flujo: `docs/context/architecture.md`
Dominio (mensajes y reglas de negocio): `docs/context/domain.md`

## Stack

| Rol | Servicio |
|-----|----------|
| LLM / razonamiento | OpenAI |
| Precios de productos | Firecrawl |
| Contexto macro / noticias | Exa |
| Patrimonio y divisas | Wallbit |
| Notificaciones (Telegram) | Zavu |
| Audio / resúmenes por voz | ElevenLabs |
| Persistencia | Supabase |

## Comandos

```bash
npm install
cp .env.example .env   # luego completar API keys
npm run dev
```

Requisitos: Node.js ≥ 18.

## Reglas duras

1. **Confirmación humana:** nunca ejecutar operaciones financieras reales (conversiones, retiros, transferencias) sin aprobación explícita del usuario. Preparar la acción; no cerrarla solo.
2. **Informar, no bloquear:** los guardrails calculan impacto (p. ej. retraso en meses) y preguntan; no quitan el control al usuario.
3. **Mentor, no calculadora:** priorizar planes accionables, microahorros indoloros y seguimiento; no vender productos financieros ajenos a la meta.
4. **Contexto local:** ejemplos y copy en bolívares (Bs) y realidad económica venezolana (tipo de cambio, inflación) salvo que el usuario indique otro mercado.
5. **Secretos:** no hardcodear API keys; usar `.env`. No commitear `.env`.
6. **Idioma:** código y comentarios según el archivo existente; docs de contexto y copy de producto en español.

## Al implementar features

- Anclar la feature a uno de los 4 pilares: metas reales, microahorros, guardrails, acciones preparadas con confirmación.
- Seguir el flujo: meta → investigación (Firecrawl/Exa) → plan → microahorros → guardrails → Wallbit (si aplica).
- Persistir metas, progreso e historial en Supabase.
- Canalizar alertas vía Zavu; resúmenes de voz vía ElevenLabs cuando corresponda.

## Qué no hacer

- No inventar precios o tipos de cambio: usar Firecrawl/Exa o dejar claro que faltan datos.
- No bloquear retiros de forma paternalista; informar impacto y pedir confirmación.
- No duplicar contexto largo en código: referenciar `docs/context/` cuando haga falta.
