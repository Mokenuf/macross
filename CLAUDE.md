# Macross for Progress

Plataforma digital para entrenadores personales. El entrenador gestiona clientes, ejercicios y rutinas desde un dashboard web. Sus clientes ven su rutina, videos de ejercicios y registran pesos/series desde una PWA mobile.

## Stack

- **Monorepo**: TurboRepo + pnpm workspaces
- **Apps**: 2x Nuxt 4 (`apps/trainer` y `apps/client`)
- **UI**: NuxtUI v3
- **Backend**: Supabase (DB Postgres, Auth, Storage, RLS, Realtime)
- **Acceso a datos**: `@nuxtjs/supabase` → `useSupabaseClient()` directo, sin ORM
- **Validación**: Zod
- **Fetching**: `useFetch` / `useAsyncData` de Nuxt
- **Formatter**: Oxfmt
- **Linter**: Oxlint
- **Git hooks**: Husky + lint-staged + Commitizen

## Arquitectura

### Dos apps, una base de datos

- `apps/trainer`: Dashboard desktop-first para el entrenador (Seba Censi). CRUD de clientes, ejercicios con video, rutinas por fases/semanas, seguimiento de progreso.
- `apps/client`: PWA mobile-first para los clientes del entrenador. Ver rutina del día, ver videos, registrar pesos por serie, timer de descanso.
- Ambas consumen la misma instancia de Supabase.
- Cada app tiene su propio `.env` en su carpeta (no en la raíz). TurboRepo recomienda `.env` por app.

### Server routes como wrapper de Supabase

No se usa `useSupabaseClient()` directo desde los componentes Vue para mutaciones. El patrón es:

```
app/pages o app/components → useFetch('/api/...') → server/api/... → supabaseClient
```

- Los componentes Vue llaman a server routes vía `useFetch`.
- Las server routes en `server/api/` usan el Supabase server client para queries/mutaciones.
- Esto centraliza la lógica, facilita validación con Zod, y no expone el client en el frontend.
- Para reads simples en componentes (ej: cargar lista), `useSupabaseClient()` directo es aceptable.

### Validación con Zod

- Todos los inputs de formularios se validan con Zod.
- Los schemas se definen en `app/types/` o en `packages/shared/` si se comparten.
- Las server routes validan el body con Zod antes de tocar Supabase.

### State management

- No usamos Pinia actualmente (bug de compatibilidad con Nuxt 4 en v0.11.3).
- El estado del servidor se maneja con `useFetch`/`useAsyncData` (cache built-in de Nuxt).
- El usuario logueado viene de `useSupabaseUser()`.
- Si se necesita state global en el futuro, agregar `@pinia/nuxt` en versión estable.

## Base de datos (Supabase)

### Supabase project

- Project name: macross
- Region: Americas
- URL: https://zxztpzsavoqykbbokget.supabase.co
- RLS habilitado en todas las tablas

### Schema

7 tablas. Todas tienen `created_at`, `updated_at` y `deleted_at` (soft delete).

#### trainers

Staff de Macross. Se vincula 1:1 con `auth.users`.

- `id` uuid PK (= auth.users.id)
- `full_name` text not null
- `email` text not null unique
- `role` text not null ('manager' | 'trainer')
- `avatar_url` text
- `phone` text
- `nano_id` text unique (para URLs del admin)
- Timestamps

#### clients

Clientes asignados a un trainer. Se vincula 1:1 con `auth.users`.

- `id` uuid PK (= auth.users.id)
- `trainer_id` uuid FK → trainers
- `full_name` text not null
- `email` text not null unique
- `phone` text
- `avatar_url` text
- `nano_id` text unique
- Timestamps (con `deleted_at` para soft delete en vez de boolean `active`)

#### exercises

Biblioteca de ejercicios del entrenador.

- `id` uuid PK (gen_random_uuid)
- `trainer_id` uuid FK → trainers
- `name` text not null
- `description` text
- `video_url` text (link de YouTube)
- `muscle_group` text
- `slug` text unique (para URLs de la PWA: `/exercises/box-squat`)
- `nano_id` text unique
- Timestamps

#### routines

Rutinas asignadas a un cliente por un trainer.

- `id` uuid PK (gen_random_uuid)
- `trainer_id` uuid FK → trainers
- `client_id` uuid FK → clients
- `name` text not null
- `slug` text unique
- `days_per_week` int not null
- `weeks` int not null
- `notes` text
- `active` boolean default true (estado de negocio, no soft delete)
- `nano_id` text unique
- Timestamps

#### routine_days

Días dentro de una rutina.

- `id` uuid PK (gen_random_uuid)
- `routine_id` uuid FK → routines
- `day_number` int not null (1-7)
- `label` text (ej: "Pecho / Hombro / Tríceps")
- `nano_id` text unique
- Timestamps

#### routine_exercises

Tabla pivot: conecta un día con un ejercicio y su configuración.

