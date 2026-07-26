# Finora Agent — Frontend

Frontend construido con **React + TypeScript + Vite + TailwindCSS**, migrado 1:1 desde el prototipo visual de Stitch ubicado en `prototipo_finora/`, y preparado para integrarse con el Backend + Agente IA (FastAPI) que desarrolla el resto del equipo.

## Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3 (design tokens tomados de `prototipo_finora/finora_agent_design_system/DESIGN.md`)
- React Router 6 (navegación y protección de rutas autenticadas)
- Capa de servicios propia (`fetch`, sin axios) con modo mock desacoplable

## Cómo correr el proyecto

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

Otros scripts útiles:

```bash
npm run build     # tsc -b && vite build
npm run lint       # eslint .
npm run preview    # sirve el build de producción
```

## Variables de entorno

Copia `.env.example` a `.env` (ya existe un `.env` de ejemplo para desarrollo local) y ajusta:

| Variable | Descripción | Default |
|---|---|---|
| `VITE_API_URL` | URL base de la API del Backend + Agente IA (FastAPI). | `http://localhost:8000` |
| `VITE_USE_MOCKS` | `true` corre la app 100% contra el mock layer en memoria (`src/mocks`), sin backend. `false` consume la API real. | `true` |

Cambiar de mock a real es **solo cambiar `VITE_USE_MOCKS=false`**; ningún componente necesita tocarse (ver `services/`).

## Arquitectura

```
src/
├── components/
│   ├── common/       # Button, Spinner, EmptyState, ErrorState, AsyncSection, GlassCard...
│   ├── layout/        # Sidebar y TopBar del shell autenticado
│   ├── landing/        # Secciones de la Landing
│   ├── dashboard/      # Tarjetas del Dashboard (metas, progreso, actividad, recomendaciones)
│   ├── agent/          # Chat, tarjetas de acción embebidas, panel de mercado
│   ├── onboarding/     # Choice cards, formulario de meta y resumen de plan
│   ├── settings/       # Secciones de Configuración (perfil, seguridad, Telegram, alertas)
│   ├── auth/           # RequireAuth (guard de rutas privadas)
│   └── modals/         # ActionConfirmationModal (confirmación de acciones del agente)
├── layouts/            # AuthLayout (Login/Registro) y AppShellLayout (Dashboard/Agente/Config)
├── pages/              # Una página por ruta
├── context/            # AuthContext (sesión, login/registro/verificación/logout)
├── hooks/              # useGoals, useTransactions, useRecommendations, useAgentChat, useTelegramLink, useAsync
├── services/           # Capa de acceso a la API — única puerta de entrada al backend
│   ├── config.ts        # Lee VITE_API_URL / VITE_USE_MOCKS
│   ├── apiClient.ts      # fetch centralizado, maneja 401 y errores de red
│   ├── auth.service.ts
│   ├── goals.service.ts
│   ├── agent.service.ts
│   ├── transactions.service.ts
│   ├── user.service.ts
│   └── telegram.service.ts
├── mocks/              # Implementación mock de cada servicio + store en memoria (mocks/store.ts)
├── types/              # DTOs/contratos compartidos entre services, mocks y componentes
├── data/               # Solo copy/config de UI estática (chips, categorías, textos) — nunca datos financieros del usuario
└── utils/              # Helpers puros (formatCurrency, cálculo de progreso de metas, clsx)
```

**Regla de oro:** los componentes nunca llaman `fetch` directamente ni conocen si están en modo mock o real. Siempre pasan por un hook o por una función de `services/`, tipada con las interfaces de `types/`.

## Rutas

| Ruta | Pantalla | Protegida |
|---|---|---|
| `/` | Landing | No |
| `/registro` | Registro | No |
| `/login` | Login | No |
| `/verificacion` | Verificación de correo (OTP) | No (requiere sesión pendiente de verificación) |
| `/onboarding`, `/metas/nueva` | Creación de meta con el agente | Sí |
| `/dashboard` | Dashboard principal | Sí |
| `/agente` | Chat con el agente IA | Sí |
| `/configuracion` | Configuración | Sí |

El flujo de navegación es: Landing → Registro/Login → Verificación de correo → (usuario nuevo) Onboarding → Dashboard ⇄ Agente IA ⇄ Configuración.

## Estado de la integración con backend

- Todos los datos financieros (metas, transacciones, recomendaciones, chat, perfil, Telegram) se leen de `services/`, nunca están escritos en componentes.
- Los contratos de cada endpoint están documentados como `PENDING VALIDATION WITH BACKEND` en los propios archivos de `services/` y `types/` — deben confirmarse con el equipo de Backend antes de la integración final.
- Sesión: se asume cookie `httpOnly` gestionada por el backend (`credentials: 'include'` en `apiClient`); no se usa `localStorage`. Ver comentario en `context/AuthContext.tsx` si el equipo de Backend decide usar un bearer token en su lugar.
