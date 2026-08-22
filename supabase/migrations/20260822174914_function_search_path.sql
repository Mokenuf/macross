-- Fija el `search_path` en las dos `security definer` que no lo tenian. Las otras
-- catorce ya lo traen; estas dos son las mas viejas del proyecto y quedaron atras.
--
-- Es hardening del linter, NO el cierre de un agujero explotable, y vale decirlo
-- con precision: el hijack de search_path exige poder **crear objetos** en un
-- schema del path, para shadowear algo que la funcion referencia. Verificado que
-- ni `authenticated` ni `anon` tienen CREATE en `public` ni en `extensions`, y el
-- unico rol que puede (postgres/service_role) ya bypassa RLS de todas formas.
-- O sea: hoy no hay vector. Se fija igual porque la premisa "nadie puede crear en
-- public" es un default de la plataforma que no controlamos, y depender de un
-- default ajeno para una funcion que corre con privilegios elevados es la misma
-- clase de fragilidad que tenia el `grant all` a `anon`: protegido por accidente.
--
-- `ALTER FUNCTION ... SET` no reescribe el cuerpo, solo le agrega la config, asi
-- que no hay logica que transcribir mal.

alter function public.is_manager() set search_path = public;
alter function public.get_user_role() set search_path = public;
