-- Fix: signup trigger fails with "function generate_username_from_email(character varying)
-- does not exist" because handle_new_user() is SECURITY DEFINER without a pinned
-- search_path. Under GoTrue's signup session the public schema isn't on the search
-- path, so the unqualified call cannot be resolved.
--
-- Hardening (also satisfies Supabase security advisors):
--   1. SET search_path = public, pg_temp on every SECURITY DEFINER function.
--   2. Schema-qualify all object references inside SECURITY DEFINER bodies.
--   3. Apply the same to generate_username_from_email so it isn't fragile when called
--      from any future restricted-search_path context.

CREATE OR REPLACE FUNCTION public.generate_username_from_email(p_email text)
RETURNS text
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_prefix text;
  v_candidate text;
  v_attempt int := 0;
BEGIN
  v_prefix := lower(regexp_replace(split_part(p_email, '@', 1), '[^a-zA-Z0-9]', '', 'g'));

  IF length(v_prefix) < 3 THEN
    v_prefix := v_prefix || 'user';
  END IF;

  v_prefix := left(v_prefix, 20);

  LOOP
    v_attempt := v_attempt + 1;
    v_candidate := v_prefix || lpad(floor(random() * 10000)::text, 4, '0');

    IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE username = v_candidate) THEN
      RETURN v_candidate;
    END IF;

    IF v_attempt >= 5 THEN
      RETURN v_prefix || left(replace(gen_random_uuid()::text, '-', ''), 8);
    END IF;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  INSERT INTO public.user_profiles (id, username, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'username', ''),
      public.generate_username_from_email(COALESCE(NEW.email, NEW.id::text))
    ),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$function$;
;
