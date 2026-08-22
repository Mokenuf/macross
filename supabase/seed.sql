-- Seed del entorno local. Lo corre `pnpm db:reset` después de las migraciones.
-- No hace falta que sea idempotente: db reset recrea la base antes de llegar acá.
--
-- Contraseña de las tres cuentas: Macross$1234
-- Roster acotado a las cuentas de Fran vía +alias de Gmail. El cliente cuelga del
-- TRAINER y no del manager a propósito: es lo único que ejercita el scoping
-- `trainer_id = auth.uid()` (listados, sidebar por rol, 403 al borrar un manager).

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '7b608278-95e8-494d-b0f5-67467d9d0bf8',
    'authenticated',
    'authenticated',
    'payo.metal@gmail.com',
    extensions.crypt('Macross$1234', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '2aec9563-71cf-4f4b-a356-2f48d95fb807',
    'authenticated',
    'authenticated',
    'payo.metal+trainer@gmail.com',
    extensions.crypt('Macross$1234', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '506cab7a-5ea4-4a02-b8fe-e29fad40dfbc',
    'authenticated',
    'authenticated',
    'payo.metal+client@gmail.com',
    extensions.crypt('Macross$1234', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  );

-- GoTrue escanea estas columnas a un `string` de Go (no un puntero), así que un NULL
-- le revienta el login con un 500 opaco ("Database error querying schema") y el error
-- real solo aparece en los logs del contenedor de auth. El default de la tabla es NULL,
-- así que hay que vaciarlas a mano; sus índices únicos son parciales y excluyen al ''.
-- `phone` NO va acá: su índice único es total y tres filas con '' colisionarían.
update auth.users
set confirmation_token = '',
    recovery_token = '',
    email_change = '',
    email_change_token_new = '',
    email_change_token_current = '',
    phone_change = '',
    phone_change_token = '',
    reauthentication_token = '';

-- GoTrue no reconoce un usuario sin su fila de identity: `provider_id` y el `sub`
-- de `identity_data` son lo que resuelve el login por email. `identities.email` es
-- columna generada (`lower(identity_data->>'email')`), así que no se inserta.
insert into auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  u.id::text,
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  now(),
  now(),
  now()
from auth.users u;

insert into public.trainers (id, full_name, email, role)
values
  ('7b608278-95e8-494d-b0f5-67467d9d0bf8', 'Fran Racciatti', 'payo.metal@gmail.com', 'manager'),
  ('2aec9563-71cf-4f4b-a356-2f48d95fb807', 'Fran Trainer', 'payo.metal+trainer@gmail.com', 'trainer');

insert into public.clients (
  id,
  trainer_id,
  full_name,
  email,
  birth_date,
  weight_kg,
  height_cm,
  level,
  goal,
  desired_weekly_frequency
)
values (
  '506cab7a-5ea4-4a02-b8fe-e29fad40dfbc',
  '2aec9563-71cf-4f4b-a356-2f48d95fb807',
  'Fran Cliente',
  'payo.metal+client@gmail.com',
  '1990-03-14',
  78.50,
  178,
  'intermediate',
  array['hypertrophy', 'strength'],
  3
);
