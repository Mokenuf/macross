-- ============================================================================
-- WIPE DE LOS DATOS DE PRUEBA DE PRODUCCION. BORRA TODAS LAS CUENTAS.
-- Se corre UNA VEZ, a mano, y solo despues de tener el pg_dump de backup.
-- ============================================================================
--
-- NO es una migracion a proposito: si viviera en supabase/migrations/, `db reset`
-- lo correria en cada reset local y borraria el seed. Vive versionado igual para
-- que sea revisable y reproducible, pero el transporte es manual (SQL editor del
-- dashboard, o psql contra la connection string de prod).
--
-- Que se lleva, y por que alcanza con dos statements:
--
--   1. `delete from auth.users` cascadea a `trainers` y `clients` (las dos tienen
--      su PK como FK a auth.users con `on delete cascade`), y de ahi baja solo:
--      exercises, routines -> days -> blocks -> slots -> schemes, workout_logs y
--      el pivot exercise_muscle_groups. Tambien limpia el propio schema auth
--      (identities, sessions, mfa_factors, one_time_tokens, webauthn...).
--   2. El catalogo compartido (`equipment`, `muscle_groups`) NO cuelga de ningun
--      trainer, asi que el cascade de arriba no lo alcanza: va aparte.
--
-- Que NO toca:
--
--   - **Storage.** El bucket `assets` tiene el logo que usan los templates de
--     mail de auth; borrarlo rompe los mails de invite y recovery.
--   - El schema (tablas, policies, funciones, triggers). Eso es de las
--     migraciones, no de este script.
--
-- Se lleva de paso a `seba@macross.dev`, la cuenta lockeada del dominio trucho:
-- dejo de ser un problema "por la cascada" justo cuando la cascada es lo que se
-- busca.

-- Antes
select 'antes' as momento,
       (select count(*) from auth.users)            as users,
       (select count(*) from public.trainers)       as trainers,
       (select count(*) from public.clients)        as clients,
       (select count(*) from public.exercises)      as exercises,
       (select count(*) from public.routines)       as routines,
       (select count(*) from public.workout_logs)   as logs,
       (select count(*) from public.equipment)      as equipment,
       (select count(*) from public.muscle_groups)  as muscle_groups;

-- Sin `begin`/`commit` explicito: el SQL Editor de Supabase no acepta control de
-- transaccion y no corre el archivo de una. Igual queda atomico ahi, porque el editor
-- envuelve cada ejecucion en su propia transaccion. Si en cambio lo corres con psql,
-- usa `psql -1 -f` (--single-transaction) para no quedarte a mitad de camino.

delete from auth.users;

-- `cascade` es obligatorio, no defensivo: TRUNCATE se niega si otra tabla
-- referencia a la que truncas (exercises -> equipment, el pivot -> muscle_groups).
-- A esta altura esas tablas ya quedaron vacias por el cascade del delete.
truncate table public.equipment, public.muscle_groups cascade;

-- Despues: las ocho columnas tienen que dar 0.
select 'despues' as momento,
       (select count(*) from auth.users)            as users,
       (select count(*) from public.trainers)       as trainers,
       (select count(*) from public.clients)        as clients,
       (select count(*) from public.exercises)      as exercises,
       (select count(*) from public.routines)       as routines,
       (select count(*) from public.workout_logs)   as logs,
       (select count(*) from public.equipment)      as equipment,
       (select count(*) from public.muscle_groups)  as muscle_groups;

-- ----------------------------------------------------------------------------
-- FALLBACK, solo si el delete falla con un error de FK que menciona storage:
-- en versiones viejas del schema `storage`, `objects.owner` era FK a auth.users
-- sin `on delete cascade`. En la version actual esa FK no existe (verificado
-- 2026-08-22: storage.objects solo tiene la FK a storage.buckets), asi que esto
-- normalmente no hace falta. Nulificar el owner no borra el archivo ni cambia
-- el bucket.
--
--   update storage.objects set owner = null, owner_id = null;
-- ----------------------------------------------------------------------------
