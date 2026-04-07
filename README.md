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
├── CLAUDE.md
└── README.md
```

## Setup

```bash
# Clonar e instalar
git clone <repo-url>
cd macross
pnpm install

# Configurar Supabase
cp .env.example .env
# Completar SUPABASE_URL y SUPABASE_KEY
```

## Comandos

```bash
pnpm dev              # Ambas apps en paralelo
pnpm dev:trainer      # Solo el dashboard
pnpm dev:client       # Solo la PWA
pnpm build            # Build de producción
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
- Dashboard con perfil del usuario logueado
- CRUDL de ejercicios (listado paginado server-side, crear)
- Componentes base reutilizables (BaseTable, BasePagination, BaseFilters)
- Filtros sincronizados con URL query params
- Permisos por rol (manager vs trainer) en UI

### Shared

- Schemas Zod compartidos (ejercicios, auth, query params)
- Tipos e interfaces (`BaseResponse<T>`, `Pagination`, `ApiError`)

## Estado

En desarrollo — MVP en progreso.

## Autor

Francisco Racciatti
