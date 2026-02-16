/**
 * POST /api/auth/register-firm
 * For users who signed up without a firm: create a law firm and link it to their profile.
 * Requires authenticated session; profile must have firm_id = null.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { getUserId } from '@/lib/session';
import { setSessionCookie } from '@/lib/session';
import { logAuditEvent } from '@/lib/auditLog';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let body: { name?: string; state?: string; email_contact?: string | null };
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const firmName = typeof body.name === 'string' ? body.name.trim() : '';
    const state = typeof body.state === 'string' ? body.state.trim() : '';
    const emailContact = typeof body.email_contact === 'string' ? body.email_contact.trim() : null;
    
    if (!firmName || !state) {
      return new Response(
        JSON.stringify({ error: 'name and state are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const admin = createClient<Database>(supabaseUrl, serviceRoleKey);

    const { data: profile } = await admin
      .from('profiles')
      .select('firm_id')
      .eq('id', userId)
      .single();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (profile.firm_id) {
      return new Response(
        JSON.stringify({ error: 'You already have a law firm registered' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: firm, error: firmError } = await admin
      .from('firms')
      .insert({ 
        name: firmName, 
        state,
        email_contact: emailContact || null,
      })
      .select('id')
      .single();

    if (firmError || !firm) {
      console.error('[register-firm] firms.insert error:', firmError);
      return new Response(
        JSON.stringify({ error: 'Failed to create firm' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error: updateError } = await admin
      .from('profiles')
      .update({ firm_id: firm.id })
      .eq('id', userId);

    if (updateError) {
      console.error('[register-firm] profiles.update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to link firm to account' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await setSessionCookie('firm_id', firm.id);
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip') || 'unknown';
    await logAuditEvent(
      firm.id,
      userId,
      'firm_registered',
      'firm',
      firm.id,
      { firmName, state, ip }
    );

    return new Response(
      JSON.stringify({ success: true, firmId: firm.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[register-firm] error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
