-- RLS for clients, matters, leads, aml_checks, audit_logs.
-- Uses profiles.firm_id for tenant isolation (no firm_users table).
-- Service-role bypasses RLS; intake API and dashboard APIs use service-role.

-- ============================================
-- CLIENTS
-- ============================================
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read clients for own firm" ON public.clients;
CREATE POLICY "Users can read clients for own firm"
  ON public.clients FOR SELECT TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Users can insert clients for own firm" ON public.clients;
CREATE POLICY "Users can insert clients for own firm"
  ON public.clients FOR INSERT TO authenticated
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Users can update clients for own firm" ON public.clients;
CREATE POLICY "Users can update clients for own firm"
  ON public.clients FOR UPDATE TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    )
  )
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Users can delete clients for own firm" ON public.clients;
CREATE POLICY "Users can delete clients for own firm"
  ON public.clients FOR DELETE TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    )
  );

-- ============================================
-- MATTERS
-- ============================================
ALTER TABLE public.matters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read matters for own firm" ON public.matters;
CREATE POLICY "Users can read matters for own firm"
  ON public.matters FOR SELECT TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Users can insert matters for own firm" ON public.matters;
CREATE POLICY "Users can insert matters for own firm"
  ON public.matters FOR INSERT TO authenticated
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Users can update matters for own firm" ON public.matters;
CREATE POLICY "Users can update matters for own firm"
  ON public.matters FOR UPDATE TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    )
  )
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Users can delete matters for own firm" ON public.matters;
CREATE POLICY "Users can delete matters for own firm"
  ON public.matters FOR DELETE TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    )
  );

-- ============================================
-- LEADS (intake API uses service-role, bypasses RLS)
-- ============================================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read leads for own firm" ON public.leads;
CREATE POLICY "Users can read leads for own firm"
  ON public.leads FOR SELECT TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Users can insert leads for own firm" ON public.leads;
CREATE POLICY "Users can insert leads for own firm"
  ON public.leads FOR INSERT TO authenticated
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Users can update leads for own firm" ON public.leads;
CREATE POLICY "Users can update leads for own firm"
  ON public.leads FOR UPDATE TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    )
  )
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Users can delete leads for own firm" ON public.leads;
CREATE POLICY "Users can delete leads for own firm"
  ON public.leads FOR DELETE TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    )
  );

-- ============================================
-- AML_CHECKS
-- ============================================
ALTER TABLE public.aml_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read aml_checks for own firm" ON public.aml_checks;
CREATE POLICY "Users can read aml_checks for own firm"
  ON public.aml_checks FOR SELECT TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Users can insert aml_checks for own firm" ON public.aml_checks;
CREATE POLICY "Users can insert aml_checks for own firm"
  ON public.aml_checks FOR INSERT TO authenticated
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Users can update aml_checks for own firm" ON public.aml_checks;
CREATE POLICY "Users can update aml_checks for own firm"
  ON public.aml_checks FOR UPDATE TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    )
  )
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    )
  );

-- ============================================
-- AUDIT_LOGS (read-only for users; inserts via service-role)
-- ============================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read audit_logs for own firm" ON public.audit_logs;
CREATE POLICY "Users can read audit_logs for own firm"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (
    (firm_id IN (
      SELECT firm_id FROM public.profiles
      WHERE id = auth.uid() AND firm_id IS NOT NULL
    ))
    OR (user_id = auth.uid())
  );
