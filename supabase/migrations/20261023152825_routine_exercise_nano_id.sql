-- La PWA rutea por slot: en un dropset el mismo ejercicio aparece dos veces en el día.
alter table public.routine_exercises
  add column nano_id text not null default public.generate_nanoid();

alter table public.routine_exercises
  add constraint routine_exercises_nano_id_key unique (nano_id);
