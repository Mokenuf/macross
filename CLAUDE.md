# Macross for Progress

Plataforma digital para entrenadores personales. El entrenador gestiona clientes, ejercicios y rutinas desde un dashboard web. Sus clientes ven su rutina, videos de ejercicios y registran pesos/series desde una PWA mobile.

## Stack

- **Monorepo**: TurboRepo + pnpm workspaces
- **Apps**: 2x Nuxt 4 (`apps/trainer` y `apps/client`)
- **UI**: NuxtUI v4 (incluye los componentes Pro, todo gratis post-adquisición Vercel)
- **Backend**: Supabase (DB Postgres, Auth, Storage, RLS, Realtime)
- **Acceso a datos**: `@nuxtjs/supabase` → `useSupabaseClient()` en client, `serverSupabaseClient()` en server
- **Validación**: Zod (schemas compartidos en `packages/shared`)
- **Fetching**: `useFetch` / `useAsyncData` para queries, `$fetch` para acciones puntuales
- **Formatter**: Oxfmt (format on save con extensión OXC en VS Code/Cursor)
- **Linter**: Oxlint
- **Git hooks**: Husky + lint-staged + Commitizen

## Arquitectura

### Dos apps, una base de datos

- `apps/trainer`: Dashboard desktop-first para el entrenador (Seba Censi). CRUD de clientes, ejercicios con video, rutinas por fases/semanas, seguimiento de progreso.
- `apps/client`: PWA mobile-first para los clientes del entrenador. Ver rutina del día, ver videos, registrar pesos por serie, timer de descanso.
- Ambas consumen la misma instancia de Supabase.
- Cada app tiene su propio `.env` en su carpeta (no en la raíz). TurboRepo recomienda `.env` por app.

### Server routes como wrapper de Supabase

El patrón general es:

```
app/pages o app/components → useFetch('/api/...') → server/api/... → serverSupabaseClient
```

- Los componentes Vue llaman a server routes vía `useFetch` (queries) o `$fetch` (acciones).
- Las server routes en `server/api/` usan `serverSupabaseClient(event)` del módulo `#supabase/server`.
- Las server routes validan el body con `readValidatedBody(event, schema.parse)` usando schemas de Zod.
- Para reads simples en componentes, `useSupabaseClient()` directo es aceptable.
- **Excepción**: el login usa `useSupabaseClient()` en el client side porque Supabase Auth necesita setear cookies en el browser.

### Composables

Los composables van directo en `composables/`, sin subcarpeta `services/`. Nuxt los auto-importa.

```
composables/
├── auth.ts          # useAuth: login, logout
├── exercises.ts     # useGetExercises, useCreateExercise... (futuro)
├── clients.ts       # useGetClients... (futuro)
├── routines.ts      # useGetRoutines... (futuro)
└── users.ts         # useGetCurrentUser (futuro)
```

- `useFetch` para queries que necesitan cache y reactividad (data en template).
- `$fetch` para acciones puntuales sin cache (login, logout, create, update, delete).
- No usamos Pinia. El estado del servidor se maneja con `useFetch`/`useAsyncData` (cache built-in de Nuxt).
- Estado de UI (filtros, preferencias) se resuelve cuando lo necesitemos, probablemente con Pinia.

### Validación con Zod

- Schemas compartidos viven en `packages/shared/types/`.
- El frontend valida formularios con `UForm :schema="loginSchema"` de NuxtUI (validación automática).
- Las server routes validan con `readValidatedBody(event, schema.parse)` (tira 400 automáticamente si falla).
- Convención de naming:
  - `[entity]Schema` — schema completo
  - `create[Entity]Schema` — `.omit()` de campos generados por backend
  - `update[Entity]Schema` — `.partial().required({ id })`
  - Tipos inferidos: `type Login = z.infer<typeof loginSchema>` (sin sufijo "Input" ni "Data")

### Autenticación

- Login: composable `useAuth().login()` usa `useSupabaseClient().auth.signInWithPassword()` client side para setear cookies, y llama a la server route para validación server side.
- Logout: composable `useAuth().logout()` → `client.auth.signOut()` → `navigateTo('/auth/login', { external: true })`.
- El `{ external: true }` en `navigateTo` es necesario para dar tiempo a que las cookies se refresquen.
- Protección de rutas: `redirect: false` en config + middlewares propios (`auth.ts` y `guest.ts`).
- `useSupabaseUser()` da el usuario logueado reactivo.

