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
- **Git hooks**: Husky + lint-staged

## Arquitectura

### Dos apps, una base de datos

- `apps/trainer`: Dashboard desktop-first para el entrenador (Seba Censi). CRUD de clientes, ejercicios con video, rutinas por fases/semanas, seguimiento de progreso.
- `apps/client`: PWA mobile-first para los clientes del entrenador. Ver rutina del día, ver videos, registrar pesos por serie, timer de descanso.
- Ambas consumen la misma instancia de Supabase.

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

- No usamos Pinia actualmente (bug de compatibilidad con Nuxt 4).
- El estado del servidor se maneja con `useFetch`/`useAsyncData` (cache built-in de Nuxt).
- El usuario logueado viene de `useSupabaseUser()`.
- Si se necesita state global en el futuro, agregar `@pinia/nuxt` en versión estable.

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

## Supabase

- Auth: email/password para entrenador y clientes.
- RLS: cada cliente solo ve sus datos. El entrenador ve los datos de todos sus clientes.
- Storage: videos de ejercicios (links de YouTube por ahora, Supabase Storage a futuro).
- El schema de la DB todavía no está definido. Se modelará después de la reunión con Seba.

## Comandos

```bash
pnpm dev              # Levanta ambas apps
pnpm dev:trainer      # Solo trainer
pnpm dev:client       # Solo client
pnpm build            # Build de producción
pnpm lint             # Oxlint
pnpm lint:fix         # Oxlint con autofix
pnpm format           # Oxfmt write
pnpm format:check     # Oxfmt check
pnpm check            # Lint + format check
```
