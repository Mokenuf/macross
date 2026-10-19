-- Todo ejercicio tiene unidad: los existentes arrancan en la default. Si no hay ninguna
-- (base local, donde el seed corre después de las migraciones) se crea acá.
insert into public.units (name_es, name_en, slug, kind, is_default)
select 'Repeticiones', 'Reps', 'repeticiones', 'count', true
where not exists (select 1 from public.units where is_default and deleted_at is null)
on conflict (slug) do nothing;

alter table public.exercises add column unit_id uuid references public.units (id);

update public.exercises
set unit_id = (select id from public.units where is_default and deleted_at is null);

alter table public.exercises alter column unit_id set not null;

create index exercises_unit_id_idx on public.exercises (unit_id);