### Layouts

- `auth`: layout limpio centrado, sin navbar ni sidebar. Para `/auth/login`, `/auth/signup`.
- `admin`: layout con `UDashboardGroup`, `UDashboardSidebar` (colapsable), `UDashboardPanel`, `UDashboardNavbar`. Para todas las rutas protegidas.
- Las pages definen su layout con `definePageMeta({ layout: 'admin' })`.

### Middlewares

- `auth.ts`: si no hay usuario logueado → redirige a `/auth/login`.
- `guest.ts`: si ya está logueado → redirige a `/`.
- Se asignan en `definePageMeta({ middleware: 'auth' })` o `middleware: 'guest'`.

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

- `id` uuid PK (= auth.users.id, on delete cascade)
- `full_name` text not null
- `email` text not null unique
- `role` text not null check ('manager' | 'trainer')
- `avatar_url` text
- `phone` text
- `nano_id` text unique (generado automáticamente, 12 chars)
- Timestamps

#### clients

Clientes asignados a un trainer. Se vincula 1:1 con `auth.users`.

- `id` uuid PK (= auth.users.id, on delete cascade)
- `trainer_id` uuid FK → trainers (on delete cascade)
- `full_name` text not null
- `email` text not null unique
- `phone` text
- `avatar_url` text
- `nano_id` text unique
- Timestamps (con `deleted_at` para soft delete)

#### exercises

Biblioteca de ejercicios del entrenador.

- `id` uuid PK (gen_random_uuid)
- `trainer_id` uuid FK → trainers (on delete cascade)
- `name` text not null
- `description` text
- `video_url` text (link de YouTube)
- `muscle_group` text
- `slug` text unique (para URLs de la PWA: `/exercises/box-squat`)
- `nano_id` text unique
- Timestamps

#### routines

Rutinas asignadas a un cliente por un trainer.

- `id` uuid PK (gen_random_uuid o hardcodeado)
- `trainer_id` uuid FK → trainers
- `client_id` uuid FK → clients
- `name` text not null
- `slug` text unique
- `days_per_week` int not null
- `weeks` int not null
- `notes` text
- `active` boolean default true (estado de negocio: rutina activa vs completada)
- `nano_id` text unique
- Timestamps

#### routine_days

Días dentro de una rutina.

- `id` uuid PK (gen_random_uuid)
- `routine_id` uuid FK → routines (on delete cascade)
- `day_number` int not null check (1-7)
- `label` text (ej: "Pecho / Hombro / Tríceps")
- `nano_id` text unique
- Timestamps

#### routine_exercises

Tabla pivot: conecta un día con un ejercicio y su configuración.

- `id` uuid PK (gen_random_uuid)
- `routine_day_id` uuid FK → routine_days (on delete cascade)
- `exercise_id` uuid FK → exercises (on delete cascade)
- `sort_order` int not null
- `sets` int not null
- `reps` text not null (puede ser "12 + 20", "6-8", "15 12 10")
- `rest_seconds` text
- `notes` text
- `optional` boolean default false
- `unique(routine_day_id, sort_order)` — no duplicados de orden en el mismo día
- Timestamps

#### workout_logs

Registro de pesos y series del cliente. Única tabla donde el cliente escribe.

- `id` uuid PK (gen_random_uuid)
- `routine_exercise_id` uuid FK → routine_exercises (on delete cascade)
- `client_id` uuid FK → clients (on delete cascade)
- `set_number` int not null check (1-20)
- `weight_kg` numeric(6,2)
- `actual_reps` int
- `completed` boolean default false
- `logged_at` timestamptz (cuándo entrenó, distinto de created_at)
- Timestamps

### IDs y URLs

- **UUID** como primary key en todas las tablas.
- **nano_id** (12 chars, generado por Postgres con `generate_nanoid()`) en tablas que aparecen en URLs del admin.
- **slug** en `exercises` y `routines` para URLs legibles en la PWA del cliente.
- El slug se genera desde el código a partir del nombre.
- Ordenar por `created_at` cuando se necesite orden de creación (no hay autoincremental).

