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
| Validación | Zod + T3 Env (env vars con `env.ts`)    |
| i18n       | `@nuxtjs/i18n` (es/en, ambas apps)      |
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
- Flow de set-password para nuevos trainers vía link de invite por mail (robusto ante sesiones previas activas en el browser)
- Flow de recuperación de contraseña (forgot-password → mail → reset-password) que empieza y termina en el dashboard del trainer, reutilizando el mismo procesamiento manual del hash que set-password
- Estados de loading en todos los botones de submit y en el modal de confirmación de borrado (spinner + bloqueo de doble click)
- Dashboard con perfil del usuario logueado
- CRUDL completo de ejercicios (listado paginado, crear, detalle con video embed, editar, soft delete con confirmación). El listado filtra por grupo muscular y equipamiento, ambos multi-select (OR dentro de cada faceta, AND entre facetas), con los filtros sincronizados a la URL como arrays
- CRUDL completo de grupos musculares, asociados a ejercicios vía relación many-to-many (un ejercicio puede tener varios grupos musculares)
- CRUDL completo de equipamiento (catálogo compartido), asociado a ejercicios vía FK simple (un ejercicio tiene un equipamiento). Al eliminar un equipamiento se desasigna de los ejercicios que lo usaban
- CRUDL completo de entrenadores: alta por invitación (`inviteUserByEmail`), listado con filtros por rol, detalle, edición y soft delete. Solo los managers pueden invitar, editar o eliminar; los managers no pueden ser eliminados.
- CRUDL completo de clientes: alta por invitación (mail con set-password en la PWA del cliente), listado con scoping por rol (el trainer ve solo los suyos; el manager, todos con filtro por entrenador), detalle, edición y soft delete. Tanto managers como trainers gestionan clientes. El detalle del entrenador muestra su contador de clientes y un deep-link al listado pre-filtrado.
- Reactivación de clientes eliminados: el listado tiene un filtro de estado (activos / eliminados / todos, default activos) y una columna de estado como badge derivada del soft delete; los clientes eliminados se pueden reactivar (mismo scoping por rol que el borrado). Reinvitar el email de un cliente eliminado devuelve un mensaje claro sugiriendo reactivarlo (en vez del error crudo de Supabase).
- Datos de entrenamiento del cliente: fecha de nacimiento (edad calculada con date-fns), peso, altura, nivel, frecuencia semanal, objetivos (multivaluados), anamnesis (lesiones/restricciones) y equipamiento disponible. Cargables ya en el alta o en edición; enums validados en Zod. Notas de seguimiento del entrenador sobre el cliente (solo en edición).
- Componentes base reutilizables (BaseTable, BasePagination, BaseFilters)
- Filtros sincronizados con URL query params
- Permisos por rol (manager vs trainer) en UI
- Interfaz bilingüe español/inglés con selector de idioma (banderas) que persiste la elección; sin prefijo de idioma en la URL. Incluye los mensajes de validación de los formularios (i18n nativa de Zod v4) y fechas localizadas. El idioma se detecta del browser en la primera visita

### Client app

- Autenticación (login/logout) con Supabase Auth + toasts, middlewares `auth` / `guest`, layouts `auth` (centrado) y `default` (mobile-first con header + logout), home placeholder con email del usuario logueado
- Flow de set-password para clientes nuevos vía link de invite por mail (mismo patrón robusto que trainer: `detectSessionInUrl: false` + procesamiento manual del hash), con card branded en la paleta Macross
- Flow de recuperación de contraseña análogo (forgot-password → mail → reset-password) que empieza y termina en la PWA del cliente
- Bloqueo de login para cuentas desactivadas: un cliente con soft delete no puede iniciar sesión (el server route lo detecta tras el signin y cierra la sesión con un mensaje claro)
- Interfaz bilingüe español/inglés con selector de idioma (banderas), mismo patrón que el dashboard
- Listo para deploy como demo

### Shared

- Schemas Zod compartidos (ejercicios, grupos musculares, equipamiento, entrenadores, clientes, auth, query params)
- Tipos e interfaces (`BaseResponse<T>`, `Pagination`, `ApiError`)
- Error map de Zod para i18n de los mensajes de validación (override de los comunes + locale nativo de Zod v4 para el resto)
- Tests unitarios de schemas con Vitest (`createExerciseSchema`, `exerciseQueryParamsSchema`, `createEquipmentSchema`, `equipmentQueryParamsSchema`, `createMuscleGroupSchema`, `muscleGroupQueryParamsSchema`, `queryParamsSchema`, `createTrainerSchema`, `updateTrainerSchema`, `trainerQueryParamsSchema`, `createClientSchema`, `updateClientSchema`, `clientQueryParamsSchema`, `loginSchema`, `setPasswordSchema`, `requestPasswordResetSchema`)

## Estado

En desarrollo — MVP en progreso.

## Autor

Francisco Racciatti
