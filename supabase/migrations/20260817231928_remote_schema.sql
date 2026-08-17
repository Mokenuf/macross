


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."can_edit_block"("_block_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select is_manager() or exists (
    select 1 from routine_blocks b
    join routine_days d on d.id = b.routine_day_id
    join routines r on r.id = d.routine_id
    where b.id = _block_id and r.trainer_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."can_edit_block"("_block_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_edit_day"("_day_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select is_manager() or exists (
    select 1 from routine_days d
    join routines r on r.id = d.routine_id
    where d.id = _day_id and r.trainer_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."can_edit_day"("_day_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_edit_routine"("_routine_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select is_manager() or exists (
    select 1 from routines r where r.id = _routine_id and r.trainer_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."can_edit_routine"("_routine_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_edit_routine_exercise"("_slot_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select is_manager() or exists (
    select 1 from routine_exercises e
    join routine_blocks b on b.id = e.routine_block_id
    join routine_days d on d.id = b.routine_day_id
    join routines r on r.id = d.routine_id
    where e.id = _slot_id and r.trainer_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."can_edit_routine_exercise"("_slot_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_log_scheme"("_scheme_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from routine_exercise_schemes s
    where s.id = _scheme_id
      and can_view_routine_exercise(s.routine_exercise_id)
  );
$$;


ALTER FUNCTION "public"."can_log_scheme"("_scheme_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_view_block"("_block_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from routine_blocks b
    where b.id = _block_id
      and can_view_day(b.routine_day_id)
  );
$$;


ALTER FUNCTION "public"."can_view_block"("_block_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_view_day"("_day_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from routine_days d
    where d.id = _day_id
      and can_view_routine(d.routine_id)
  );
$$;


ALTER FUNCTION "public"."can_view_day"("_day_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_view_exercise"("_exercise_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select is_active_client() and exists (
    select 1
    from routine_exercises re
    join routine_blocks b on b.id = re.routine_block_id
    join routine_days   d on d.id = b.routine_day_id
    join routines       r on r.id = d.routine_id
    where re.exercise_id = _exercise_id
      and r.client_id = auth.uid()
      and r.deleted_at is null
  );
$$;


ALTER FUNCTION "public"."can_view_exercise"("_exercise_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_view_routine"("_routine_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select is_active_client() and exists (
    select 1 from routines r
    where r.id = _routine_id
      and r.client_id = auth.uid()
      and r.deleted_at is null
  );
$$;


ALTER FUNCTION "public"."can_view_routine"("_routine_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_view_routine_exercise"("_slot_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from routine_exercises e
    where e.id = _slot_id
      and can_view_block(e.routine_block_id)
  );
$$;


ALTER FUNCTION "public"."can_view_routine_exercise"("_slot_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_nanoid"("size" integer DEFAULT 12) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
declare
  alphabet text := '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  result text := '';
  i int;
begin
  for i in 1..size loop
    result := result || substr(alphabet, floor(random() * length(alphabet) + 1)::int, 1);
  end loop;
  return result;
end;
$$;


ALTER FUNCTION "public"."generate_nanoid"("size" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  if exists (select 1 from public.trainers where id = auth.uid() and delete_at is null) then
    return 'trainer';
  end if;

  if exists(select 1 from public.clients where id = auth.uid() and delete_at is null) then
    return 'client';
  end if;

  return null;
end;
$$;


ALTER FUNCTION "public"."get_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_active_client"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from clients
    where id = auth.uid() and deleted_at is null
  );
$$;


ALTER FUNCTION "public"."is_active_client"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_manager"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  select exists (
    select 1 from public.trainers
    where id = auth.uid()
    and role = 'manager'
    and deleted_at is null
  );
$$;


ALTER FUNCTION "public"."is_manager"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_my_client"("_client_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select is_manager() or exists (
    select 1
    from clients c
    where c.id = _client_id
      and c.trainer_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."is_my_client"("_client_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_my_trainer"("_trainer_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from clients
    where clients.id = auth.uid()
      and clients.trainer_id = _trainer_id
      and clients.deleted_at is null
  );
$$;


ALTER FUNCTION "public"."is_my_trainer"("_trainer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" NOT NULL,
    "trainer_id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "nano_id" "text" DEFAULT "public"."generate_nanoid"() NOT NULL,
    "birth_date" "date",
    "weight_kg" numeric(5,2),
    "height_cm" integer,
    "level" "text",
    "goal" "text"[],
    "desired_weekly_frequency" integer,
    "injuries" "text",
    "available_equipment" "text",
    "notes" "text"
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


COMMENT ON TABLE "public"."clients" IS 'Clientes asignados a un trainer';



CREATE TABLE IF NOT EXISTS "public"."equipment" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name_es" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "nano_id" "text" DEFAULT "public"."generate_nanoid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "name_en" "text"
);


ALTER TABLE "public"."equipment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exercise_muscle_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "exercise_id" "uuid" NOT NULL,
    "muscle_group_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."exercise_muscle_groups" OWNER TO "postgres";


COMMENT ON TABLE "public"."exercise_muscle_groups" IS 'Relación muchos a muchos entre ejercicios y grupos musculares';



CREATE TABLE IF NOT EXISTS "public"."exercises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trainer_id" "uuid" NOT NULL,
    "name_es" "text" NOT NULL,
    "description_es" "text",
    "video_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "nano_id" "text" DEFAULT "public"."generate_nanoid"() NOT NULL,
    "slug" "text",
    "equipment_id" "uuid",
    "name_en" "text",
    "description_en" "text"
);


ALTER TABLE "public"."exercises" OWNER TO "postgres";


COMMENT ON TABLE "public"."exercises" IS 'Ejercicios que puede asignar un trainer';



CREATE TABLE IF NOT EXISTS "public"."muscle_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name_es" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "nano_id" "text" DEFAULT "public"."generate_nanoid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "name_en" "text"
);


ALTER TABLE "public"."muscle_groups" OWNER TO "postgres";


COMMENT ON TABLE "public"."muscle_groups" IS 'Catálogo de grupos musculares';



CREATE TABLE IF NOT EXISTS "public"."routine_blocks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "routine_day_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "sort_order" integer NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "routine_blocks_type_check" CHECK (("type" = ANY (ARRAY['single'::"text", 'superset'::"text", 'dropset'::"text", 'circuit'::"text"])))
);


ALTER TABLE "public"."routine_blocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."routine_days" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "routine_id" "uuid" NOT NULL,
    "day_number" integer NOT NULL,
    "label" "text",
    "nano_id" "text" DEFAULT "public"."generate_nanoid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "routine_days_day_number_check" CHECK ((("day_number" >= 1) AND ("day_number" <= 7)))
);


ALTER TABLE "public"."routine_days" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."routine_exercise_schemes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "routine_exercise_id" "uuid" NOT NULL,
    "week_number" integer NOT NULL,
    "sets" integer NOT NULL,
    "reps" "text" NOT NULL,
    "rest_seconds" integer,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "routine_exercise_schemes_week_number_check" CHECK ((("week_number" >= 1) AND ("week_number" <= 52)))
);


ALTER TABLE "public"."routine_exercise_schemes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."routine_exercises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "routine_block_id" "uuid" NOT NULL,
    "exercise_id" "uuid" NOT NULL,
    "sort_order" integer NOT NULL,
    "optional" boolean DEFAULT false NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."routine_exercises" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."routines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trainer_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "name" "text" NOT NULL,
    "days_per_week" integer NOT NULL,
    "weeks" integer DEFAULT 4 NOT NULL,
    "notes" "text",
    "active" boolean DEFAULT true NOT NULL,
    "is_template" boolean DEFAULT false NOT NULL,
    "nano_id" "text" DEFAULT "public"."generate_nanoid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."routines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trainers" (
    "id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" DEFAULT 'trainer'::"text" NOT NULL,
    "avatar_url" "text",
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "nano_id" "text" DEFAULT "public"."generate_nanoid"() NOT NULL,
    CONSTRAINT "trainers_role_check" CHECK (("role" = ANY (ARRAY['manager'::"text", 'trainer'::"text"])))
);


ALTER TABLE "public"."trainers" OWNER TO "postgres";


COMMENT ON TABLE "public"."trainers" IS 'Staff de macross: managers y trainers';



CREATE TABLE IF NOT EXISTS "public"."workout_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "routine_exercise_scheme_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "set_number" integer NOT NULL,
    "weight_kg" numeric(6,2),
    "actual_reps" integer,
    "completed" boolean DEFAULT false NOT NULL,
    "logged_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "workout_logs_set_number_check" CHECK ((("set_number" >= 1) AND ("set_number" <= 20)))
);


ALTER TABLE "public"."workout_logs" OWNER TO "postgres";


ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_nano_id_key" UNIQUE ("nano_id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."equipment"
    ADD CONSTRAINT "equipment_nano_id_key" UNIQUE ("nano_id");



ALTER TABLE ONLY "public"."equipment"
    ADD CONSTRAINT "equipment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."equipment"
    ADD CONSTRAINT "equipment_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."exercise_muscle_groups"
    ADD CONSTRAINT "exercise_muscle_groups_exercise_id_muscle_group_id_key" UNIQUE ("exercise_id", "muscle_group_id");



ALTER TABLE ONLY "public"."exercise_muscle_groups"
    ADD CONSTRAINT "exercise_muscle_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exercises"
    ADD CONSTRAINT "exercises_nano_id_key" UNIQUE ("nano_id");



ALTER TABLE ONLY "public"."exercises"
    ADD CONSTRAINT "exercises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exercises"
    ADD CONSTRAINT "exercises_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."muscle_groups"
    ADD CONSTRAINT "muscle_groups_name_key" UNIQUE ("name_es");



ALTER TABLE ONLY "public"."muscle_groups"
    ADD CONSTRAINT "muscle_groups_nano_id_key" UNIQUE ("nano_id");



ALTER TABLE ONLY "public"."muscle_groups"
    ADD CONSTRAINT "muscle_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."muscle_groups"
    ADD CONSTRAINT "muscle_groups_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."routine_blocks"
    ADD CONSTRAINT "routine_blocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."routine_days"
    ADD CONSTRAINT "routine_days_nano_id_key" UNIQUE ("nano_id");



ALTER TABLE ONLY "public"."routine_days"
    ADD CONSTRAINT "routine_days_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."routine_exercise_schemes"
    ADD CONSTRAINT "routine_exercise_schemes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."routine_exercise_schemes"
    ADD CONSTRAINT "routine_exercise_schemes_routine_exercise_id_week_number_key" UNIQUE ("routine_exercise_id", "week_number");



ALTER TABLE ONLY "public"."routine_exercises"
    ADD CONSTRAINT "routine_exercises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."routines"
    ADD CONSTRAINT "routines_nano_id_key" UNIQUE ("nano_id");



ALTER TABLE ONLY "public"."routines"
    ADD CONSTRAINT "routines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trainers"
    ADD CONSTRAINT "trainers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."trainers"
    ADD CONSTRAINT "trainers_nano_id_key" UNIQUE ("nano_id");



ALTER TABLE ONLY "public"."trainers"
    ADD CONSTRAINT "trainers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workout_logs"
    ADD CONSTRAINT "workout_logs_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "routine_blocks_day_order" ON "public"."routine_blocks" USING "btree" ("routine_day_id", "sort_order") WHERE ("deleted_at" IS NULL);



CREATE UNIQUE INDEX "routine_exercises_block_order" ON "public"."routine_exercises" USING "btree" ("routine_block_id", "sort_order") WHERE ("deleted_at" IS NULL);



CREATE INDEX "routine_exercises_exercise_id_idx" ON "public"."routine_exercises" USING "btree" ("exercise_id");



CREATE UNIQUE INDEX "routines_one_active_per_client" ON "public"."routines" USING "btree" ("client_id") WHERE ("active" AND (NOT "is_template") AND ("deleted_at" IS NULL));



CREATE INDEX "workout_logs_client_id_idx" ON "public"."workout_logs" USING "btree" ("client_id");



CREATE UNIQUE INDEX "workout_logs_one_per_set" ON "public"."workout_logs" USING "btree" ("routine_exercise_scheme_id", "set_number") WHERE ("deleted_at" IS NULL);



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."equipment" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."exercises" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."muscle_groups" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."routine_blocks" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."routine_days" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."routine_exercise_schemes" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."routine_exercises" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."routines" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."trainers" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."workout_logs" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exercise_muscle_groups"
    ADD CONSTRAINT "exercise_muscle_groups_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exercise_muscle_groups"
    ADD CONSTRAINT "exercise_muscle_groups_muscle_group_id_fkey" FOREIGN KEY ("muscle_group_id") REFERENCES "public"."muscle_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exercises"
    ADD CONSTRAINT "exercises_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."exercises"
    ADD CONSTRAINT "exercises_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."routine_blocks"
    ADD CONSTRAINT "routine_blocks_routine_day_id_fkey" FOREIGN KEY ("routine_day_id") REFERENCES "public"."routine_days"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."routine_days"
    ADD CONSTRAINT "routine_days_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."routine_exercise_schemes"
    ADD CONSTRAINT "routine_exercise_schemes_routine_exercise_id_fkey" FOREIGN KEY ("routine_exercise_id") REFERENCES "public"."routine_exercises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."routine_exercises"
    ADD CONSTRAINT "routine_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."routine_exercises"
    ADD CONSTRAINT "routine_exercises_routine_block_id_fkey" FOREIGN KEY ("routine_block_id") REFERENCES "public"."routine_blocks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."routines"
    ADD CONSTRAINT "routines_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."routines"
    ADD CONSTRAINT "routines_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trainers"
    ADD CONSTRAINT "trainers_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_logs"
    ADD CONSTRAINT "workout_logs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_logs"
    ADD CONSTRAINT "workout_logs_routine_exercise_scheme_id_fkey" FOREIGN KEY ("routine_exercise_scheme_id") REFERENCES "public"."routine_exercise_schemes"("id") ON DELETE CASCADE;



CREATE POLICY "Clients can insert own logs" ON "public"."workout_logs" FOR INSERT TO "authenticated" WITH CHECK ((("client_id" = "auth"."uid"()) AND "public"."can_log_scheme"("routine_exercise_scheme_id")));



CREATE POLICY "Clients can read equipment" ON "public"."equipment" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."clients"
  WHERE (("clients"."id" = "auth"."uid"()) AND ("clients"."deleted_at" IS NULL)))));



CREATE POLICY "Clients can read muscle groups" ON "public"."muscle_groups" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."clients"
  WHERE (("clients"."id" = "auth"."uid"()) AND ("clients"."deleted_at" IS NULL)))));



CREATE POLICY "Clients can read own logs" ON "public"."workout_logs" FOR SELECT TO "authenticated" USING ((("client_id" = "auth"."uid"()) AND "public"."is_active_client"()));



CREATE POLICY "Clients can read own profile" ON "public"."clients" FOR SELECT USING ((("id" = "auth"."uid"()) AND ("deleted_at" IS NULL)));



CREATE POLICY "Clients can read own routine blocks" ON "public"."routine_blocks" FOR SELECT TO "authenticated" USING ("public"."can_view_day"("routine_day_id"));



CREATE POLICY "Clients can read own routine days" ON "public"."routine_days" FOR SELECT TO "authenticated" USING ("public"."can_view_routine"("routine_id"));



CREATE POLICY "Clients can read own routine exercises" ON "public"."routine_exercises" FOR SELECT TO "authenticated" USING ("public"."can_view_block"("routine_block_id"));



CREATE POLICY "Clients can read own routine schemes" ON "public"."routine_exercise_schemes" FOR SELECT TO "authenticated" USING ("public"."can_view_routine_exercise"("routine_exercise_id"));



CREATE POLICY "Clients can read own routines" ON "public"."routines" FOR SELECT TO "authenticated" USING ((("client_id" = "auth"."uid"()) AND ("deleted_at" IS NULL) AND "public"."is_active_client"()));



CREATE POLICY "Clients can read own trainer" ON "public"."trainers" FOR SELECT TO "authenticated" USING ("public"."is_my_trainer"("id"));



CREATE POLICY "Clients can read prescribed exercises" ON "public"."exercises" FOR SELECT TO "authenticated" USING ("public"."can_view_exercise"("id"));



CREATE POLICY "Clients can update own logs" ON "public"."workout_logs" FOR UPDATE TO "authenticated" USING ((("client_id" = "auth"."uid"()) AND "public"."is_active_client"())) WITH CHECK ((("client_id" = "auth"."uid"()) AND "public"."can_log_scheme"("routine_exercise_scheme_id")));



CREATE POLICY "Managers can delete exercise muscle groups" ON "public"."exercise_muscle_groups" FOR DELETE USING ("public"."is_manager"());



CREATE POLICY "Managers can insert clients" ON "public"."clients" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."trainers"
  WHERE (("trainers"."id" = "auth"."uid"()) AND ("trainers"."role" = 'manager'::"text") AND ("trainers"."deleted_at" IS NULL)))));



