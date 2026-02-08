// app/auth/signup/signupAction.ts
'use server';

import { cookies } from 'next/headers';
import { createServerClient, createClient } from '@supabase/supabase-js';
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
  /** Omit for "register without firm" flow; user can add firm later from dashboard. */
  firmName?: string;
  usState?: string;
  /** Create a test law firm for developers (full feature access). */
  asDeveloper?: boolean;
};

/**
 * Sign up: with firm, without firm, or as developer (test firm).
 * User is logged in after signup; redirect to /dashboard.
 */
export async function signUpAction(options: SignUpOptions) {
  const { email, password, firmName, usState, asDeveloper = false } = options;
  const supabase = await getServerSupabase();

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

  const { error: profileError } = await admin
    .from('profiles')
    .upsert(
      {
        id: userId,
        email: email.trim(),
        firm_id: firmId,
      },
      { onConflict: 'id' }
    );

  if (profileError) {
    console.error('signUpAction profiles.upsert error:', profileError);
    throw new Error('Account created but profile setup failed');
  }

  const needsConfirmation = !data.session;
  return { userId, firmId, needsConfirmation };
}
