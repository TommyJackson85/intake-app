-- Add terms acceptance fields to profiles table
-- This migration adds fields to track when users accepted terms and which version

-- Add terms acceptance timestamp
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp with time zone;

-- Add terms version (string to track version like "1.0", "2.0", etc.)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_version text;

-- Add privacy policy acceptance timestamp (optional, for future use)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS privacy_accepted_at timestamp with time zone;

-- Create index for efficient queries on terms version
CREATE INDEX IF NOT EXISTS idx_profiles_terms_version ON public.profiles(terms_version);

-- For existing users, set a default version if needed
-- This allows them to be prompted to accept updated terms
-- UPDATE public.profiles SET terms_version = NULL WHERE terms_accepted_at IS NULL;
