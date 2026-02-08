// app/auth/signup/signupAction.ts
'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';

async function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Supabase env vars missing (URL or ANON key)');
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: '', ...options, maxAge: 0 });
      },
    },
  });
}

export async function signUpAction(
  email: string,
  password: string,
  firmName: string,
  usState: string
) {
  const supabase = await getServerSupabase();

  // 1) Public signup with anon key
  const { data, error } = await supabase.auth.signUp({
    email,
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

  // 2) Create firm row for this user
  const { error: firmError } = await supabase
    .from('firms')
    .insert({
      name: firmName,
      state: usState,
    });

  if (firmError) {
    console.error('signUpAction firms.insert error:', firmError);
    throw new Error('Account created but firm setup failed');
  }

  return { userId };
}