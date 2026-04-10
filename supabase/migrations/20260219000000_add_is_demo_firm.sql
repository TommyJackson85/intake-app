-- Add is_demo_firm to firms.
-- Demo firms are shared sandbox tenants for prospective lawyers to try the app.
-- Distinct from is_test_firm (dev signup creates a test firm per developer).

ALTER TABLE public.firms
  ADD COLUMN IF NOT EXISTS is_demo_firm boolean NOT NULL DEFAULT false;

-- Optional index for filtering demo firms
CREATE INDEX IF NOT EXISTS idx_firms_is_demo_firm ON public.firms(is_demo_firm) WHERE is_demo_firm = true;
