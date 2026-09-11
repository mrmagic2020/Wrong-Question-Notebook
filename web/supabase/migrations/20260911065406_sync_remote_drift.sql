alter table "public"."attempts" drop constraint "attempts_selected_status_check";

alter table "public"."user_profiles" drop constraint "user_profiles_user_role_check";

alter table "public"."attempts" add constraint "attempts_selected_status_check" CHECK (((selected_status)::text = ANY ((ARRAY['wrong'::character varying, 'needs_review'::character varying, 'mastered'::character varying])::text[]))) not valid;

alter table "public"."attempts" validate constraint "attempts_selected_status_check";

alter table "public"."user_profiles" add constraint "user_profiles_user_role_check" CHECK (((user_role)::text = ANY ((ARRAY['user'::character varying, 'moderator'::character varying, 'admin'::character varying, 'super_admin'::character varying])::text[]))) not valid;

alter table "public"."user_profiles" validate constraint "user_profiles_user_role_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_problem_set_progress(problem_set_uuid uuid, user_uuid uuid)
 RETURNS TABLE(total_problems bigint, wrong_count bigint, needs_review_count bigint, mastered_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(psp.problem_id) as total_problems,
        COUNT(CASE WHEN p.status = 'wrong' THEN 1 END) as wrong_count,
        COUNT(CASE WHEN p.status = 'needs_review' THEN 1 END) as needs_review_count,
        COUNT(CASE WHEN p.status = 'mastered' THEN 1 END) as mastered_count
    FROM problem_set_problems psp
    JOIN problems p ON p.id = psp.problem_id
    WHERE psp.problem_set_id = problem_set_uuid
    AND psp.user_id = user_uuid;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_statistics()
 RETURNS TABLE(total_users bigint, active_users bigint, admin_users bigint, new_users_today bigint, new_users_this_week bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE is_active = true) as active_users,
        COUNT(*) FILTER (WHERE user_role IN ('admin', 'super_admin')) as admin_users,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as new_users_today,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_users_this_week
    FROM public.user_profiles;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_user_activity(p_action character varying, p_resource_type character varying DEFAULT NULL::character varying, p_resource_id uuid DEFAULT NULL::uuid, p_details jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO public.user_activity_log (
        user_id, action, resource_type, resource_id, details
    ) VALUES (
        auth.uid(), p_action, p_resource_type, p_resource_id, p_details
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;


