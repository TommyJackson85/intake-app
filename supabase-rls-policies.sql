- supabase-rls-policies.sql - Row-Level Security policies
-- Copy-paste ready - multi-tenancy data isolation
-- Apply these in Supabase SQL editor

-- ============================================
-- CLIENTS TABLE RLS
-- ============================================

CREATE POLICY "Users can read firm clients"
ON clients
FOR SELECT
USING (
  firm_id IN (
    SELECT firm_id FROM firm_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create clients for their firm"
ON clients
FOR INSERT
WITH CHECK (
  firm_id IN (
    SELECT firm_id FROM firm_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update firm clients"
ON clients
FOR UPDATE
USING (
  firm_id IN (
    SELECT firm_id FROM firm_users 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  firm_id IN (
    SELECT firm_id FROM firm_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete firm clients"
ON clients
FOR DELETE
USING (
  firm_id IN (
    SELECT firm_id FROM firm_users 
    WHERE user_id = auth.uid()
  )
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- ============================================
-- MATTERS TABLE RLS
-- ============================================

CREATE POLICY "Users can read matters for their clients"
ON matters
FOR SELECT
USING (
  client_id IN (
    SELECT id FROM clients WHERE firm_id IN (
      SELECT firm_id FROM firm_users 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can create matters for their clients"
ON matters
FOR INSERT
WITH CHECK (
  client_id IN (
    SELECT id FROM clients WHERE firm_id IN (
      SELECT firm_id FROM firm_users 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update their firm's matters"
ON matters
FOR UPDATE
USING (
  client_id IN (
    SELECT id FROM clients WHERE firm_id IN (
      SELECT firm_id FROM firm_users 
      WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  client_id IN (
    SELECT id FROM clients WHERE firm_id IN (
      SELECT firm_id FROM firm_users 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete their firm's matters"
ON matters
FOR DELETE
USING (
  client_id IN (
    SELECT id FROM clients WHERE firm_id IN (
      SELECT firm_id FROM firm_users 
      WHERE user_id = auth.uid()
    )
  )
);

ALTER TABLE matters ENABLE ROW LEVEL SECURITY;

-- ============================================
-- LEADS TABLE RLS
-- ============================================

CREATE POLICY "Users can read leads for their firm"
ON leads
FOR SELECT
USING (
  firm_id IN (
    SELECT firm_id FROM firm_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create leads for their firm"
ON leads
FOR INSERT
WITH CHECK (
  firm_id IN (
    SELECT firm_id FROM firm_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update leads for their firm"
ON leads
FOR UPDATE
USING (
  firm_id IN (
    SELECT firm_id FROM firm_users 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  firm_id IN (
    SELECT firm_id FROM firm_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete leads for their firm"
ON leads
FOR DELETE
USING (
  firm_id IN (
    SELECT firm_id FROM firm_users 
    WHERE user_id = auth.uid()
  )
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- ============================================
-- AML_CHECKS TABLE RLS
-- ============================================

CREATE POLICY "Users can read AML checks for their firm"
ON aml_checks
FOR SELECT
USING (
  firm_id IN (
    SELECT firm_id FROM firm_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create AML checks for their firm"
ON aml_checks
FOR INSERT
WITH CHECK (
  firm_id IN (
    SELECT firm_id FROM firm_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can read AML checks for their firm (2)"
ON aml_checks
FOR UPDATE
USING (
  firm_id IN (
    SELECT firm_id FROM firm_users 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  firm_id IN (
    SELECT firm_id FROM firm_users 
    WHERE user_id = auth.uid()
  )
);

ALTER TABLE aml_checks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SESSIONS TABLE RLS
-- ============================================

CREATE POLICY "Users can read their own sessions"
ON sessions
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own sessions"
ON sessions
FOR DELETE
USING (user_id = auth.uid());

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- AUDIT_LOGS TABLE RLS
-- ============================================

CREATE POLICY "Users can read audit logs for their firm"
ON audit_logs
FOR SELECT
USING (
  firm_id IN (
    SELECT firm_id FROM firm_users 
    WHERE user_id = auth.uid()
  )
  OR user_id = auth.uid()
);

-- Audit logs are append-only (no updates/deletes from regular users)
-- Only service role can insert

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- API_KEYS TABLE RLS
-- ============================================

-- API keys should NEVER be readable directly
-- Only the service role should access these for validation

CREATE POLICY "Service role only"
ON api_keys
FOR ALL
USING (false)
WITH CHECK (false);

-- Exception: Allow service role full access (auth bypass)
-- This is handled by Supabase automatically for service role key

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FIRM_USERS TABLE RLS
-- ============================================

CREATE POLICY "Users can read their firm membership"
ON firm_users
FOR SELECT
USING (
  user_id = auth.uid()
  OR firm_id IN (
    SELECT firm_id FROM firm_users 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can modify firm users"
ON firm_users
FOR UPDATE
USING (
  firm_id IN (
    SELECT firm_id FROM firm_users 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  firm_id IN (
    SELECT firm_id FROM firm_users 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can remove users"
ON firm_users
FOR DELETE
USING (
  firm_id IN (
    SELECT firm_id FROM firm_users 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

ALTER TABLE firm_users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these to verify RLS is enabled:

-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' AND rowsecurity = true;

-- SELECT tablename, policyname 
-- FROM pg_tables t 
-- LEFT JOIN pg_policies p ON t.tablename = p.tablename 
-- WHERE t.schemaname = 'public' 
-- ORDER BY tablename;

-- ============================================
-- TEST DATA ISOLATION
-- ============================================

-- As firm1_user (firm_id = firm1):
-- SELECT * FROM clients;  -- Should only see firm1's clients

-- As firm2_user (firm_id = firm2):
-- SELECT * FROM clients;  -- Should only see firm2's clients
-- Trying to see firm1's clients should return 0 rows

-- This is the multi-tenancy boundary that prevents data breaches