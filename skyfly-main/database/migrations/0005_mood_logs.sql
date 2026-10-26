CREATE TABLE public.mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood TEXT NOT NULL CHECK (mood IN ('low', 'neutral', 'good')),
  source TEXT NOT NULL DEFAULT 'mentor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mood_logs TO authenticated;
GRANT ALL ON public.mood_logs TO service_role;
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own mood select" ON public.mood_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own mood insert" ON public.mood_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own mood delete" ON public.mood_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX mood_logs_user_created_idx ON public.mood_logs(user_id, created_at DESC);