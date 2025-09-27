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

/**
 * Clean up staging files after they've been moved to final locations.
 * This helps prevent access to old staging files that are no longer referenced.
 */
export async function cleanupStagingFiles(
  supabase: SupabaseClient,
  stagingId: string,
  userId: string
) {
  const stagingPrefix = `user/${userId}/staging/${stagingId}/`;
  
  try {
    // List all files in the staging directory
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET)
      .list(stagingPrefix, { limit: 1000 });

    if (listError) {
      console.error('Error listing staging files:', listError);
      return { success: false, error: listError.message };
    }

    if (!files || files.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    // Delete all staging files
    const filePaths = files.map(file => `${stagingPrefix}${file.name}`);
    const { error: deleteError } = await supabase.storage
      .from(BUCKET)
      .remove(filePaths);

    if (deleteError) {
      console.error('Error deleting staging files:', deleteError);
      return { success: false, error: deleteError.message };
    }

    return { success: true, deletedCount: files.length };
  } catch (error) {
    console.error('Unexpected error cleaning up staging files:', error);
    return { success: false, error: 'Unexpected error during cleanup' };
  }
}
