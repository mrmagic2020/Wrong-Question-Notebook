-- Follow-up to 20260911084312: two SECURITY DEFINER routines were left on the
-- public RPC surface. Neither takes a user id, so neither fell into that
-- migration's "trusts a caller-supplied identity" pattern, but both are
-- reachable by anon and authenticated through PostgREST and neither has an
-- application caller.
--
-- Proven locally before this migration, holding only the publishable anon key
-- with no session:
--
--   compute_problem_set_count(<private set id>)  -> 3
-- while the equivalent reads through RLS correctly returned []:
--   GET /rest/v1/problem_sets?id=eq.<id>          -> []
--   GET /rest/v1/problem_set_problems?...         -> []
-- The function reads problem_sets by id with no ownership or sharing_level
-- check, so it discloses the exact size of any user's private set, and for
-- smart sets evaluates filter_config against that owner's problems.
--
--   POST /rest/v1/rpc/refresh_ranking_scores      -> 204
-- overwrote planted sentinel values on problem_set_stats (ranking_score
-- 999.999 -> 0, problem_count 777 -> 3, updated_at 2000-01-01 -> now()),
-- whereas a direct anonymous PATCH of the same row changed nothing. It runs
-- three unbounded UPDATEs across every public set, including a correlated
-- subquery over problems for each smart set -- an unauthenticated global write
-- whose cost scales with the size of the table, not with the request.
--
-- Both are granted to service_role only, matching 20260911084312. This is a
-- separate migration rather than an edit to that one because it is already
-- pushed; migrations stay append-only once shared.
--
-- Note on the one caller that does exist: compute_problem_set_count is invoked
-- from ensure_problem_set_stats(), a trigger function. That function is itself
-- SECURITY DEFINER owned by postgres, so the nested call is privilege-checked
-- as postgres and is unaffected by revoking the web roles. Verified by
-- inserting a problem set as an ordinary authenticated user after applying
-- this migration and confirming the stats row is still created.

-- Only caller is the ensure_problem_set_stats() trigger, which runs as postgres.
-- No application caller; leaked the member count of arbitrary private sets.
REVOKE ALL ON FUNCTION public.compute_problem_set_count(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.compute_problem_set_count(uuid) TO service_role;

-- No callers at all. Batch recompute intended for trusted/scheduled invocation.
REVOKE ALL ON FUNCTION public.refresh_ranking_scores() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_ranking_scores() TO service_role;

-- Not part of the reported issue and low severity on its own: it returns only a
-- problem uuid, requires the caller to already know a storage path, and
-- app/api/files/[path] gates the actual download behind can_view_problem().
-- Revoked for consistency -- its only caller is that route's createServiceClient(),
-- so it meets the same "not part of the public API surface" rule 20260911084312
-- applied to the other service-only routines.
REVOKE ALL ON FUNCTION public.find_problem_by_asset(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_problem_by_asset(text) TO service_role;
