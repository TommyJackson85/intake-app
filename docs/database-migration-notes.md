# Database Migration Notes

## Terms Acceptance Migration

After running the migration `20250216000000_add_terms_acceptance.sql`, you need to:

### 1. Regenerate Database Types

The TypeScript database types in `lib/database.types.ts` are auto-generated from your Supabase schema. After running the migration, regenerate them:

**Option A: Using Supabase CLI**
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts
```

**Option B: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the TypeScript types
4. Replace the contents of `lib/database.types.ts`

### 2. Verify New Fields

After regenerating types, verify that `profiles` table includes:
- `terms_accepted_at: string | null`
- `terms_version: string | null`
- `privacy_accepted_at: string | null`

### 3. Handle Existing Users

Existing users will have `NULL` values for these fields. The application handles this by:
- Redirecting users to `/auth/accept-terms` if `terms_accepted_at` is null or `terms_version` doesn't match current version
- Allowing users to complete the terms acceptance flow

### 4. Migration SQL

The migration adds:
```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp with time zone;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_version text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS privacy_accepted_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_profiles_terms_version ON public.profiles(terms_version);
```

### 5. Backward Compatibility

The application is designed to handle:
- Users with `NULL` terms fields (prompts for acceptance)
- Users with old terms versions (prompts for re-acceptance)
- Users without firms (redirects to firm-setup)

No data migration is required for existing users - they will be prompted to accept terms on next login.
