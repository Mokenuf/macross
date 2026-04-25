# Macross

Plataforma digital para entrenadores personales. Gestión de clientes, ejercicios con video, rutinas por fases, y seguimiento de progreso — todo bajo la marca del entrenador.

## Qué es

Dos aplicaciones en un mismo monorepo:

- **Trainer** — Dashboard web (desktop-first) para el entrenador. CRUD de clientes, biblioteca de ejercicios con video, armado de rutinas por fases y semanas, y seguimiento del progreso de cada alumno.
- **Client** — PWA (mobile-first) para los clientes. Ver la rutina del día, ver videos de cada ejercicio, registrar pesos por serie, timer de descanso, y notas del entrenador.

## Stack

| Capa       | Tecnología                              |
| ---------- | --------------------------------------- |
| Monorepo   | TurboRepo + pnpm workspaces             |
| Frontend   | Nuxt 4 × 2 apps                         |
| UI         | NuxtUI v4                               |
| Backend    | Supabase (Postgres, Auth, Storage, RLS) |
| Validación | Zod                                     |
| Testing    | Vitest                                  |
| Linter     | Oxlint                                  |
| Formatter  | Oxfmt                                   |
| Git hooks  | Husky + lint-staged + Commitizen        |

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
# y NUXT_SUPABASE_SECRET_KEY + NUXT_TRAINER_APP_URL (solo trainer)
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
pnpm lint             # Oxlint
pnpm lint:fix         # Oxlint con autofix
pnpm format           # Oxfmt (write)
pnpm format:check     # Oxfmt (check)
pnpm check            # Lint + format check
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

- Autenticación (login/logout) con Supabase Auth + toasts de feedback
- Flow de set-password para nuevos trainers vía link de invite por mail
- Dashboard con perfil del usuario logueado
- CRUDL completo de ejercicios (listado paginado, crear, detalle con video embed, editar, soft delete con confirmación)
- CRUDL completo de grupos musculares, asociados a ejercicios vía relación many-to-many (un ejercicio puede tener varios grupos musculares)
- CRUDL completo de entrenadores: alta por invitación (`inviteUserByEmail`), listado con filtros por rol, detalle, edición y soft delete. Solo los managers pueden invitar, editar o eliminar; los managers no pueden ser eliminados.
- Componentes base reutilizables (BaseTable, BasePagination, BaseFilters)
- Filtros sincronizados con URL query params
- Permisos por rol (manager vs trainer) en UI

### Client app

- Scaffolding inicial: autenticación (login/logout) con Supabase Auth + toasts, middlewares `auth` / `guest`, layouts `auth` (centrado) y `default` (mobile-first con header + logout), home placeholder con email del usuario logueado
- Listo para deploy como demo

### Shared

- Schemas Zod compartidos (ejercicios, grupos musculares, entrenadores, auth, query params)
- Tipos e interfaces (`BaseResponse<T>`, `Pagination`, `ApiError`)
- Tests unitarios de schemas con Vitest (`createExerciseSchema`, `exerciseQueryParamsSchema`, `createMuscleGroupSchema`, `muscleGroupQueryParamsSchema`, `queryParamsSchema`, `createTrainerSchema`, `updateTrainerSchema`, `trainerQueryParamsSchema`)

## Estado

En desarrollo — MVP en progreso.

## Autor

Francisco Racciatti
