-- Learning credits reward system

CREATE TABLE public.credit_eligibility (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  class_level TEXT NOT NULL DEFAULT 'college',
  exam_track TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.credit_eligibility TO authenticated;
GRANT ALL ON public.credit_eligibility TO service_role;
ALTER TABLE public.credit_eligibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own eligibility select" ON public.credit_eligibility FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own eligibility insert" ON public.credit_eligibility FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own eligibility update" ON public.credit_eligibility FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER credit_eligibility_updated_at BEFORE UPDATE ON public.credit_eligibility
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.credit_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 0,
  lifetime_earned INT NOT NULL DEFAULT 0,
  lifetime_spent INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.credit_wallets TO authenticated;
GRANT ALL ON public.credit_wallets TO service_role;
ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wallet select" ON public.credit_wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER credit_wallets_updated_at BEFORE UPDATE ON public.credit_wallets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  activity TEXT NOT NULL,
  description TEXT,
  ref_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX credit_ledger_dedupe_idx ON public.credit_ledger(user_id, activity, ref_key) WHERE ref_key IS NOT NULL;
CREATE INDEX credit_ledger_user_created_idx ON public.credit_ledger(user_id, created_at DESC);
GRANT SELECT ON public.credit_ledger TO authenticated;
GRANT ALL ON public.credit_ledger TO service_role;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ledger select" ON public.credit_ledger FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Eligibility rule:
--  * Class 12, college, graduate and competitive-exam aspirants (UPSC, KPSC, NEET-PG, CAT, ...) always earn.
--  * Below Class 12 earns only while preparing for a national/state entrance exam
--    (JEE, NEET, CET, CUET, NTSE, KVPY, Olympiad, ...).
CREATE OR REPLACE FUNCTION public.is_credit_eligible(_user_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_level TEXT;
  v_track TEXT;
BEGIN
  SELECT class_level, coalesce(exam_track, '') INTO v_level, v_track
  FROM public.credit_eligibility WHERE user_id = _user_id;

  IF v_level IS NULL THEN
    RETURN false;
  END IF;

  IF v_level <> 'below_12' THEN
    RETURN true;
  END IF;

  RETURN upper(v_track) IN (
    'JEE', 'NEET', 'CET', 'CUET', 'NTSE', 'KVPY', 'OLYMPIAD', 'STATE_ENTRANCE', 'NATIONAL_ENTRANCE'
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.is_credit_eligible(uuid) TO authenticated;

-- Award credits for a genuine learning activity. Server-side amounts and daily cap.
CREATE OR REPLACE FUNCTION public.award_learning_credits(
  _activity TEXT,
  _ref_key TEXT DEFAULT NULL,
  _description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_amount INT;
  v_today INT;
  v_daily_cap CONSTANT INT := 60;
  v_balance INT;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  END IF;

  IF NOT public.is_credit_eligible(v_user) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_eligible');
  END IF;

  v_amount := CASE _activity
    WHEN 'study_goal_completed' THEN 5
    WHEN 'daily_task_completed' THEN 2
    WHEN 'practice_questions' THEN 3
    WHEN 'quiz_completed' THEN 4
    WHEN 'mock_test_completed' THEN 10
    WHEN 'score_improved' THEN 8
    WHEN 'streak_milestone' THEN 6
    WHEN 'mistake_resolved' THEN 3
    ELSE 0
  END;

  IF v_amount = 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unknown_activity');
  END IF;

  INSERT INTO public.credit_wallets (user_id) VALUES (v_user)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT coalesce(sum(amount), 0) INTO v_today
  FROM public.credit_ledger
  WHERE user_id = v_user AND amount > 0 AND created_at >= date_trunc('day', now());

  IF v_today + v_amount > v_daily_cap THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'daily_cap_reached', 'earned_today', v_today);
  END IF;

  BEGIN
    INSERT INTO public.credit_ledger (user_id, amount, activity, description, ref_key)
    VALUES (v_user, v_amount, _activity, _description, _ref_key);
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_awarded');
  END;

  UPDATE public.credit_wallets
  SET balance = balance + v_amount,
      lifetime_earned = lifetime_earned + v_amount
  WHERE user_id = v_user
  RETURNING balance INTO v_balance;

  RETURN jsonb_build_object('ok', true, 'amount', v_amount, 'balance', v_balance, 'activity', _activity);
END;
$$;
GRANT EXECUTE ON FUNCTION public.award_learning_credits(text, text, text) TO authenticated;

-- Spend credits on AI features / subscription usage.
CREATE OR REPLACE FUNCTION public.spend_learning_credits(_amount INT, _purpose TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_balance INT;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_amount');
  END IF;

  UPDATE public.credit_wallets
  SET balance = balance - _amount,
      lifetime_spent = lifetime_spent + _amount
  WHERE user_id = v_user AND balance >= _amount
  RETURNING balance INTO v_balance;

  IF v_balance IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_credits');
  END IF;

  INSERT INTO public.credit_ledger (user_id, amount, activity, description)
  VALUES (v_user, -_amount, 'spend', _purpose);

  RETURN jsonb_build_object('ok', true, 'balance', v_balance);
END;
$$;
GRANT EXECUTE ON FUNCTION public.spend_learning_credits(int, text) TO authenticated;