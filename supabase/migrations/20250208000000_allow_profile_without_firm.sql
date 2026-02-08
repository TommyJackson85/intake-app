-- Allow users to have an account without a law firm (firm_id nullable).
-- Apply in Supabase SQL editor if your schema currently has profiles.firm_id NOT NULL.

-- 1. Make firm_id nullable so users can register first and add a firm later.
ALTER TABLE public.profiles
  ALTER COLUMN firm_id DROP NOT NULL;

-- 2. Optional: add a check so at most one profile per firm is "primary" if you add that later.
-- No change needed for basic no-firm flow.

-- 3. Ensure RLS (if used) allows profiles where firm_id IS NULL for the owning user.
-- If your policies reference firm_id, add conditions like:
--   (firm_id IS NOT NULL AND firm_id IN (...)) OR (firm_id IS NULL AND id = auth.uid())
