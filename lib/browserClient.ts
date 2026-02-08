// lib/browserClient.ts
'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    '@supabase/ssr: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. Check Vercel env vars.'
  );
}

export function createSupabaseBrowserClient() {
  if (!url || !anonKey) {
    throw new Error('Supabase browser client missing env vars');
  }

  return createBrowserClient<Database>(url, anonKey);
}
