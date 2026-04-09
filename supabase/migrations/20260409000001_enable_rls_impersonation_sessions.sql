-- Enable RLS on impersonation_sessions — denies all non-service-role access by default
ALTER TABLE public.impersonation_sessions ENABLE ROW LEVEL SECURITY;
