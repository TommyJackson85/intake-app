-- Impersonation sessions: audit log for developer sudo impersonation.
-- Used for GDPR accountability; supports start/end timestamps and metadata.
-- RLS: only service-role should access (no direct user access).

CREATE TABLE IF NOT EXISTS public.impersonation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  impersonator_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  impersonated_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  reason text,
  env text NOT NULL DEFAULT 'development',
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT env_check CHECK (env IN ('development', 'staging', 'production'))
);

CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_impersonator ON public.impersonation_sessions(impersonator_user_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_impersonated ON public.impersonation_sessions(impersonated_user_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_started ON public.impersonation_sessions(started_at DESC);

COMMENT ON TABLE public.impersonation_sessions IS 'Audit log for developer sudo impersonation. Used for support/debugging under legitimate interest. GDPR: access logged and access-controlled.';
