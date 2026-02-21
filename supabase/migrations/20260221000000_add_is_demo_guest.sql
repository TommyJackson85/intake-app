-- Add is_demo_guest to profiles.
-- True for the shared demo-lawyer account (Flow A: anonymous home-page demo).
-- False for real users or users who linked via use-demo-firm (Flow B).
-- Used to drive demo banner CTA: "Create your account" vs "Register your law firm".

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_demo_guest boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_is_demo_guest ON public.profiles(is_demo_guest) WHERE is_demo_guest = true;