CREATE POLICY "Managers can insert equipment" ON "public"."equipment" FOR INSERT WITH CHECK ("public"."is_manager"());



CREATE POLICY "Managers can insert exercise muscle groups" ON "public"."exercise_muscle_groups" FOR INSERT WITH CHECK ("public"."is_manager"());



CREATE POLICY "Managers can insert exercises" ON "public"."exercises" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."trainers"
  WHERE (("trainers"."id" = "auth"."uid"()) AND ("trainers"."role" = 'manager'::"text") AND ("trainers"."deleted_at" IS NULL)))));



CREATE POLICY "Managers can insert muscle groups" ON "public"."muscle_groups" FOR INSERT WITH CHECK ("public"."is_manager"());



CREATE POLICY "Managers can insert trainers" ON "public"."trainers" FOR INSERT WITH CHECK ("public"."is_manager"());



CREATE POLICY "Managers can read all clients" ON "public"."clients" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."trainers"
  WHERE (("trainers"."id" = "auth"."uid"()) AND ("trainers"."role" = 'manager'::"text") AND ("trainers"."deleted_at" IS NULL)))));



CREATE POLICY "Managers can read all trainers" ON "public"."trainers" FOR SELECT USING ("public"."is_manager"());



CREATE POLICY "Managers can update all clients" ON "public"."clients" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."trainers"
  WHERE (("trainers"."id" = "auth"."uid"()) AND ("trainers"."role" = 'manager'::"text") AND ("trainers"."deleted_at" IS NULL)))));



