// web/lib/storage/delete.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { FILE_CONSTANTS, DATABASE_CONSTANTS } from '../constants';
import { createServiceClient } from '../supabase-utils';

/**
 * Recursively lists ALL file paths (not folders) under a prefix.
 * Supabase returns both folders and files from .list(). We detect files by metadata !== null.
 */
async function listFilesRecursive(
  supabase: SupabaseClient,
  prefix: string
): Promise<string[]> {
  const files: string[] = [];
  const { data, error } = await supabase.storage
    .from(FILE_CONSTANTS.STORAGE.BUCKET)
    .list(prefix, {
      limit: DATABASE_CONSTANTS.PAGINATION.MAX_LIMIT,
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

/**
 * Delete files under user/{uid}/problems/{problemId}/, skipping any file
 * that is still referenced by another problem's assets or solution_assets
 * (e.g. from a copied problem set).
 */
export async function deleteProblemFiles(
  supabase: SupabaseClient,
  userId: string,
  problemId: string
) {
  const base = `user/${userId}/problems/${problemId}/`;
  const allFiles = await listFilesRecursive(supabase, base);
  if (!allFiles.length) return;

  // Filter out files still referenced by other problems (copies).
  // If the RPC fails, bail out rather than deleting everything.
  const serviceClient = createServiceClient();
  const { data: safeToDelete, error: rpcError } = await serviceClient.rpc(
    'get_unreferenced_asset_paths',
    { p_paths: allFiles, p_exclude_problem_id: problemId }
  );

  if (rpcError) return;

  const filesToDelete: string[] = safeToDelete ?? [];
  if (!filesToDelete.length) return;

  await supabase.storage
    .from(FILE_CONSTANTS.STORAGE.BUCKET)
    .remove(filesToDelete);
}

// Staging-related functions removed - no longer needed with direct upload approach
