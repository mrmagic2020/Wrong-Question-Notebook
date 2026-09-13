-- Fix: SECURITY DEFINER RPCs and RLS write policies trusted caller-controlled ids.
--
-- Every function in this schema was created without an explicit grant, so
-- PostgreSQL's default `EXECUTE ... TO PUBLIC` applied and PostgREST exposed
-- all of them to `anon` and `authenticated`. Because a SECURITY DEFINER body
-- runs as the owner (postgres), the auth.uid() policies on problems/attempts
-- never evaluate against the caller -- the RPC tunnels straight past RLS.
--
-- Several RLS write policies had the complementary flaw: they constrained a
-- row's user_id but not the foreign keys it points at, so a caller could plant
-- rows that other users' reads (or SECURITY DEFINER joins) then trusted.
--
-- Every issue below was reproduced against the local stack before this
-- migration, using only the publishable key plus, where noted, an ordinary
-- user's own session. Direct reads of the victim's rows through RLS correctly
-- returned [] throughout.
--
-- Sections:
--
--   1. Service-role-only RPCs. Functions only ever invoked through
--      createServiceClient() are removed from the public API surface. The
--      owning route already derives the user from the session.
--
--   2. User-scoped RPCs. Functions invoked with the end user's own SSR client
--      keep their signature but verify the argument against auth.uid().
--
--   3. SECURITY DEFINER joins. Functions that identify the caller correctly
--      but then join through a caller-writable row are pinned to the owner.
--
--   4. RLS write policies. Inserts/updates must own what they reference.
--
-- Functions redefined here gain a pinned empty search_path with
-- schema-qualified bodies -- an unpinned search_path on a SECURITY DEFINER
-- function is its own escalation vector, and the project already standardises
-- on this (see 20260428032151 and 20260911070156). CREATE OR REPLACE keeps each
-- function's existing grants.