CREATE POLICY "Managers can update equipment" ON "public"."equipment" FOR UPDATE USING ("public"."is_manager"());



CREATE POLICY "Managers can update exercise muscle groups" ON "public"."exercise_muscle_groups" FOR UPDATE USING ("public"."is_manager"());



CREATE POLICY "Managers can update exercises" ON "public"."exercises" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."trainers"
  WHERE (("trainers"."id" = "auth"."uid"()) AND ("trainers"."role" = 'manager'::"text") AND ("trainers"."deleted_at" IS NULL)))));



CREATE POLICY "Managers can update muscle groups" ON "public"."muscle_groups" FOR UPDATE USING ("public"."is_manager"());



CREATE POLICY "Managers can update trainers" ON "public"."trainers" FOR UPDATE TO "authenticated" USING ("public"."is_manager"()) WITH CHECK ("public"."is_manager"());



CREATE POLICY "Trainers can insert clients" ON "public"."clients" FOR INSERT WITH CHECK ((("trainer_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."trainers"
  WHERE (("trainers"."id" = "auth"."uid"()) AND ("trainers"."deleted_at" IS NULL))))));



CREATE POLICY "Trainers can read all exercises" ON "public"."exercises" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."trainers"
  WHERE (("trainers"."id" = "auth"."uid"()) AND ("trainers"."deleted_at" IS NULL)))));



