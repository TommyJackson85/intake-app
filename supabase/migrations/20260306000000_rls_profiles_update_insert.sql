-- RLS: Allow authenticated users to UPDATE and INSERT their own profile row.
-- Required so user-facing flows (accept-terms, leave-demo-firm, ensure profile) can use anon key + RLS
-- instead of service-role. Demo lawyer and normal users are constrained the same way (own row only).

-- Profiles: allow update of own row (e.g. terms_accepted_at, firm_id for leave-demo)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Profiles: allow insert of own row only (e.g. ensureProfileForUser when trigger missed)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());
