-- Fix: SECURITY DEFINER RPCs trusted a caller-supplied user id.
--
-- Every function in this schema was created without an explicit grant, so
-- PostgreSQL's default `EXECUTE ... TO PUBLIC` applied and PostgREST exposed
-- all of them to `anon` and `authenticated`. Because a SECURITY DEFINER body
-- runs as the owner (postgres), the auth.uid() policies on problems/attempts
-- never evaluate against the caller -- the RPC tunnels straight past RLS.
--
-- Proven locally before this migration: holding only the publishable anon key,
-- with no session at all,
--   POST /rest/v1/rpc/get_uncategorised_attempts {"p_user_id":"<victim>"}
-- returned another user's problem content, correct answers, submitted answers
-- and reflection notes, while the equivalent GET /rest/v1/problems correctly
-- returned []. toggle_problem_set_like likewise wrote a row attributed to an
-- arbitrary user id.
--
-- Two mechanisms, applied per function according to how the app actually calls it:
--
--   1. Functions only ever invoked through createServiceClient() are removed
--      from the public API surface (REVOKE from PUBLIC/anon/authenticated,
--      GRANT to service_role). The owning route already derives the user from
--      the session, so nothing that legitimately calls them is affected.
--
--   2. Functions invoked with the end user's own SSR client keep their
--      signature but now verify the argument against auth.uid(). These also
--      gain a pinned empty search_path with schema-qualified bodies -- an
--      unpinned search_path on a SECURITY DEFINER function is its own
--      escalation vector, and the project already standardises on this
--      (see 20260428032151 and 20260911070156).

-- =====================================================================
-- 1. Service-role-only RPCs
-- =====================================================================