CREATE POLICY "Trainers can read client logs" ON "public"."workout_logs" FOR SELECT TO "authenticated" USING ("public"."is_my_client"("client_id"));



CREATE POLICY "Trainers can read equipment" ON "public"."equipment" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."trainers"
  WHERE (("trainers"."id" = "auth"."uid"()) AND ("trainers"."deleted_at" IS NULL)))));



CREATE POLICY "Trainers can read exercise muscle groups" ON "public"."exercise_muscle_groups" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."trainers"
  WHERE (("trainers"."id" = "auth"."uid"()) AND ("trainers"."deleted_at" IS NULL)))));



CREATE POLICY "Trainers can read muscle groups" ON "public"."muscle_groups" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."trainers"
  WHERE (("trainers"."id" = "auth"."uid"()) AND ("trainers"."deleted_at" IS NULL)))));



CREATE POLICY "Trainers can read own clients" ON "public"."clients" FOR SELECT USING (("trainer_id" = "auth"."uid"()));



CREATE POLICY "Trainers can read own profile" ON "public"."trainers" FOR SELECT USING (("id" = "auth"."uid"()));



CREATE POLICY "Trainers can update own clients" ON "public"."clients" FOR UPDATE USING (("trainer_id" = "auth"."uid"()));



CREATE POLICY "Trainers can update own profile" ON "public"."trainers" FOR UPDATE USING (("id" = "auth"."uid"()));



ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."equipment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exercise_muscle_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exercises" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."muscle_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."routine_blocks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."routine_days" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."routine_exercise_schemes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."routine_exercises" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."routines" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trainer/manager manage routine_blocks" ON "public"."routine_blocks" TO "authenticated" USING ("public"."can_edit_day"("routine_day_id")) WITH CHECK ("public"."can_edit_day"("routine_day_id"));



