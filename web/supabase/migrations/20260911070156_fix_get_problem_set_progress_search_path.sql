-- Fix: get_problem_set_progress() fails at runtime with
--   ERROR: relation "problem_set_problems" does not exist
--
-- The function is SECURITY DEFINER with `SET search_path TO ''` (added to satisfy
-- the Supabase security advisor), but its body still references problem_set_problems
-- and problems unqualified. With an empty search_path nothing but pg_catalog is
-- resolvable, so every call errors.
--
-- Same fix as 20260428032151 applied to handle_new_user: keep the pinned empty
-- search_path and schema-qualify every object reference in the body.

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
    FROM public.problem_set_problems psp
    JOIN public.problems p ON p.id = psp.problem_id
    WHERE psp.problem_set_id = problem_set_uuid
    AND psp.user_id = user_uuid;
END;
$function$;
