-- Bookmarks for static catalog content (notes, pyqs, quizzes, mock tests)
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_type, item_id)
);
GRANT SELECT, INSERT, DELETE ON public.bookmarks TO authenticated;
GRANT ALL ON public.bookmarks TO service_role;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bookmarks" ON public.bookmarks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Recently viewed catalog items (e.g. notes)
CREATE TABLE public.recent_views (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, item_type, item_id)
);
GRANT SELECT, INSERT, UPDATE ON public.recent_views TO authenticated;
GRANT ALL ON public.recent_views TO service_role;
ALTER TABLE public.recent_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own recent views" ON public.recent_views FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Study planner items
CREATE TABLE public.planner_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL DEFAULT 'task',
  subject TEXT,
  duration_minutes INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planner_items TO authenticated;
GRANT ALL ON public.planner_items TO service_role;
ALTER TABLE public.planner_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own planner items" ON public.planner_items FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Dashboard daily checklist
CREATE TABLE public.daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_tasks TO authenticated;
GRANT ALL ON public.daily_tasks TO service_role;
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own daily tasks" ON public.daily_tasks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Dashboard study goal
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

CREATE TRIGGER study_goals_updated_at BEFORE UPDATE ON public.study_goals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Follows
CREATE TABLE public.follows (
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows viewable by authenticated" ON public.follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users follow as self" ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users unfollow own" ON public.follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- Atomic like/unlike
CREATE OR REPLACE FUNCTION public.increment_post_likes(p_post_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = p_post_id;
$$;

CREATE OR REPLACE FUNCTION public.decrement_post_likes(p_post_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = p_post_id;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_post_likes(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.decrement_post_likes(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_post_likes(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_post_likes(uuid) TO authenticated;