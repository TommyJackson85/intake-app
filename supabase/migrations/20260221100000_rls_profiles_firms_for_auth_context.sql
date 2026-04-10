-- RLS policies so the auth context (browser client) can read profile + firm.
-- Without these, SELECT on profiles/firms returns 0 rows → firm is null → demo banner/badge never shows.

-- Enable RLS if not already (idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firms ENABLE ROW LEVEL SECURITY;

-- Profiles: authenticated users can read their own row
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Firms: authenticated users can read firms they belong to (profile.firm_id = firms.id)
DROP POLICY IF EXISTS "Users can read own firm" ON public.firms;
CREATE POLICY "Users can read own firm"
  ON public.firms FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    )
  );