CREATE POLICY "trainer/manager manage routine_days" ON "public"."routine_days" TO "authenticated" USING ("public"."can_edit_routine"("routine_id")) WITH CHECK ("public"."can_edit_routine"("routine_id"));



CREATE POLICY "trainer/manager manage routine_exercise_schemes" ON "public"."routine_exercise_schemes" TO "authenticated" USING ("public"."can_edit_routine_exercise"("routine_exercise_id")) WITH CHECK ("public"."can_edit_routine_exercise"("routine_exercise_id"));



CREATE POLICY "trainer/manager manage routine_exercises" ON "public"."routine_exercises" TO "authenticated" USING ("public"."can_edit_block"("routine_block_id")) WITH CHECK ("public"."can_edit_block"("routine_block_id"));



CREATE POLICY "trainer/manager manage routines" ON "public"."routines" TO "authenticated" USING (("public"."is_manager"() OR ("trainer_id" = "auth"."uid"()))) WITH CHECK (("public"."is_manager"() OR ("trainer_id" = "auth"."uid"())));



ALTER TABLE "public"."trainers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workout_logs" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."can_edit_block"("_block_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_edit_block"("_block_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_edit_block"("_block_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_edit_day"("_day_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_edit_day"("_day_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_edit_day"("_day_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_edit_routine"("_routine_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_edit_routine"("_routine_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_edit_routine"("_routine_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_edit_routine_exercise"("_slot_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_edit_routine_exercise"("_slot_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_edit_routine_exercise"("_slot_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_log_scheme"("_scheme_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_log_scheme"("_scheme_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_log_scheme"("_scheme_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_view_block"("_block_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_view_block"("_block_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_view_block"("_block_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_view_day"("_day_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_view_day"("_day_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_view_day"("_day_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_view_exercise"("_exercise_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_view_exercise"("_exercise_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_view_exercise"("_exercise_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_view_routine"("_routine_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_view_routine"("_routine_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_view_routine"("_routine_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_view_routine_exercise"("_slot_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_view_routine_exercise"("_slot_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_view_routine_exercise"("_slot_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_nanoid"("size" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."generate_nanoid"("size" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_nanoid"("size" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_active_client"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_active_client"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_active_client"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_manager"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_manager"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_manager"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_my_client"("_client_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_my_client"("_client_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_my_client"("_client_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_my_trainer"("_trainer_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_my_trainer"("_trainer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_my_trainer"("_trainer_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";


















GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT UPDATE("trainer_id") ON TABLE "public"."clients" TO "authenticated";



GRANT UPDATE("full_name") ON TABLE "public"."clients" TO "authenticated";



GRANT UPDATE("phone") ON TABLE "public"."clients" TO "authenticated";



GRANT UPDATE("avatar_url") ON TABLE "public"."clients" TO "authenticated";



GRANT UPDATE("deleted_at") ON TABLE "public"."clients" TO "authenticated";



GRANT UPDATE("birth_date") ON TABLE "public"."clients" TO "authenticated";



GRANT UPDATE("weight_kg") ON TABLE "public"."clients" TO "authenticated";



GRANT UPDATE("height_cm") ON TABLE "public"."clients" TO "authenticated";



GRANT UPDATE("level") ON TABLE "public"."clients" TO "authenticated";



GRANT UPDATE("goal") ON TABLE "public"."clients" TO "authenticated";



GRANT UPDATE("desired_weekly_frequency") ON TABLE "public"."clients" TO "authenticated";



GRANT UPDATE("injuries") ON TABLE "public"."clients" TO "authenticated";



GRANT UPDATE("available_equipment") ON TABLE "public"."clients" TO "authenticated";



GRANT UPDATE("notes") ON TABLE "public"."clients" TO "authenticated";



GRANT ALL ON TABLE "public"."equipment" TO "anon";
GRANT ALL ON TABLE "public"."equipment" TO "authenticated";
GRANT ALL ON TABLE "public"."equipment" TO "service_role";



GRANT UPDATE("name_es") ON TABLE "public"."equipment" TO "authenticated";



GRANT UPDATE("name_en") ON TABLE "public"."equipment" TO "authenticated";



GRANT ALL ON TABLE "public"."exercise_muscle_groups" TO "anon";
GRANT ALL ON TABLE "public"."exercise_muscle_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."exercise_muscle_groups" TO "service_role";



GRANT ALL ON TABLE "public"."exercises" TO "anon";
GRANT ALL ON TABLE "public"."exercises" TO "authenticated";
GRANT ALL ON TABLE "public"."exercises" TO "service_role";



GRANT ALL ON TABLE "public"."muscle_groups" TO "anon";
GRANT ALL ON TABLE "public"."muscle_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."muscle_groups" TO "service_role";



GRANT UPDATE("name_es") ON TABLE "public"."muscle_groups" TO "authenticated";



GRANT UPDATE("name_en") ON TABLE "public"."muscle_groups" TO "authenticated";



GRANT ALL ON TABLE "public"."routine_blocks" TO "anon";
GRANT ALL ON TABLE "public"."routine_blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."routine_blocks" TO "service_role";



GRANT ALL ON TABLE "public"."routine_days" TO "anon";
GRANT ALL ON TABLE "public"."routine_days" TO "authenticated";
GRANT ALL ON TABLE "public"."routine_days" TO "service_role";



GRANT ALL ON TABLE "public"."routine_exercise_schemes" TO "anon";
GRANT ALL ON TABLE "public"."routine_exercise_schemes" TO "authenticated";
GRANT ALL ON TABLE "public"."routine_exercise_schemes" TO "service_role";



GRANT ALL ON TABLE "public"."routine_exercises" TO "anon";
GRANT ALL ON TABLE "public"."routine_exercises" TO "authenticated";
GRANT ALL ON TABLE "public"."routine_exercises" TO "service_role";



GRANT ALL ON TABLE "public"."routines" TO "anon";
GRANT ALL ON TABLE "public"."routines" TO "authenticated";
GRANT ALL ON TABLE "public"."routines" TO "service_role";



GRANT ALL ON TABLE "public"."trainers" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."trainers" TO "authenticated";
GRANT ALL ON TABLE "public"."trainers" TO "service_role";



GRANT UPDATE("full_name") ON TABLE "public"."trainers" TO "authenticated";



GRANT UPDATE("avatar_url") ON TABLE "public"."trainers" TO "authenticated";



GRANT UPDATE("phone") ON TABLE "public"."trainers" TO "authenticated";



GRANT UPDATE("deleted_at") ON TABLE "public"."trainers" TO "authenticated";



GRANT ALL ON TABLE "public"."workout_logs" TO "service_role";
GRANT SELECT ON TABLE "public"."workout_logs" TO "authenticated";



GRANT INSERT("routine_exercise_scheme_id") ON TABLE "public"."workout_logs" TO "authenticated";



GRANT INSERT("client_id") ON TABLE "public"."workout_logs" TO "authenticated";



GRANT INSERT("set_number") ON TABLE "public"."workout_logs" TO "authenticated";



GRANT INSERT("weight_kg"),UPDATE("weight_kg") ON TABLE "public"."workout_logs" TO "authenticated";



GRANT INSERT("actual_reps"),UPDATE("actual_reps") ON TABLE "public"."workout_logs" TO "authenticated";



GRANT INSERT("completed"),UPDATE("completed") ON TABLE "public"."workout_logs" TO "authenticated";



GRANT INSERT("logged_at"),UPDATE("logged_at") ON TABLE "public"."workout_logs" TO "authenticated";



GRANT UPDATE("deleted_at") ON TABLE "public"."workout_logs" TO "authenticated";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































drop extension if exists "pg_net";

revoke references on table "public"."workout_logs" from "anon";

revoke trigger on table "public"."workout_logs" from "anon";

revoke truncate on table "public"."workout_logs" from "anon";

revoke references on table "public"."workout_logs" from "authenticated";

revoke trigger on table "public"."workout_logs" from "authenticated";

revoke truncate on table "public"."workout_logs" from "authenticated";


