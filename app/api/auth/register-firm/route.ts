/**
 * POST /api/auth/register-firm
 * For users who signed up without a firm: create a law firm and link it to their profile.
 * Requires authenticated session (Supabase auth); profile must have firm_id = null.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from '@/lib/database.types';
import { getServerSupabase } from '@/lib/serverSupabase';
import { logAuditEvent } from '@/lib/auditLog';

const RegisterFirmSchema = z.object({
  name: z.string().trim().min(1).max(255),
  state: z.string().trim().length(2).regex(/^[A-Z]{2}$/).optional(),
  email_contact: z.string().email().optional().nullable(),
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const userId = user.id;

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const parsed = RegisterFirmSchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.errors.map(e => e.message).join(', ') }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const firmName = parsed.data.name;
    const state = parsed.data.state ?? '';
    const emailContact = parsed.data.email_contact ?? null;

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
    // Allow creating own firm when upgrading from demo (current firm is is_demo_firm)
    let fromDemo = false
    if (profile.firm_id) {
      const { data: currentFirm } = await admin
        .from('firms')
        .select('is_demo_firm')
        .eq('id', profile.firm_id)
        .single()
      if (!currentFirm?.is_demo_firm) {
        return new Response(
          JSON.stringify({ error: 'You already have a law firm registered' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      fromDemo = true
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
