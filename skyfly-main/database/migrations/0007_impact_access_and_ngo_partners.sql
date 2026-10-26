CREATE TABLE public.ngo_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_email TEXT,
  referral_code TEXT NOT NULL UNIQUE,
  seeded_students INT NOT NULL DEFAULT 0,
  seeded_active_students INT NOT NULL DEFAULT 0,
  students_joined INT NOT NULL DEFAULT 0,
  active_students INT NOT NULL DEFAULT 0,
  invited_emails INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ngo_partners TO anon, authenticated;
GRANT ALL ON public.ngo_partners TO service_role;
ALTER TABLE public.ngo_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Partners readable by everyone" ON public.ngo_partners FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.impact_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  school_type TEXT NOT NULL CHECK (school_type IN ('government', 'government_aided')),
  income_declared BOOLEAN NOT NULL DEFAULT false,
  referral_code TEXT,
  partner_id UUID REFERENCES public.ngo_partners(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'approved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.impact_applications TO authenticated;
GRANT ALL ON public.impact_applications TO service_role;
ALTER TABLE public.impact_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own impact application select" ON public.impact_applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own impact application insert" ON public.impact_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own impact application update" ON public.impact_applications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.ngo_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.ngo_partners(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (partner_id, email)
);
GRANT SELECT, INSERT, DELETE ON public.ngo_invites TO authenticated;
GRANT ALL ON public.ngo_invites TO service_role;
ALTER TABLE public.ngo_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invites readable by authenticated" ON public.ngo_invites FOR SELECT TO authenticated USING (true);
CREATE POLICY "invites insertable by authenticated" ON public.ngo_invites FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "invites deletable by authenticated" ON public.ngo_invites FOR DELETE TO authenticated USING (true);

ALTER TABLE public.profiles
  ADD COLUMN impact_access BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN impact_partner_id UUID REFERENCES public.ngo_partners(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.sync_partner_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.partner_id IS NOT NULL THEN
    UPDATE public.ngo_partners
    SET students_joined = students_joined + 1,
        active_students = active_students + (CASE WHEN NEW.status = 'approved' THEN 1 ELSE 0 END)
    WHERE id = NEW.partner_id;
  ELSIF TG_OP = 'DELETE' AND OLD.partner_id IS NOT NULL THEN
    UPDATE public.ngo_partners
    SET students_joined = GREATEST(students_joined - 1, 0),
        active_students = GREATEST(active_students - (CASE WHEN OLD.status = 'approved' THEN 1 ELSE 0 END), 0)
    WHERE id = OLD.partner_id;
  END IF;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_partner_counts() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER impact_applications_partner_counts
AFTER INSERT OR DELETE ON public.impact_applications
FOR EACH ROW EXECUTE FUNCTION public.sync_partner_counts();

CREATE OR REPLACE FUNCTION public.sync_partner_invite_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.ngo_partners SET invited_emails = invited_emails + 1 WHERE id = NEW.partner_id;
  ELSE
    UPDATE public.ngo_partners SET invited_emails = GREATEST(invited_emails - 1, 0) WHERE id = OLD.partner_id;
  END IF;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_partner_invite_counts() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER ngo_invites_partner_counts
AFTER INSERT OR DELETE ON public.ngo_invites
FOR EACH ROW EXECUTE FUNCTION public.sync_partner_invite_counts();