import { createClient } from '@/lib/supabase/client';
import { FILE_CONSTANTS } from '../constants';

export async function getUserId() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Not signed in');
  return data.user.id;
}

/**
 * role: "problem" | "solution"
 * problemId: the problem UUID (for new problems) or existing problem ID (for edits)
 * Upload path:
 *   user/{uid}/problems/{problemId}/{role}/{originalName}
 */
export async function uploadFiles(
  files: FileList | File[],
  role: 'problem' | 'solution',
  problemId: string
) {
  const supabase = createClient();
  const uid = await getUserId();
  const base = `user/${uid}/problems/${problemId}/${role}`;

  // Validate file sizes before upload
  const maxSize = FILE_CONSTANTS.MAX_FILE_SIZE.GENERAL;
  const oversizedFiles: string[] = [];

  Array.from(files).forEach(file => {
    if (file.size > maxSize) {
      oversizedFiles.push(file.name);
    }
  });

  if (oversizedFiles.length > 0) {
    throw new Error(
      `Files too large: ${oversizedFiles.join(', ')}. Maximum file size is 10MB.`
    );
  }

  const paths: string[] = [];
  for (const f of Array.from(files)) {
    const safeName = f.name.replace(/\s+/g, '_');
    const path = `${base}/${safeName}`;
    const { error } = await supabase.storage
      .from(FILE_CONSTANTS.STORAGE.BUCKET)
      .upload(path, f, {
        cacheControl: FILE_CONSTANTS.STORAGE.CACHE_CONTROL,
        upsert: false,
      });
    if (error) throw error;
    paths.push(path);
  }
  return paths;
}

/** Create short-lived signed URLs for display; returns [{ path, url }] */
export async function signPaths(
  paths: string[],
  expiresInSec = FILE_CONSTANTS.STORAGE.SIGNED_URL_EXPIRES_IN
) {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(FILE_CONSTANTS.STORAGE.BUCKET)
    .createSignedUrls(paths, expiresInSec);
  if (error) throw error;
  // data: [{ path, signedUrl, ... }]
  return (data ?? []).map((d: any) => ({
    path: d.path,
    url: d.signedUrl as string,
  }));
}
