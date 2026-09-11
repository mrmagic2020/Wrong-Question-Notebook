-- Storage buckets and RLS policies
--
-- Buckets and objects are ROWS in the storage schema, not schema objects, so
-- `supabase db pull` never captures them. Without this migration a fresh local
-- stack has no buckets and every upload fails with "Bucket not found".
--
-- Transcribed verbatim from the hosted project so local mirrors production.
-- Idempotent: safe to replay locally and safe to push to an environment that
-- already has these objects.

-- =====================================================
-- Buckets
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'avatars',
    'avatars',
    true,
    2097152, -- 2 MiB, matches FILE_CONSTANTS.STORAGE.AVATAR_MAX_SIZE
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'problem-uploads',
    'problem-uploads',
    false,
    10485760, -- 10 MiB, matches FILE_CONSTANTS.MAX_FILE_SIZE.GENERAL
    ARRAY['image/*', 'application/pdf']
  )
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- avatars policies
-- Object path convention: {uid}/avatar
-- =====================================================

DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;
CREATE POLICY "Avatars are publicly viewable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

-- WITH CHECK is written out explicitly here, mirroring USING. It is NOT a
-- behaviour change: Postgres already reuses the USING expression as the
-- new-row check when WITH CHECK is omitted on an UPDATE policy, so the folder
-- constraint was always enforced. Stating it explicitly documents the intent
-- and matches the "owners can update their files" policy below, so a later
-- edit that widens USING cannot silently widen the new-row check with it.
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

-- =====================================================
-- problem-uploads policies
-- Object path convention: user/{uid}/problems/{problemId}/{role}/{filename}
-- =====================================================

DROP POLICY IF EXISTS "users can upload to own folder" ON storage.objects;
CREATE POLICY "users can upload to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'problem-uploads'
    AND (storage.foldername(name))[1] = 'user'
    AND (storage.foldername(name))[2] = (auth.uid())::text
  );

DROP POLICY IF EXISTS "owners can read their files" ON storage.objects;
CREATE POLICY "owners can read their files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'problem-uploads'
    AND (storage.foldername(name))[1] = 'user'
    AND (storage.foldername(name))[2] = (auth.uid())::text
  );

DROP POLICY IF EXISTS "owners can update their files" ON storage.objects;
CREATE POLICY "owners can update their files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'problem-uploads'
    AND (storage.foldername(name))[1] = 'user'
    AND (storage.foldername(name))[2] = (auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'problem-uploads'
    AND (storage.foldername(name))[1] = 'user'
    AND (storage.foldername(name))[2] = (auth.uid())::text
  );

DROP POLICY IF EXISTS "owners can delete their files" ON storage.objects;
CREATE POLICY "owners can delete their files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'problem-uploads'
    AND (storage.foldername(name))[1] = 'user'
    AND (storage.foldername(name))[2] = (auth.uid())::text
  );
