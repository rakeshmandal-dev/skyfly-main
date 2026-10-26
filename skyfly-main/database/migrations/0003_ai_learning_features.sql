CREATE TABLE public.mistakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  topic TEXT,
  question TEXT NOT NULL,
  user_answer TEXT,
  correct_answer TEXT,
  explanation TEXT,
  source TEXT NOT NULL DEFAULT 'quiz',
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mistakes TO authenticated;
GRANT ALL ON public.mistakes TO service_role;
ALTER TABLE public.mistakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own mistakes select" ON public.mistakes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own mistakes insert" ON public.mistakes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own mistakes update" ON public.mistakes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own mistakes delete" ON public.mistakes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX mistakes_user_subject_idx ON public.mistakes(user_id, subject);

CREATE TABLE public.career_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interests TEXT,
  marks TEXT,
  current_level TEXT,
  goal TEXT,
  plan_markdown TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.career_plans TO authenticated;
GRANT ALL ON public.career_plans TO service_role;
ALTER TABLE public.career_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own career select" ON public.career_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own career insert" ON public.career_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own career delete" ON public.career_plans FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.viva_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
  score INTEGER,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.viva_sessions TO authenticated;
GRANT ALL ON public.viva_sessions TO service_role;
ALTER TABLE public.viva_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own viva select" ON public.viva_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own viva insert" ON public.viva_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own viva update" ON public.viva_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own viva delete" ON public.viva_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);