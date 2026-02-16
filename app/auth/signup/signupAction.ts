// app/auth/signup/signupAction.ts
'use server';

import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getServerSupabase() {
  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase env vars missing (URL or ANON key)');
  }
  const cookieStore = await cookies();
  return createServerClient<Database>(supabaseUrl, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: Record<string, unknown>) {
        cookieStore.set({ name, value: '', ...options, maxAge: 0 });
      },
    },
  });
}

function getAdminSupabase() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service role key missing');
  }
  return createClient<Database>(supabaseUrl, serviceRoleKey);
}

const DEV_FIRM_NAME = 'Test Law Firm (Dev)';
const DEV_FIRM_STATE = 'FL';

export type SignUpOptions = {
  email: string;
  password: string;
  firmName?: string;
  usState?: string;
  asDeveloper?: boolean;
  termsAccepted: boolean;
};

/**
 * Sign up: with firm, without firm, or as developer (test firm).
 * Profile is auto-created by database trigger.
 */
export async function signUpAction(options: SignUpOptions) {
  const { email, password, firmName, usState, asDeveloper = false, termsAccepted } = options;
  
  if (!termsAccepted) {
    throw new Error('Terms acceptance is required');
  }
  
  const supabase = await getServerSupabase();
  
  // 1. Create the auth user (trigger will auto-create profile)
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });

  if (error) {
    console.error('signUpAction auth.signUp error:', error);
    throw new Error(error.message || 'Failed to create user');
  }

  const userId = data.user?.id;
  if (!userId) {
    throw new Error('User ID missing from Supabase response');
  }

  const admin = getAdminSupabase();
  let firmId: string | null = null;

  // 2. Create firm if needed
  if (asDeveloper) {
    const { data: firm, error: firmError } = await admin
      .from('firms')
      .insert({
        name: DEV_FIRM_NAME,
        state: DEV_FIRM_STATE,
        is_test_firm: true,
      })
      .select('id')
      .single();

    if (firmError || !firm) {
      console.error('signUpAction dev firm insert error:', firmError);
      throw new Error('Account created but test firm setup failed');
    }
    firmId = firm.id;
  } else if (firmName?.trim() && usState?.trim()) {
    const { data: firm, error: firmError } = await admin
      .from('firms')
      .insert({ name: firmName.trim(), state: usState.trim() })
      .select('id')
      .single();

    if (firmError || !firm) {
      console.error('signUpAction firms.insert error:', firmError);
      throw new Error('Account created but firm setup failed');
    }
    firmId = firm.id;
  }

  // 3. Wait briefly for trigger to create profile
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 4. Update profile with firm_id (if created) and terms acceptance
  const CURRENT_TERMS_VERSION = '1.0'; // TODO: Import from terms-config.ts
  const updateData: any = {
    terms_accepted_at: new Date().toISOString(),
    terms_version: CURRENT_TERMS_VERSION,
    privacy_accepted_at: new Date().toISOString(),
  };
  
  if (firmId) {
    updateData.firm_id = firmId;
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update(updateData)
    .eq('id', userId);

  if (profileError) {
    console.error('signUpAction profiles.update error:', profileError);
    throw new Error('Account created but profile update failed');
  }

  const needsConfirmation = !data.session;
  return { userId, firmId, needsConfirmation };
}
