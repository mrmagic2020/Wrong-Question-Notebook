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

export async function deleteStagingFolder(
  supabase: SupabaseClient,
  userId: string,
  stagingId: string
) {
  const base = `user/${userId}/staging/${stagingId}/`;
  const all = await listFilesRecursive(supabase, base);
  if (all.length) {
    await supabase.storage.from(BUCKET).remove(all);
  }
}

/**
 * Clean up old staging folders (older than 24 hours) for a user
 * This is a safety net for cases where cleanup events might have failed
 */
export async function cleanupOldStagingFolders(
  supabase: SupabaseClient,
  userId: string,
  maxAgeHours = 24
) {
  const base = `user/${userId}/staging/`;
  const { data: folders, error } = await supabase.storage.from(BUCKET).list(base, {
    limit: 1000,
    sortBy: { column: 'created_at', order: 'asc' },
  });

  if (error || !folders) return;

  const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
  const oldFolders = folders.filter(folder => {
    const folderTime = new Date(folder.created_at).getTime();
    return folderTime < cutoffTime;
  });

  for (const folder of oldFolders) {
    const folderPath = `${base}${folder.name}/`;
    const files = await listFilesRecursive(supabase, folderPath);
    if (files.length > 0) {
      await supabase.storage.from(BUCKET).remove(files);
    }
  }
}
