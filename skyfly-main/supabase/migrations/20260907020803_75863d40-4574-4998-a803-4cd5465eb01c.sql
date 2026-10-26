-- Per-student daily dashboard tasks
CREATE TABLE public.daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  duration_minutes INT NOT NULL DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_tasks TO authenticated;
GRANT ALL ON public.daily_tasks TO service_role;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own daily tasks" ON public.daily_tasks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Per-student daily study goal and derived progress
CREATE TABLE public.study_goals (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_goal_minutes INT NOT NULL DEFAULT 60,
  studied_today_minutes INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.study_goals TO authenticated;
GRANT ALL ON public.study_goals TO service_role;
ALTER TABLE public.study_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own study goal" ON public.study_goals FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Keep derived progress owned by the task state, not by client-provided values.
CREATE OR REPLACE FUNCTION public.sync_study_goal_from_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_user_id UUID;
BEGIN
  affected_user_id := COALESCE(NEW.user_id, OLD.user_id);

  INSERT INTO public.study_goals (user_id)
  VALUES (affected_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.study_goals
  SET studied_today_minutes = COALESCE((
    SELECT SUM(duration_minutes)
    FROM public.daily_tasks
    WHERE user_id = affected_user_id AND done = true
  ), 0),
  updated_at = now()
  WHERE user_id = affected_user_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.sync_study_goal_from_tasks() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER daily_tasks_sync_study_goal
AFTER INSERT OR UPDATE OF done, duration_minutes OR DELETE ON public.daily_tasks
FOR EACH ROW EXECUTE FUNCTION public.sync_study_goal_from_tasks();

CREATE TRIGGER study_goals_updated_at
BEFORE UPDATE ON public.study_goals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();