-- `kind` decide el comportamiento (`time` habilita el timer), nunca el nombre.
-- La default va por flag y no por slug: el PATCH regenera el slug al renombrar.

create table public.units (
  id uuid primary key default gen_random_uuid(),
  name_es text not null,
  name_en text,
  slug text not null unique,
  nano_id text not null unique default public.generate_nanoid(),
  kind text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index units_one_default on public.units (is_default)
  where is_default and deleted_at is null;

create trigger set_updated_at before update on public.units
  for each row execute function extensions.moddatetime('updated_at');

alter table public.units enable row level security;

create policy "Managers can insert units" on public.units
  for insert to authenticated
  with check (public.is_manager());

create policy "Managers can update units" on public.units
  for update to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy "Trainers can read units" on public.units
  for select to authenticated
  using (exists (
    select 1 from public.trainers
    where trainers.id = auth.uid() and trainers.deleted_at is null
  ));

create policy "Clients can read units" on public.units
  for select to authenticated
  using (public.is_active_client());

revoke all on table public.units from anon;
revoke all on table public.units from authenticated;
grant select, insert on table public.units to authenticated;
grant update (name_es, name_en, slug, kind, is_default, deleted_at)
  on table public.units to authenticated;
