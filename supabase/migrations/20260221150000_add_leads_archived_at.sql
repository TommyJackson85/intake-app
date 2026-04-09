-- Add archived_at to leads for retention cleanup (archive rejected leads before delete)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS archived_at timestamptz NULL;
