-- Cierra dos agujeros que son drift de arranque, no decisiones:
--
--   1. Las 11 tablas nacieron con el `grant all to anon` que Supabase pone por default
--      al crear una tabla. `workout_logs` es la unica que ya lo tenia revocado.
--   2. Las 26 policies de la primera camada de CRUDL se escribieron sin clausula de rol,
--      o sea `to public`, que incluye a `anon`. Las mas nuevas ya nacen `to authenticated`.
--
-- Hoy no hay exposicion, pero la razon es accidental: todas esas policies dereferencian
-- auth.uid(), que para una sesion anonima es NULL, y el predicado da NULL en vez de true.
-- Alcanza UNA policy futura `using (true)` sin rol -- plausible para un catalogo, tipo
-- "equipment lo puede leer cualquiera" -- para que anon lea la tabla entera sin login. Y como
-- la grant incluye INSERT/UPDATE/DELETE, un `with check` flojo seria escritura anonima.
--
-- Las dos mitades son independientes: una es SQL de permisos, la otra es RLS. Se auditan
-- por separado (`information_schema.table_privileges` vs `pg_policies.roles`).
--
-- `alter policy ... to` cambia los roles in-place: no hace falta drop + recreate, asi que
-- el predicado de cada policy no se toca ni se puede transcribir mal.

-- 1. Revocar anon
revoke all on table public.clients from anon;
revoke all on table public.equipment from anon;
revoke all on table public.exercise_muscle_groups from anon;
revoke all on table public.exercises from anon;
revoke all on table public.muscle_groups from anon;
revoke all on table public.routine_blocks from anon;
revoke all on table public.routine_days from anon;
revoke all on table public.routine_exercise_schemes from anon;
revoke all on table public.routine_exercises from anon;
revoke all on table public.routines from anon;
revoke all on table public.trainers from anon;

-- 2. Acotar a authenticated las policies que quedaron en `public`

-- clients
alter policy "Clients can read own profile" on public.clients to authenticated;
alter policy "Managers can insert clients" on public.clients to authenticated;
alter policy "Managers can read all clients" on public.clients to authenticated;
alter policy "Managers can update all clients" on public.clients to authenticated;
alter policy "Trainers can insert clients" on public.clients to authenticated;
alter policy "Trainers can read own clients" on public.clients to authenticated;
alter policy "Trainers can update own clients" on public.clients to authenticated;

-- equipment
alter policy "Clients can read equipment" on public.equipment to authenticated;
alter policy "Managers can insert equipment" on public.equipment to authenticated;
alter policy "Managers can update equipment" on public.equipment to authenticated;
alter policy "Trainers can read equipment" on public.equipment to authenticated;

-- exercise_muscle_groups
alter policy "Managers can delete exercise muscle groups" on public.exercise_muscle_groups to authenticated;
alter policy "Managers can insert exercise muscle groups" on public.exercise_muscle_groups to authenticated;
alter policy "Managers can update exercise muscle groups" on public.exercise_muscle_groups to authenticated;
alter policy "Trainers can read exercise muscle groups" on public.exercise_muscle_groups to authenticated;

-- exercises
alter policy "Managers can insert exercises" on public.exercises to authenticated;
alter policy "Managers can update exercises" on public.exercises to authenticated;
alter policy "Trainers can read all exercises" on public.exercises to authenticated;

-- muscle_groups
alter policy "Clients can read muscle groups" on public.muscle_groups to authenticated;
alter policy "Managers can insert muscle groups" on public.muscle_groups to authenticated;
alter policy "Managers can update muscle groups" on public.muscle_groups to authenticated;
alter policy "Trainers can read muscle groups" on public.muscle_groups to authenticated;

-- trainers
alter policy "Managers can insert trainers" on public.trainers to authenticated;
alter policy "Managers can read all trainers" on public.trainers to authenticated;
alter policy "Trainers can read own profile" on public.trainers to authenticated;
alter policy "Trainers can update own profile" on public.trainers to authenticated;
