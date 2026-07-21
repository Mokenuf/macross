# Macros for Progress

Plataforma digital para entrenadores personales. Gestión de clientes, ejercicios con video, rutinas por fases, y seguimiento de progreso — todo bajo la marca del entrenador.

## Qué es

Dos aplicaciones en un mismo monorepo:

- **Trainer** — Dashboard web (desktop-first) para el entrenador. CRUD de clientes, biblioteca de ejercicios con video, armado de rutinas por fases y semanas, y seguimiento del progreso de cada alumno.
- **Client** — PWA (mobile-first) para los clientes, instalable desde el navegador como una app más del teléfono. Ver la rutina del día, ver videos de cada ejercicio, registrar pesos por serie, timer de descanso, y notas del entrenador.

## Stack

| Capa       | Tecnología                              |
| ---------- | --------------------------------------- |
| Monorepo   | TurboRepo + pnpm workspaces             |
| Frontend   | Nuxt 4 × 2 apps                         |
| UI         | NuxtUI v4                               |
| Backend    | Supabase (Postgres, Auth, Storage, RLS) |
| Validación | Zod + T3 Env (env vars con `env.ts`)    |
| i18n       | `@nuxtjs/i18n` (es/en, ambas apps)      |
| PWA        | `@vite-pwa/nuxt` (solo la app cliente)  |
| Testing    | Vitest                                  |
| Linter     | Oxlint                                  |
| Formatter  | Oxfmt                                   |
| Git hooks  | Husky + lint-staged + Commitizen        |
| CI         | GitHub Actions                          |

## Estructura

```
macross-for-progress/
├── apps/
│   ├── trainer/          # Dashboard del entrenador
│   │   ├── app/          # Pages, components, composables, types
│   │   └── server/       # API routes (wrappers de Supabase)
│   └── client/           # PWA del cliente
│       ├── app/
│       └── server/
├── packages/
│   └── shared/           # Tipos y schemas compartidos
├── supabase/
│   └── email-templates/  # Copias versionadas de los templates de Supabase Auth
├── .oxlintrc.json
├── .oxfmtrc.json
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

## Setup

```bash
# Clonar e instalar
git clone <repo-url>
cd macross
pnpm install

# Configurar Supabase (un .env por app)
cp apps/trainer/.env.example apps/trainer/.env
cp apps/client/.env.example apps/client/.env
# Completar SUPABASE_URL, SUPABASE_KEY (ambas apps)
# trainer: + SUPABASE_SECRET_KEY, NUXT_TRAINER_APP_URL, NUXT_CLIENT_APP_URL (invites)
# client:  + NUXT_CLIENT_APP_URL (redirectTo del recovery a la propia app)
```

## Comandos

```bash
pnpm dev              # Ambas apps en paralelo
pnpm dev:trainer      # Solo el dashboard
pnpm dev:client       # Solo la PWA
pnpm build            # Build de producción
pnpm test             # Todos los tests (via Turbo)
pnpm test:shared      # Tests de packages/shared (watch)
pnpm test:trainer     # Tests de apps/trainer (watch)
pnpm test:client      # Tests de apps/client (watch)
pnpm db:generate      # Regenera los tipos de Supabase tras una migración
pnpm lint             # Oxlint
pnpm lint:fix         # Oxlint con autofix
pnpm typecheck        # Type-check (vue-tsc en apps, tsc en shared) vía Turbo
pnpm format           # Oxfmt (write)
pnpm format:check     # Oxfmt (check)
pnpm check            # Lint + format check + typecheck
pnpm commit           # Commit con Commitizen
```

## Branching

```
feat/trainer/dashboard  ─┐
feat/client/profile     ─┤── PR → development ── PR → main
fix/trainer/auth        ─┘
```

- `main` — producción
- `development` — rama default, integración
- Features y fixes salen de `development` con el formato `tipo/app/descripcion`

## Features implementadas

### Trainer app

- Autenticación completa: login/logout, alta por invitación por mail (set-password), y recuperación de contraseña
- Biblioteca de ejercicios con video, grupos musculares y equipamiento (catálogo compartido), con búsqueda y filtros combinables
- Gestión de clientes: alta por invitación, ficha con datos de entrenamiento y notas de seguimiento, scoping por rol (el trainer ve los suyos; el manager, todos), soft delete y reactivación
- Rutinas ("fases"): armado por wizard, asignación a un cliente con activación (una activa por cliente), detalle del árbol completo y edición
- Gestión de entrenadores con roles (manager / trainer), restringida a managers
- Permisos por rol, filtros sincronizados con la URL e interfaz bilingüe es/en (incluye validaciones y contenido de catálogo)

### Client app

- PWA instalable con identidad de marca propia (paleta cálida, navegación mobile) y splash de arranque
- Autenticación completa: login/logout, set-password por invitación, recuperación y cambio de contraseña; login bloqueado para cuentas desactivadas
- Planificación activa en solo lectura: días, ejercicios con series/reps de la semana y video de cada ejercicio (el registro de pesos/series llega en una etapa posterior)
- Perfil del cliente con sus datos de entrenamiento y sección de cuenta (contraseña, idioma, cerrar sesión)
- Interfaz bilingüe es/en, mismo patrón que el dashboard

### Shared

- Schemas Zod y tipos compartidos entre las dos apps (recursos, auth, respuestas paginadas)
- i18n de los mensajes de validación (sobre Zod v4)
- Tests unitarios de los schemas con Vitest

## Estado

En desarrollo — MVP en progreso.

## Autor

Francisco Racciatti
