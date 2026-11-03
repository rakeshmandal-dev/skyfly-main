-- Migration 0009: Security & Storage Enhancements
-- 1. Storage RLS: Allow authenticated users to update their own documents and delete their own avatars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users update own documents'
  ) THEN
    CREATE POLICY "Users update own documents" ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1])
      WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users delete own avatar'
  ) THEN
    CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- 2. Post Likes RPC execution grants for authenticated students
GRANT EXECUTE ON FUNCTION public.increment_post_likes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_post_likes(UUID) TO authenticated;

-- 3. NGO Invites protection: Prevent arbitrary deletion of student invites
DROP POLICY IF EXISTS "invites deletable by authenticated" ON public.ngo_invites;
CREATE POLICY "invites deletable by service role or admin" ON public.ngo_invites FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

