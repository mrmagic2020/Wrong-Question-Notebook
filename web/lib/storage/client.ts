import { createClient } from '@/lib/supabase/client';

const BUCKET = 'problem-uploads';

export async function getUserId() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Not signed in');
  return data.user.id;
}

/**
 * role: "problem" | "solution"
 * stagingId: a stable ID per form session (e.g., crypto.randomUUID())
 * Upload path:
 *   user/{uid}/staging/{stagingId}/{role}/{originalName}
 */
export async function uploadFiles(
  files: FileList | File[],
  role: 'problem' | 'solution',
  stagingId: string
) {
  const supabase = createClient();
  const uid = await getUserId();
  const base = `user/${uid}/staging/${stagingId}/${role}`;

  // Validate file sizes before upload
  const maxSize = 10 * 1024 * 1024; // 10MB
  const oversizedFiles: string[] = [];
  
  Array.from(files).forEach(file => {
    if (file.size > maxSize) {
      oversizedFiles.push(file.name);
    }
  });

  if (oversizedFiles.length > 0) {
    throw new Error(`Files too large: ${oversizedFiles.join(', ')}. Maximum file size is 10MB.`);
  }

  const paths: string[] = [];
  for (const f of Array.from(files)) {
    const safeName = f.name.replace(/\s+/g, '_');
    const path = `${base}/${safeName}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, f, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) throw error;
    paths.push(path);
  }
  return paths;
}

/** Create short-lived signed URLs for display; returns [{ path, url }] */
export async function signPaths(paths: string[], expiresInSec = 60 * 5) {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, expiresInSec);
  if (error) throw error;
  // data: [{ path, signedUrl, ... }]
  return (data ?? []).map((d: any) => ({
    path: d.path,
    url: d.signedUrl as string,
  }));
}
