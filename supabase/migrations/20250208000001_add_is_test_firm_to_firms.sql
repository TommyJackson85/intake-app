-- Add is_test_firm flag to firms for developer test accounts.
-- Apply in Supabase SQL editor.

ALTER TABLE public.firms
  ADD COLUMN IF NOT EXISTS is_test_firm boolean NOT NULL DEFAULT false;

-- Optional: create index if you filter test firms often (e.g. exclude from analytics)
-- CREATE INDEX IF NOT EXISTS idx_firms_is_test_firm ON public.firms(is_test_firm) WHERE is_test_firm = true;
