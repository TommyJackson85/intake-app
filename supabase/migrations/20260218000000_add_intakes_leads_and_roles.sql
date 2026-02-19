-- Adds an intake/leads table (client intake links) and normalizes roles/dev flags.
-- Apply via Supabase migrations / SQL editor.

-- ============================================================================
-- 1) Profiles: make role consistent + add dev sudo + client linkage
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_dev_sudo boolean NOT NULL DEFAULT false;

-- profiles.role already exists in this project in most setups; ensure it has a default.
ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'lawyer';

UPDATE public.profiles
SET role = 'lawyer'
WHERE role IS NULL;

-- Optional linkage for client portal accounts (one auth profile maps to one client row).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS client_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_client_id_fkey'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- 2) Leads/Intakes table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  assigned_to_user_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Client contact (captured by the lawyer when generating the link, and/or by the client during intake)
  client_full_name text NULL,
  client_email text NOT NULL,
  client_phone text NULL,

  -- Matter context
  matter_type text NOT NULL,
  property_address text NULL,
  notes text NULL,

  -- Intake payload (step-by-step form answers)
  intake_data jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Lifecycle
  status text NOT NULL DEFAULT 'new', -- new | in_review | waiting_on_client | qualified | converted | closed | rejected
  submitted_at timestamptz NULL,
  last_client_activity_at timestamptz NULL,

  -- Secure link access: store ONLY a hash of the token.
  portal_token_hash text NULL UNIQUE,
  portal_token_created_at timestamptz NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_firm_id ON public.leads(firm_id);
CREATE INDEX IF NOT EXISTS idx_leads_firm_status ON public.leads(firm_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_portal_token_hash ON public.leads(portal_token_hash);

-- updated_at trigger helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_leads_set_updated_at'
  ) THEN
    CREATE TRIGGER trg_leads_set_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

