# Finora-Agent
# Finora Agent 🤖💰
*El agente financiero que convierte tus metas en un plan automático.*

<div align="center">

[![Status]()](#)
[![License: MIT]()
[![Powered by OpenAI]()
[![Telegram Bot]()

</div>

---

## 📌 Visión General del Proyecto

Las personas suelen fijarse metas claras y aspiracionales, tales como:
* Comprar una laptop de alta gama para trabajar o estudiar.
* Ahorrar para la inicial de una casa propia.
* Planificar un viaje internacional soñado.
* Construir un sólido fondo de emergencia ante imprevistos.

Sin embargo, en el día a día suele ocurrir el obstáculo clásico: *"Este mes iba a ahorrar... pero terminé gastando el dinero."*

El verdadero problema financiero de la mayoría de las personas no radica en saber cómo invertir en instrumentos complejos, sino en la **falta crónica de disciplina y la ausencia de un plan operativo, ultra-personalizado y adaptado a su realidad económica**.

**Finora Agent** es un agente financiero autónomo e inteligente diseñado para acompañar de la mano al usuario desde el instante exacto en que define un objetivo hasta que lo materializa, transformando por completo su comportamiento financiero a través de microahorros invisibles, guardrails conductuales y automatizaciones conectadas a servicios financieros reales.

---

## 💡 ¿Por qué Finora Agent? (El Gran Diferencial)

A diferencia de las aplicaciones bancarias tradicionales o las calculadoras de ahorro estáticas que se limitan a mostrar gráficos aburridos, **Finora Agent actúa como un mentor financiero personal y activo**. 

El "wow factor" del proyecto descansa sobre cuatro pilares fundamentales:
1. **Metas centradas en deseos reales**, no en la venta de productos financieros ajenos al usuario.
2. **Microahorros inteligentes e indoloros**, que distribuyen el esfuerzo financiero en pequeñas acciones cotidianas para que ahorrar deje de sentirse como un sacrificio.
3. **Guardrails financieros y conductuales**, que previenen compras impulsivas informando el impacto temporal exacto de cada decisión, sin quitarle jamás el control al usuario.
4. **Acciones guiadas y preparadas (como con Wallbit)**, donde el agente automatiza la parte tediosa (como proteger ahorros convirtiéndolos a divisas estables) pero siempre requiere la confirmación humana final.

---

## ✨ Características Principales

* 🎯 **Definición y Estructuración de Metas:** El agente comprende el objetivo del usuario, investiga de manera autónoma el precio actual en el mercado, evalúa el tipo de cambio, el contexto económico y la inflación vigente para diseñar un plan a medida.
* ⚡ **Microahorros Automatizados:** En lugar de exigir cuotas mensuales elevadas y difíciles de cumplir, propone sistemas sutiles como separar montos diarios, guardar el vuelto de compras cotidianas o apartar un porcentaje menor tras recibir ingresos.
* 🛡️ **Guardrails Predictivos de Comportamiento:** Si el usuario intenta retirar fondos reservados de su meta, el agente calcula y comunica de forma asertiva el retraso exacto que esto provocará en su cronograma, fomentando la reflexión consciente.
* 🔄 **Monitoreo Continuo de Mercado:** Revisa periódicamente precios, noticias financieras e indicadores macroeconómicos para notificar al usuario si el producto deseado disminuyó de precio o si existe una oportunidad de optimización.
* 🌐 **Protección Patrimonial Integrada:** Detecta cuándo es conveniente blindar el poder adquisitivo de los ahorros y prepara operaciones de conversión (por ejemplo, a USD a través de Wallbit) listas para que el usuario solo tenga que dar un toque de aprobación.
* 🔊 **Resúmenes por Voz y Alertas Dinámicas:** Envía notificaciones fluidas, recordatorios y reportes de progreso adaptados para canalizarse de forma óptima a través de plataformas de mensajería como Telegram y síntesis de voz mediante ElevenLabs.

---

## 🛠️ Arquitectura y Stack Tecnológico

El ecosistema de servicios que da vida a **Finora Agent** integra APIs de última generación especializadas en inteligencia artificial, extracción de datos y gestión financiera:

* **Cerebro Conversacional y Razonamiento:** `OpenAI (LLM)` <!-- TODO: Specify model version, e.g., GPT-4o -->
* **Extracción de Datos y Precios de Mercado:** `Firecrawl` (Para rastrear precios reales de productos en la web)
* **Contexto Económico y Análisis:** `Exa` (Para la búsqueda avanzada de variables macroeconómicas)
* **Gestión Patrimonial y Divisas:** `Wallbit` (Para consultar patrimonio y preparar operaciones de protección de ahorro)
* **Canal de Notificaciones y Alertas:** `Zavu` (Para automatizar el envío de recordatorios y seguimiento, principalmente vía Telegram)
* **Generación de Audio y Resúmenes:** `ElevenLabs` (Para sintetizar resúmenes financieros por voz)
* **Base de Datos y Persistencia:** `Supabase` (Para almacenar de manera segura metas de usuarios, progreso e historial de transacciones)

---

## 🚀 Flujo Completo de Funcionamiento

El ciclo de vida de una interacción típica dentro del sistema sigue estos pasos:

1. **Definición de Meta:** 
   * *Usuario:* "Quiero comprar una MacBook."
2. **Investigación Autónoma:** 
   * *Finora Agent:* Consulta precio actual, tipo de cambio oficial/paralelo, inflación y contexto del mercado mediante Firecrawl y Exa.
3. **Construcción del Plan Financiero:** 
   * *Finora Agent:* Estructura la meta (Ejemplo: Meta: MacBook | Precio: 8,500 Bs | Plazo: 10 meses | Cuota base estimada: 850 Bs/mes).
4. **Ejecución de Microahorros:** 
   * *Ejemplo 1:* Al recibir el sueldo, el agente detecta un margen y sugiere: *"Detecté que puedes separar 200 Bs sin afectar tus gastos habituales. ¿Deseas agregarlos a tu meta?"*
   * *Ejemplo 2:* Al gastar menos de lo previsto en transporte, sugiere: *"Puedes mover esos 15 Bs al fondo de tu laptop."*
5. **Aplicación de Guardrails:** 
   * Si se intenta retirar dinero del fondo: *"Esa decisión retrasará tu objetivo aproximadamente dos meses. ¿Deseas continuar?"* (Información sin bloqueos arbitrarios).
6. **Optimización con Wallbit:** 
   * Cuando el contexto cambiario lo amerita: *"Recomiendo convertir 300 Bs a USD para proteger tu poder de compra. ¿Preparar operación?"* (El usuario confirma con un clic).

---

## 📋 Prerrequisitos del Sistema

Asegúrate de contar con los siguientes elementos en tu entorno de desarrollo antes de ejecutar el proyecto:
* **Node.js** (versión $\ge 18.x$ recomendada)
* **npm**, **pnpm** o **yarn** como gestor de paquetes
* **Git** para el control de versiones
* Credenciales de acceso (API Keys) para cada uno de los servicios integrados (OpenAI, Firecrawl, Exa, Wallbit, Zavu, ElevenLabs y Supabase).

---

## ⚙️ Guía de Instalación y Puesta en Marcha

Sigue estos pasos para desplegar el entorno de desarrollo local:

```bash
# 1. Clonar el repositorio oficial del proyecto
git clone [https://github.com/](https://github.com/)[your-username]/finora-agent.git

# 2. Navegar hacia el directorio del proyecto
cd finora-agent

# 3. Instalar todas las dependencias necesarias
npm install

# 4. Configurar las variables de entorno utilizando la plantilla base
cp .env.example .env

# 5. Rellenar las claves y configuraciones correspondientes en el archivo .env creado
# EDITOR .env

# 6. Iniciar el servidor de desarrollo del agente
npm run dev