- `id` uuid PK (gen_random_uuid)
- `routine_day_id` uuid FK → routine_days
- `exercise_id` uuid FK → exercises
- `sort_order` int not null
- `sets` int not null
- `reps` text not null (puede ser "12 + 20", "6-8", "15 12 10")
- `rest_seconds` text
- `notes` text
- `optional` boolean default false
- `unique(routine_day_id, sort_order)` — no puede haber dos ejercicios en la misma posición del mismo día
- Timestamps

#### workout_logs

Registro de pesos y series del cliente. Única tabla donde el cliente escribe.

- `id` uuid PK (gen_random_uuid)
- `routine_exercise_id` uuid FK → routine_exercises
- `client_id` uuid FK → clients
- `set_number` int not null (1-20)
- `weight_kg` numeric(6,2)
- `actual_reps` int
- `completed` boolean default false
- `logged_at` timestamptz (cuándo entrenó, distinto de created_at)
- Timestamps

### IDs y URLs

- **UUID** como primary key en todas las tablas (seguridad, no predecible, compatible con Supabase Auth).
- **nano_id** (12 chars, generado por Postgres) en tablas que aparecen en URLs del admin. Ej: `/exercises/xK9m2pLq/edit`.
- **slug** en `exercises` y `routines` para URLs legibles en la PWA del cliente. Ej: `/exercises/box-squat`.
- El slug se genera desde el código a partir del nombre del ejercicio/rutina.

### Roles y permisos (RLS)

Dos roles de staff: `manager` y `trainer`.

| Acción             | Manager            | Trainer           | Cliente             |
| ------------------ | ------------------ | ----------------- | ------------------- |
| CRUD ejercicios    | Sí                 | Solo lectura      | Solo sus rutinas    |
| CRUD clientes      | Sí                 | No                | Solo su perfil      |
| Crear rutinas      | Sí                 | Sí                | No                  |
| Asignar rutinas    | Sí (a cualquiera)  | Solo sus clientes | No                  |
| Ver progreso       | Todos los clientes | Solo sus clientes | Solo el suyo        |
| Registrar pesos    | No                 | No                | Sí (solo los suyos) |
| Gestionar trainers | Sí                 | No                | No                  |

### Función helper

`get_user_role()` — devuelve 'trainer' o 'client' basado en `auth.uid()`. Usada internamente por las policies.

`generate_nanoid(size)` — genera un nanoid de N caracteres (default 12) con alfabeto URL-safe. Usada como default en columnas `nano_id`.

## Estructura de carpetas

```
macross-for-progress/
├── apps/
│   ├── trainer/              # Dashboard del entrenador
│   │   ├── app/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── composables/
│   │   │   ├── layouts/
│   │   │   └── types/        # Zod schemas + tipos
│   │   ├── server/
│   │   │   ├── api/          # Server routes (wrappers de Supabase)
│   │   │   └── utils/        # Supabase server client, helpers
│   │   ├── .env              # SUPABASE_URL + SUPABASE_KEY (no commitear)
│   │   └── nuxt.config.ts
│   └── client/               # PWA del cliente
│       ├── app/
│       │   ├── pages/
│       │   ├── components/
│       │   ├── composables/
│       │   ├── layouts/
│       │   └── types/
│       ├── server/
│       │   ├── api/
│       │   └── utils/
│       ├── .env
│       └── nuxt.config.ts
├── packages/
│   └── shared/               # Tipos y schemas compartidos
├── .oxlintrc.json
├── .oxfmtrc.json
├── turbo.json
├── pnpm-workspace.yaml
└── CLAUDE.md
```

## Convenciones de código

- TypeScript estricto. No `any` salvo casos justificados.
- Single quotes, sin semicolons, trailing commas (configurado en Oxfmt).
- Composables prefijados con `use` (ej: `useRoutine`, `useExercises`).
- Server routes siguen la convención de Nuxt: `server/api/[recurso].get.ts`, `server/api/[recurso].post.ts`.
- Nombres de archivos en kebab-case.
- Componentes Vue en PascalCase.
- Soft delete en todas las tablas: filtrar siempre con `deleted_at is null`.
- Ordenar por `created_at` cuando se necesite orden de creación.

## Supabase config en Nuxt

```ts
// nuxt.config.ts (ambas apps)
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxtjs/supabase'],
  supabase: {
    redirect: false, // manejamos auth manualmente
  },
})
```

Variables de entorno (en `.env` de cada app, NO en la raíz):

```
NUXT_PUBLIC_SUPABASE_URL=https://zxztpzsavoqykbbokget.supabase.co
NUXT_PUBLIC_SUPABASE_KEY=sb_publishable_...
```

## Comandos

```bash
pnpm dev              # Ambas apps en paralelo
pnpm dev:trainer      # Solo trainer
pnpm dev:client       # Solo client
pnpm build            # Build de producción
pnpm lint             # Oxlint
pnpm lint:fix         # Oxlint con autofix
pnpm format           # Oxfmt write
pnpm format:check     # Oxfmt check
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
- Commits con Conventional Commits vía Commitizen