-- Called by lib/digest-generator.ts (createServiceClient)
REVOKE ALL ON FUNCTION public.get_uncategorised_attempts(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_uncategorised_attempts(uuid, integer) TO service_role;

-- Called by lib/digest-generator.ts and app/api/insights/generate (createServiceClient)
REVOKE ALL ON FUNCTION public.get_activity_summary(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_activity_summary(uuid) TO service_role;

-- Called by lib/digest-generator.ts (createServiceClient)
REVOKE ALL ON FUNCTION public.get_error_aggregation_data(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_error_aggregation_data(uuid) TO service_role;

-- Called by lib/content-limits.ts (createServiceClient)
REVOKE ALL ON FUNCTION public.get_user_storage_bytes(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_storage_bytes(uuid) TO service_role;

-- Called by app/api/problem-sets/[id]/copy and .../copy-problem (createServiceClient)
REVOKE ALL ON FUNCTION public.record_problem_set_copy(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_problem_set_copy(uuid, uuid) TO service_role;

-- Called by app/api/problem-sets/[id]/view (createServiceClient)
REVOKE ALL ON FUNCTION public.record_problem_set_view(uuid, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_problem_set_view(uuid, text, uuid) TO service_role;

-- Called by app/api/problem-sets/[id]/like (createServiceClient)
REVOKE ALL ON FUNCTION public.toggle_problem_set_like(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_problem_set_like(uuid, uuid) TO service_role;

-- Called by lib/storage/delete.ts (createServiceClient)
REVOKE ALL ON FUNCTION public.get_unreferenced_asset_paths(text[], uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_unreferenced_asset_paths(text[], uuid) TO service_role;

-- Called by app/api/discover and the discover page (createServiceClient)
REVOKE ALL ON FUNCTION public.get_discovery_subject_counts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_discovery_subject_counts() TO service_role;

-- Called by lib/user-management.ts (createServiceClient)
REVOKE ALL ON FUNCTION public.log_user_activity(character varying, character varying, uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_user_activity(character varying, character varying, uuid, jsonb) TO service_role;

-- No application callers. Platform-wide totals including the number of admin
-- accounts -- was readable by any anonymous caller.
REVOKE ALL ON FUNCTION public.get_user_statistics() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_statistics() TO service_role;

-- No application callers. Trusted both caller-supplied UUIDs, so progress for
-- any user's problem set could be read regardless of sharing_level.
REVOKE ALL ON FUNCTION public.get_problem_set_progress(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_problem_set_progress(uuid, uuid) TO service_role;

-- No application callers. Superseded by record_problem_set_copy, which dedupes
-- per user; left callable by service_role only so stats cannot be inflated.
REVOKE ALL ON FUNCTION public.increment_copy_count(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_copy_count(uuid) TO service_role;

-- =====================================================================
-- 2. User-scoped RPCs -- enforce the caller's identity
--
-- All four are called from app/[locale]/(app)/statistics/page.tsx with the
-- user's own SSR client, passing the id from auth.getUser(). The guard is
-- deliberately strict: a NULL auth.uid() (anon, or a service-role connection)
-- is rejected rather than treated as trusted, since both present as NULL.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_user_statistics(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'permission denied for function get_user_statistics'
      USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'total_problems', COUNT(*),
    'mastered_count', COUNT(*) FILTER (WHERE status = 'mastered'),
    'needs_review_count', COUNT(*) FILTER (WHERE status = 'needs_review'),
    'wrong_count', COUNT(*) FILTER (WHERE status = 'wrong'),
    'mastery_rate', CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND((COUNT(*) FILTER (WHERE status = 'mastered')::numeric / COUNT(*)) * 100, 1)
    END
  ) INTO result
  FROM public.problems
  WHERE user_id = p_user_id;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_session_statistics(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'permission denied for function get_session_statistics'
      USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'total_sessions', COUNT(*),
    'avg_duration_ms', COALESCE(AVG((session_state->>'elapsed_ms')::bigint), 0)::bigint,
    'avg_problems_per_session', COALESCE(
      AVG(jsonb_array_length(session_state->'completed_problem_ids') +
          jsonb_array_length(session_state->'skipped_problem_ids')), 0
    )::numeric(10,1),
    'total_review_time_ms', COALESCE(SUM((session_state->>'elapsed_ms')::bigint), 0)::bigint
  ) INTO result
  FROM public.review_session_state
  WHERE user_id = p_user_id AND is_active = false;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_subject_breakdown(p_user_id uuid)
 RETURNS TABLE(subject_id uuid, subject_name text, total bigint, mastered bigint, needs_review bigint, wrong bigint, mastery_pct numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'permission denied for function get_subject_breakdown'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    s.id AS subject_id,
    s.name AS subject_name,
    COUNT(p.id) AS total,
    COUNT(p.id) FILTER (WHERE p.status = 'mastered') AS mastered,
    COUNT(p.id) FILTER (WHERE p.status = 'needs_review') AS needs_review,
    COUNT(p.id) FILTER (WHERE p.status = 'wrong') AS wrong,
    CASE
      WHEN COUNT(p.id) = 0 THEN 0
      ELSE ROUND((COUNT(p.id) FILTER (WHERE p.status = 'mastered')::numeric / COUNT(p.id)) * 100, 1)
    END AS mastery_pct
  FROM public.subjects s
  LEFT JOIN public.problems p ON p.subject_id = s.id AND p.user_id = p_user_id
  WHERE s.user_id = p_user_id
  GROUP BY s.id, s.name
  ORDER BY total DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_recent_study_activity(p_user_id uuid)
 RETURNS TABLE(problem_id uuid, problem_title text, subject_name text, old_status text, new_status text, changed_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'permission denied for function get_recent_study_activity'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    psh.problem_id,
    p.title AS problem_title,
    s.name AS subject_name,
    psh.old_status,
    psh.new_status,
    psh.changed_at
  FROM public.problem_status_history psh
  JOIN public.problems p ON p.id = psh.problem_id
  JOIN public.subjects s ON s.id = p.subject_id
  WHERE psh.user_id = p_user_id
  ORDER BY psh.changed_at DESC
  LIMIT 5;
END;
$function$;
