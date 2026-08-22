# Macros for Progress

Plataforma digital para entrenadores personales. Gestión de clientes, ejercicios con video, rutinas por fases, y seguimiento de progreso — todo bajo la marca del entrenador.

## Qué es

Dos aplicaciones en un mismo monorepo:

- **Trainer** — Dashboard web (desktop-first) para el entrenador. CRUD de clientes, biblioteca de ejercicios con video, armado de rutinas por fases y semanas, y seguimiento del progreso de cada alumno.
- **Client** — PWA (mobile-first) para los clientes, instalable desde el navegador como una app más del teléfono. Ver la rutina del día, ver videos de cada ejercicio, registrar pesos por serie, timer de descanso, y notas del entrenador. El ciclo completo de una fase: entrenar, registrar y avanzar semana a semana.

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
│   ├── migrations/       # Schema versionado (fuente de verdad de la base)
│   ├── email-templates/  # Copias versionadas de los templates de Supabase Auth
│   ├── scripts/          # Operaciones puntuales sobre un entorno remoto
│   ├── seed.sql          # Cuentas de la base local
│   ├── seed-catalog.sql  # Catálogo compartido (grupos musculares, equipamiento)
│   └── config.toml       # Config del stack local (puertos, auth, SMTP de prueba)
├── .oxlintrc.json
├── .oxfmtrc.json
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

## Setup

El desarrollo corre contra una **base local de Supabase en Docker** (requiere Docker corriendo), con el
schema versionado en `supabase/migrations/`. No hace falta acceso al proyecto de producción.

```bash
# Clonar e instalar
git clone <repo-url>
cd macross
pnpm install

# Levantar la base local (API 54321, DB 54322, Studio 54323, Mailpit 54324)
pnpm db:start
pnpm db:status        # imprime las URLs y las keys que van en los .env

# Configurar un .env por app (los .env.example ya apuntan a la base local)
cp apps/trainer/.env.example apps/trainer/.env
cp apps/client/.env.example apps/client/.env
# Completar SUPABASE_KEY y SUPABASE_SECRET_KEY con lo que imprimió db:status

# Aplicar migraciones + datos de arranque
pnpm db:reset

pnpm dev
```

`pnpm db:reset` deja la base **usable**: crea las cuentas de trabajo (manager, trainer y cliente) con
contraseña conocida, así se puede entrar a las dos apps sin pasos manuales. Las credenciales están en
`supabase/seed.sql` — son de una base local y descartable, producción da de alta por invitación por mail.

Los mails de auth (invitación, recuperación) **no salen a internet** en local: caen en **Mailpit**
(`http://localhost:54324`), donde se pueden abrir y seguir los links.

## Comandos

```bash
pnpm dev              # Ambas apps en paralelo (contra la base local)
pnpm dev:trainer      # Solo el dashboard
pnpm dev:client       # Solo la PWA
pnpm dev:trainer:prod # Dashboard contra producción (solo lectura de datos reales)
pnpm dev:client:prod  # PWA contra producción
pnpm build            # Build de producción
pnpm test             # Todos los tests (via Turbo)
pnpm test:shared      # Tests de packages/shared
pnpm db:start         # Levanta la base local en Docker
pnpm db:stop          # Baja los contenedores
pnpm db:status        # URLs y keys del stack local
pnpm db:reset         # Recrea la base local: migraciones en orden + seed
pnpm db:diff          # Captura en SQL lo tocado a mano en Studio local
pnpm db:push          # Aplica a producción las migraciones que falten
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
- Rutinas ("fases"): armado por wizard con progresión semana a semana, agrupación de ejercicios en superseries y dropsets, reordenar bloques y ejercicios (arrastrando o con flechas), duplicar días, activación por cliente (una activa a la vez) y edición del árbol completo
- Editar una fase en curso preserva lo ya entrenado: las series registradas quedan bloqueadas, los cambios aplican desde la semana en curso y agrupar o reagrupar ejercicios no borra el progreso del cliente
- Gestión de entrenadores con roles (manager / trainer), restringida a managers
- Permisos por rol, filtros sincronizados con la URL e interfaz bilingüe es/en (incluye validaciones y contenido de catálogo)

### Client app

- PWA instalable con identidad de marca propia (paleta cálida, navegación mobile) y splash de arranque
- Autenticación completa: login/logout, set-password por invitación, recuperación y cambio de contraseña; login bloqueado para cuentas desactivadas
- Planificación activa: días, ejercicios con series/reps de la semana y video de cada ejercicio
- Avance por la fase: la semana en curso sale del propio entrenamiento (la primera sesión sin completar), con días completados marcados y el día que toca destacado; se puede cambiar de semana a mano
- Registro del entrenamiento: peso y reps por serie, series marcadas como hechas y estado de avance por ejercicio en el listado del día. El registro no espera a la red (se guarda apenas se toca y se reintenta solo si la conexión falla), pensado para usarse en el gimnasio
- Timer de descanso: arranca solo al completar una serie, con cuenta regresiva sonora y vibración en los últimos segundos, y mantiene la pantalla encendida mientras corre
- "La vez pasada": el peso máximo de la última vez que se hizo ese ejercicio, cruzando semanas y fases, con el input de peso precargado a partir de ese valor
- Perfil del cliente con sus datos de entrenamiento y sección de cuenta (contraseña, idioma, cerrar sesión)
- Interfaz bilingüe es/en, mismo patrón que el dashboard

### Shared

- Schemas Zod y tipos compartidos entre las dos apps (recursos, auth, respuestas paginadas)
- i18n de los mensajes de validación (sobre Zod v4)
- Tests unitarios con Vitest: una suite por workspace (schemas compartidos y reglas de negocio de cada app)

## Estado

En desarrollo. El ciclo completo ya funciona de punta a punta: el entrenador arma la fase en el dashboard y el cliente la ejecuta y registra desde el teléfono. Pendientes antes del lanzamiento: plantillas de rutina, panel de seguimiento de adherencia y una pasada final de UI.

## Autor

Francisco Racciatti
