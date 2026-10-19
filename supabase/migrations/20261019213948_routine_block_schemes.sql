-- Las rondas y el descanso son del bloque: en una superserie A+B, "2 series" son 2 rondas de A → B.
-- `transition_seconds` es la pausa entre ejercicios de una ronda; null = pasar directo.
create table public.routine_block_schemes (
  id uuid primary key default gen_random_uuid(),
  routine_block_id uuid not null references public.routine_blocks (id) on delete cascade,
  week_number int not null check (week_number between 1 and 52),
  sets int not null,
  rest_seconds int,
  transition_seconds int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (routine_block_id, week_number)
);

create trigger set_updated_at before update on public.routine_block_schemes
  for each row execute function extensions.moddatetime('updated_at');

alter table public.routine_block_schemes enable row level security;

create policy "trainer/manager manage routine_block_schemes" on public.routine_block_schemes
  to authenticated
  using (public.can_edit_block(routine_block_id))
  with check (public.can_edit_block(routine_block_id));

create policy "Clients can read own block schemes" on public.routine_block_schemes
  for select to authenticated
  using (public.can_view_block(routine_block_id));

revoke all on table public.routine_block_schemes from anon;
revoke all on table public.routine_block_schemes from authenticated;
grant select, insert, update, delete on table public.routine_block_schemes to authenticated;

-- Desempate: los slots de un bloque podían tener series distintas (nada lo impedía). Gana el primer
-- slot vivo del bloque; los retirados solo si no queda ninguno.
insert into public.routine_block_schemes (routine_block_id, week_number, sets, rest_seconds)
select distinct on (slot.routine_block_id, scheme.week_number)
  slot.routine_block_id, scheme.week_number, scheme.sets, scheme.rest_seconds
from public.routine_exercise_schemes scheme
join public.routine_exercises slot on slot.id = scheme.routine_exercise_id
order by slot.routine_block_id, scheme.week_number, slot.deleted_at is not null, slot.sort_order;

alter table public.routine_exercise_schemes drop column sets;
alter table public.routine_exercise_schemes drop column rest_seconds;