-- =====================================================================
-- 1. Service-role-only RPCs
--
-- Proven (anon, no session):
--   rpc/get_uncategorised_attempts {p_user_id: <victim>}
--     -> victim's problem content, correct answers, submitted answers and
--        reflection notes
--   rpc/toggle_problem_set_like -> like row attributed to an arbitrary user id
--   rpc/get_user_statistics()   -> platform-wide user and admin totals
--   rpc/compute_problem_set_count(<private set id>) -> 3, the exact size of a
--     private set (and, for smart sets, filter_config evaluated against that
--     owner's problems)
--   rpc/refresh_ranking_scores  -> 204, overwrote planted sentinel values on
--     problem_set_stats; three unbounded UPDATEs across every public set whose
--     cost scales with the table, not the request
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

-- Called by app/api/files/[path] (createServiceClient). Low severity on its
-- own -- it returns only a problem uuid for a known storage path, and the route
-- gates the download behind can_view_problem() -- but it is service-only.
REVOKE ALL ON FUNCTION public.find_problem_by_asset(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_problem_by_asset(text) TO service_role;

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

-- No application callers. Leaked the member count of arbitrary private sets.
-- Its one real caller is the ensure_problem_set_stats() trigger, which is
-- itself SECURITY DEFINER owned by postgres, so the nested call is checked as
-- postgres and is unaffected (verified: an authenticated user inserting a
-- problem set still gets its stats row).
REVOKE ALL ON FUNCTION public.compute_problem_set_count(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.compute_problem_set_count(uuid) TO service_role;

-- No callers at all. Batch recompute intended for trusted/scheduled invocation.
REVOKE ALL ON FUNCTION public.refresh_ranking_scores() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_ranking_scores() TO service_role;

-- =====================================================================
-- 2. User-scoped RPCs -- enforce the caller's identity
--
-- All four are called from app/[locale]/(app)/statistics/page.tsx with the
-- user's own SSR client, passing the id from auth.getUser(). The guard is
-- deliberately strict: a NULL auth.uid() (anon, or a service-role connection)
-- is rejected rather than treated as trusted, since both present as NULL.
--
-- get_recent_study_activity additionally pins its joins to the owner. Proven
-- (authenticated): the "insert own history" policy only checked user_id, so
--   POST problem_status_history {user_id: <self>, problem_id: <victim problem>} -> 201
--   rpc/get_recent_study_activity {p_user_id: <self>}
--     -> victim's problem_title and subject_name
-- Section 4 also closes the insert itself.
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
  JOIN public.problems p ON p.id = psh.problem_id AND p.user_id = p_user_id
  JOIN public.subjects s ON s.id = p.subject_id AND s.user_id = p_user_id
  WHERE psh.user_id = p_user_id
  ORDER BY psh.changed_at DESC
  LIMIT 5;
END;
$function$;

-- =====================================================================
-- 3. SECURITY DEFINER joins through caller-writable rows
--
-- These already filter on auth.uid(), but join from a row the caller can
-- write (review_schedule: RLS only checks user_id) or to rows other users can
-- point at (problems.subject_id). Pinning each join to the owner does not
-- narrow any legitimate result: spaced-repetition sessions are only started
-- for the user's own subjects, and the copy routes already verify the target
-- subject belongs to the copier.
--
-- Proven (authenticated):
--   POST review_schedule {user_id: <self>, problem_id: <victim problem>} -> 201
--   rpc/get_due_problems_for_subject {p_subject_id: <victim subject>}
--     -> the victim's entire problems row, including content and correct_answer
--   rpc/get_due_problems_count -> the victim's subject_id with a due count
--   POST/PATCH problems {subject_id: <victim subject>} -> 201/204
--   rpc/get_subjects_with_metadata (as victim) -> problem_count 1 -> 3
-- =====================================================================

-- Called from app/api/review-sessions/start-spaced with the user's SSR client.
CREATE OR REPLACE FUNCTION public.get_due_problems_for_subject(p_subject_id uuid, p_limit integer DEFAULT 20)
 RETURNS SETOF public.problems
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT p.*
  FROM public.review_schedule rs
  JOIN public.problems p ON p.id = rs.problem_id AND p.user_id = auth.uid()
  WHERE rs.user_id = auth.uid()
    AND p.subject_id = p_subject_id
    AND rs.next_review_at <= now()
  ORDER BY rs.next_review_at ASC
  LIMIT p_limit;
$function$;

-- No application callers, but reachable through PostgREST by authenticated.
CREATE OR REPLACE FUNCTION public.get_due_problems_count()
 RETURNS TABLE(subject_id uuid, due_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT p.subject_id, COUNT(*) AS due_count
  FROM public.review_schedule rs
  JOIN public.problems p ON p.id = rs.problem_id AND p.user_id = auth.uid()
  WHERE rs.user_id = auth.uid()
    AND rs.next_review_at <= now()
  GROUP BY p.subject_id;
$function$;

-- Called from app/api/subjects and the subjects page with the user's SSR
-- client. Section 4 stops new foreign problems entering a subject; the owner
-- join here also discounts any that were planted before this migration.
CREATE OR REPLACE FUNCTION public.get_subjects_with_metadata()
 RETURNS TABLE(id uuid, user_id uuid, name text, color text, icon text, created_at timestamp with time zone, problem_count bigint, last_activity timestamp with time zone, due_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT
    s.id,
    s.user_id,
    s.name,
    s.color,
    s.icon,
    s.created_at,
    COALESCE(COUNT(p.id), 0)::bigint as problem_count,
    MAX(p.last_reviewed_date) as last_activity,
    COALESCE(due.cnt, 0)::bigint as due_count
  FROM public.subjects s
  LEFT JOIN public.problems p ON p.subject_id = s.id AND p.user_id = s.user_id
  LEFT JOIN (
    SELECT p2.subject_id, COUNT(*)::bigint AS cnt
    FROM public.review_schedule rs
    JOIN public.problems p2 ON p2.id = rs.problem_id AND p2.user_id = auth.uid()
    WHERE rs.user_id = auth.uid() AND rs.next_review_at <= now()
    GROUP BY p2.subject_id
  ) due ON due.subject_id = s.id
  WHERE s.user_id = auth.uid()
  GROUP BY s.id, s.user_id, s.name, s.color, s.icon, s.created_at, due.cnt
  ORDER BY s.created_at ASC;
$function$;

-- =====================================================================
-- 4. RLS write policies -- require ownership of referenced rows
--
-- WITH CHECK applies only to rows being written, so existing data is not
-- re-validated by this migration. service_role bypasses RLS, so the app's
-- server-side writers are unaffected throughout.
-- =====================================================================

-- problem_status_history: the app never inserts directly -- rows come only
-- from the SECURITY DEFINER track_problem_status_change() trigger, which
-- bypasses RLS. Without an ownership check, a planted row on a victim's
-- problem is also hijacked by that trigger's ON CONFLICT (problem_id,
-- changed_date) upsert: the victim's real status change for that day lands in
-- the attacker-owned row and is missing from the victim's own history.
ALTER POLICY "Users can insert own history" ON public.problem_status_history
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.problems p
      WHERE p.id = problem_status_history.problem_id
        AND p.user_id = (SELECT auth.uid())
    )
  );

-- error_categorisations INSERT: named "Service role can insert" but granted
-- TO public WITH CHECK (true). Both app writers (lib/categorise-error.ts,
-- lib/digest-generator.ts) use createServiceClient(). Proven (anon, no
-- session): POST error_categorisations {user_id: <victim>, attempt_id:
-- <victim attempt>, topic_label: <arbitrary>} -> 201. The planted row then
--   - appeared in the victim's own categorisation list,
--   - satisfied categorise-error.ts's "already categorised?" lookup (and the
--     UNIQUE (attempt_id) constraint), so the real AI categorisation is skipped,
--   - and its topic_label was concatenated verbatim into the victim's Gemini
--     prompt as an "existing topic label" -- a prompt-injection vector.
ALTER POLICY "Service role can insert categorisations" ON public.error_categorisations
  TO service_role;

-- error_categorisations UPDATE: USING (and so the implicit check) only
-- constrained user_id. Proven (authenticated): PATCH own categorisation
-- {attempt_id: <victim's uncategorised attempt>} -> 204, claiming that attempt
-- so the victim's categorisation is skipped. The app's override route only
-- changes category fields, and every legitimate row is written for the
-- attempt's own user.
ALTER POLICY "Users can update own categorisations" ON public.error_categorisations
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.attempts a
      WHERE a.id = error_categorisations.attempt_id
        AND a.user_id = (SELECT auth.uid())
    )
  );

-- problems: subject_id was an unchecked FK, so a user could insert or move a
-- problem into another user's subject (see section 3). The app only ever
-- targets the user's own subjects -- the copy routes check this explicitly.
ALTER POLICY problems_insert_policy ON public.problems
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = problems.subject_id
        AND s.user_id = (SELECT auth.uid())
    )
  );

ALTER POLICY problems_update_policy ON public.problems
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.subjects s
      WHERE s.id = problems.subject_id
        AND s.user_id = (SELECT auth.uid())
    )
  );
