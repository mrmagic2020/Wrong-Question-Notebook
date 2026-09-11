-- Silence a permanent, spurious `supabase db diff` difference on these two
-- CHECK constraints.
--
-- Root cause is a round-trip asymmetry in how Postgres stores CHECK expressions:
--
--   * Production's constraints were written as   CHECK (col IN ('a', 'b'))
--   * pg_get_constraintdef() renders that as
--       CHECK ((col)::text = ANY ((ARRAY['a'::varchar, 'b'::varchar])::text[]))
--   * Feeding THAT rendering back to Postgres does NOT reproduce the original
--     parse tree -- the cast is pushed into each element instead, giving
--       CHECK ((col)::text = ANY (ARRAY[('a'::varchar)::text, ('b'::varchar)::text]))
--
-- migra dumps the rendered form, so a local database built by replaying the
-- migrations always ended up with the per-element tree while production kept the
-- whole-array tree. The two are semantically identical, but migra compares parse
-- trees, so every `db diff` reported a drop/re-add of both constraints forever --
-- including immediately after a `db pull` that supposedly synced them.
--
-- Re-creating them from the IN form reproduces production's tree exactly, so the
-- diff goes quiet. Both tables are small (664 and 72 rows), so validation is
-- instant and no NOT VALID / VALIDATE split is needed.
--
-- If you ever hand-edit these constraints, write them as IN (...) to stay in sync.

ALTER TABLE public.attempts
  DROP CONSTRAINT IF EXISTS attempts_selected_status_check;
ALTER TABLE public.attempts
  ADD CONSTRAINT attempts_selected_status_check
  CHECK (selected_status IN ('wrong', 'needs_review', 'mastered'));

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_user_role_check;
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_user_role_check
  CHECK (user_role IN ('user', 'moderator', 'admin', 'super_admin'));
