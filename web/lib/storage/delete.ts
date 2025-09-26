// web/lib/storage/delete.ts
import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'problem-uploads';

/**
 * Recursively lists ALL file paths (not folders) under a prefix.
 * Supabase returns both folders and files from .list(). We detect files by metadata !== null.
 */
async function listFilesRecursive(
  supabase: SupabaseClient,
  prefix: string
): Promise<string[]> {
  const files: string[] = [];
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
    limit: 1000,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  });
  if (error || !data) return files;

  for (const entry of data) {
    const isFolder = entry.metadata == null; // folders have null metadata
    if (isFolder) {
      // dive into subfolder
      const subPrefix = `${prefix}${entry.name}/`;
      const subFiles = await listFilesRecursive(supabase, subPrefix);
      files.push(...subFiles);
    } else {
      files.push(`${prefix}${entry.name}`);
    }
  }
  return files;
}

/** Delete all files anywhere under user/{uid}/problems/{problemId}/ */
export async function deleteProblemFiles(
  supabase: SupabaseClient,
  userId: string,
  problemId: string
) {
  const base = `user/${userId}/problems/${problemId}/`;
  const allFiles = await listFilesRecursive(supabase, base);
  if (!allFiles.length) return;
  await supabase.storage.from(BUCKET).remove(allFiles);
}