### Funciones helper en Postgres

- `get_user_role()` → devuelve 'trainer' o 'client' basado en `auth.uid()`. Security definer.
- `generate_nanoid(size)` → genera nanoid de N chars (default 12) con alfabeto URL-safe.

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

### Seed data

- Seba Censi (manager): `4137240f-eace-4203-9288-8149ce71bd3a`
- Fran Racciatti (client): `506cab7a-5ea4-4a02-b8fe-e29fad40dfbc`
- 13 ejercicios cargados con slugs
- 1 rutina "Plani Fran Racciatti x2 días - Fase 1" con 2 días y todos los ejercicios asignados

## Estructura de carpetas

```
macross-for-progress/
├── apps/
│   ├── trainer/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── composables/
│   │   │   │   └── auth.ts
│   │   │   ├── layouts/
│   │   │   │   ├── admin.vue
│   │   │   │   └── auth.vue
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts
│   │   │   │   └── guest.ts
│   │   │   ├── pages/
│   │   │   │   ├── auth/
│   │   │   │   │   └── login.vue
│   │   │   │   └── index.vue
│   │   │   └── types/
│   │   ├── server/
│   │   │   ├── api/
│   │   │   │   └── auth/
│   │   │   │       ├── login.post.ts
│   │   │   │       └── logout.post.ts
│   │   │   └── utils/
│   │   ├── .env
│   │   └── nuxt.config.ts
│   └── client/
│       ├── app/
│       ├── server/
│       ├── .env
│       └── nuxt.config.ts
├── packages/
│   └── shared/
│       ├── types/
│       │   └── auth.ts
│       ├── index.ts
│       └── package.json
├── .husky/
│   └── pre-commit
├── .vscode/
│   └── settings.json
├── .oxlintrc.json
├── .oxfmtrc.json
├── .gitignore
├── .env.example
├── turbo.json
├── pnpm-workspace.yaml
├── CLAUDE.md
└── README.md
```

## Convenciones de código

### General

- TypeScript estricto. No `any` salvo casos justificados.
- Single quotes, sin semicolons, trailing commas (configurado en Oxfmt).
- Nombres de archivos en kebab-case.
- Componentes Vue en PascalCase.
- Soft delete en todas las tablas: filtrar siempre con `deleted_at is null`.

### Script setup — orden

1. Imports de tipos
2. `definePageMeta` / `defineProps` / `defineEmits`
3. Composables y refs reactivos (orden alfabético)
4. Computeds
5. Watchers
6. Funciones (`function` para top-level, arrow para callbacks)
7. Lifecycle hooks (`onMounted`, etc.)
8. Constantes estáticas no reactivas

### Naming

- Composables prefijados con `use` (ej: `useAuth`, `useExercises`)
- Server routes: `server/api/[recurso].get.ts`, `server/api/[recurso].post.ts`
- Schemas Zod: `[entity]Schema`, `create[Entity]Schema`, `update[Entity]Schema`
- Tipos inferidos sin sufijo: `Login`, `Exercise`, `CreateExercise` (no `LoginInput`)
- Componentizar solo cuando se reutilice o la page supere ~100 líneas

## Supabase config en Nuxt

```ts
// nuxt.config.ts (trainer)
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxtjs/supabase'],
  supabase: {
    redirect: false,
  },
})
```

Variables de entorno (en `.env` de cada app):

```
SUPABASE_URL=https://zxztpzsavoqykbbokget.supabase.co
SUPABASE_KEY=sb_publishable_...
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
- Features y fixes salen de `development` con formato `tipo/app/descripcion`
- Commits con Conventional Commits vía Commitizen

## Decisiones pendientes

- Progresión semanal: ¿Seba cambia series/reps entre semanas dentro de la misma rutina? Preguntarle.
- Doble turno: el modelo actual soporta más de un bloque por día usando el `label` de `routine_days`. Si aparece el caso, relajar el check constraint de `day_number`.
- Pinia: agregar cuando se necesite estado de UI global (filtros, preferencias). Usar versión estable compatible con Nuxt 4.
- CI/CD: GitHub Actions con `pnpm lint && pnpm build` como required check en PRs a main.
