// web/lib/storage/move.ts
import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'problem-uploads';

/** From a staged path -> final per-problem path */
export function toFinalPath(
  stagedPath: string,
  problemId: string,
  userId: string
) {
  // staged: user/{uid}/staging/{stagingId}/{role}/{file}
  // final : user/{uid}/problems/{problemId}/{role}/{file}
  const parts = stagedPath.split('/');
  const role = parts.at(-2)!; // "problem" | "solution"
  const file = parts.at(-1)!;
  return `user/${userId}/problems/${problemId}/${role}/${file}`;
}

/**
 * Move using the **user-scoped** supabase client (SSR/route handler client).
 * This works with your Storage RLS since the user owns both source and destination.
 */
export async function movePathsToProblemWithUser(
  supabase: SupabaseClient,
  paths: string[],
  problemId: string,
  userId: string
) {
  const results: { from: string; to: string; ok: boolean; error?: string }[] =
    [];

  for (const from of paths) {
    const to = toFinalPath(from, problemId, userId);
    if (from === to) {
      results.push({ from, to, ok: true });
      continue;
    }

    const { error } = await supabase.storage.from(BUCKET).move(from, to);
    if (error) {
      results.push({
        from,
        to,
        ok: false,
        error: String(error.message || error),
      });
    } else {
      results.push({ from, to, ok: true });
    }
  }

  return results;
}
