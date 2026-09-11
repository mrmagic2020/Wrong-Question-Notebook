-- Add the missing WITH CHECK to the avatar UPDATE policy.
--
-- USING only validates the row being changed, so a user could move their own
-- avatar into another user's folder (a storage move is an UPDATE on
-- storage.objects). Because the avatars bucket is public and profiles render
-- getPublicUrl('{uid}/avatar'), that replaced the avatar shown for that user.
--
-- WITH CHECK mirrors USING so the post-update row is constrained to the
-- owner's folder too. Deliberately does NOT constrain `owner`: avatars are
-- uploaded via the service client, which leaves owner NULL, so an
-- `owner = auth.uid()` term would evaluate NULL and deny every update.

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
  );;
