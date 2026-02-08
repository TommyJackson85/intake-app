// app/api/public/leads/route.ts - FIXED public leads endpoint
// Copy-paste ready - with correct logAuditEvent signature

import { createClient } from '@supabase/supabase-js';
import { validateRequest } from '@/lib/validation-schemas';
import { CreateLeadSchema } from '@/lib/validation-schemas';
import { rateLimit } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/auditLog';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/public/leads
 * Public endpoint for lead capture (e.g., from website forms)
 * ✅ Rate limited (10 submissions per hour per IP)
 * ✅ Input validated
 * ✅ Audit logged
 * ✅ No authentication required
 */
export async function POST(request: Request) {
  try {
    // ✅ 1. RATE LIMITING - prevent spam
    const limitResult = await rateLimit(request, 'public-leads');

    if (limitResult.isLimited) {
      return new Response(
        JSON.stringify({
          error: 'Too many submissions. Please try again later.',
        }),
        {
          status: 429,
          headers: {
            'Retry-After': limitResult.retryAfter!.toString(),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // ✅ 2. PARSE REQUEST
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400 }
      );
    }

    // ✅ 3. VALIDATE INPUT
    const validation = validateRequest(CreateLeadSchema, body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validation.errors.flatten(),
        }),
        { status: 400 }
      );
    }

    const leadData = validation.data;

    // Get client IP for audit trail
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // ✅ 4. CREATE LEAD IN DATABASE
    const { data: lead, error: createError } = await supabase
      .from('marketing_leads')
      .insert({
        first_name: leadData.firstName,
        last_name: leadData.lastName,
        email: leadData.email,
        phone: leadData.phone || null,
        matter_type: leadData.matterType,
        property_address: leadData.propertyAddress || null,
        budget: leadData.budget || null,
        timeline: leadData.timeline || null,
        notes: leadData.notes || null,
        source: leadData.source || 'website_form',
        status: 'new',
        submitted_at: new Date().toISOString(),
        ip_address: clientIp,
      })
      .select('id')
      .single();

    if (createError || !lead) {
      console.error('Failed to create lead:', createError);

      return new Response(
        JSON.stringify({ error: 'Failed to submit lead' }),
        { status: 500 }
      );
    }

    // ✅ 5. LOG AUDIT EVENT
    // Signature: logAuditEvent(firmId, userId, eventType, resourceType, resourceId, metadata?)
    await logAuditEvent(
      'marketing',           // firmId - special system firm for public leads
      null,                  // userId - no user for public endpoint
      'lead_submitted',      // eventType
      'marketing_lead',      // resourceType
      lead.id,              // resourceId
      {                     // metadata (optional)
        email: leadData.email,
        matterType: leadData.matterType,
        source: leadData.source || 'website_form',
        ip: clientIp,
      }
    );

    // ✅ 6. RETURN SUCCESS
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Lead submitted successfully',
        leadId: lead.id,
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': limitResult.remaining.toString(),
        },
      }
    );
  } catch (error) {
    console.error('Public leads endpoint error:', error);

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}

/**
 * GET /api/public/leads
 * Return form schema for public lead submission
 */
export async function GET(request: Request) {
  try {
    return new Response(
      JSON.stringify({
        message: 'POST your lead data to this endpoint',
        schema: {
          firstName: 'string (required)',
          lastName: 'string (required)',
          email: 'string (required, email format)',
          phone: 'string (optional, E.164 format)',
          matterType: 'enum (required): real_estate_purchase | real_estate_sale | conveyancing | lease_agreement | property_dispute | other',
          propertyAddress: 'string (optional)',
          budget: 'number (optional, positive)',
          timeline: 'enum (optional): urgent | soon | flexible',
          notes: 'string (optional, max 2000 chars)',
          source: 'enum (optional): website_form | google_search | facebook | referral | previous_client | other',
        },
        rateLimit: {
          maxRequests: 10,
          windowMinutes: 60,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('GET public leads error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get form schema' }),
      { status: 500 }
    );
  }
}