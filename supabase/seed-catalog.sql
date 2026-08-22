-- Catalogo compartido: grupos musculares y equipamiento, bilingue.
--
-- Lo consumen DOS entornos, y por eso vive aparte de `seed.sql`:
--   - Local: `config.toml` lo lista en [db.seed].sql_paths, asi que `db reset` lo
--     carga solo. Sin esto la base local no tiene con que armar una rutina, o sea
--     que el builder del trainer y el plan de la PWA no se pueden probar.
--   - Produccion: se corre a mano una vez, despues del wipe.
--
-- La lista NO es inventada: son los 10 grupos musculares que Seba ya tenia en
-- prod (sacando la basura de testing: "pitos", el duplicado "Core"/"core" por
-- mayuscula, y tres soft-deleted) y sus 3 equipamientos, con el nombre en ingles
-- que a todos les faltaba y capitalizacion consistente. La taxonomia es la suya;
-- lo unico que se arregla es la calidad de los datos.
--
-- `slug` sale del name_es y va sin acentos (es idioma-neutral: las URLs de la PWA
-- no cambian al togglear idioma). El `on conflict` hace el script re-corrible
-- contra prod sin duplicar, por si queda a medio aplicar.

insert into public.muscle_groups (name_es, name_en, slug) values
  ('Pecho',             'Chest',         'pecho'),
  ('Espalda',           'Back',          'espalda'),
  ('Hombros',           'Shoulders',     'hombros'),
  ('Deltoide superior', 'Upper deltoid', 'deltoide-superior'),
  ('Trapecios',         'Traps',         'trapecios'),
  ('Bíceps',            'Biceps',        'biceps'),
  ('Tríceps',           'Triceps',       'triceps'),
  ('Piernas',           'Legs',          'piernas'),
  ('Core',              'Core',          'core'),
  ('Cardio',            'Cardio',        'cardio')
on conflict (slug) do nothing;

insert into public.equipment (name_es, name_en, slug) values
  ('Barra',     'Barbell',  'barra'),
  ('Mancuerna', 'Dumbbell', 'mancuerna'),
  ('Polea',     'Cable',    'polea')
on conflict (slug) do nothing;
