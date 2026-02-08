// app/api/external/leads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getFirmFromApiKey } from '@/lib/get-firm-from-api-key'
import { logAuditEvent } from '@/lib/auditLog'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'// service-role client

// app/api/external/leads/route.ts - HARDENED VERSION
// Security fixes: API key from Authorization header, rate limiting, validation, error sanitization
import { validateAPIKey, hasScope } from '@/lib/api-key-security';
import { rateLimit } from '@/lib/rate-limit';
import { validateRequest } from '@/lib/validation-schemas';
import { CreateLeadSchema } from '@/lib/validation-schemas';

// app/api/external/leads/route.ts - Fixed version
// Fixed: audit log event types to match your database schema

import { createClient } from '@supabase/supabase-js';


const supabase = await createSupabaseServerClientStrict()

/**
 * POST /api/external/leads
 * Public endpoint for external integrations to create leads
 * 
 * ✅ Rate limited (10 per hour per IP)
 * ✅ API key validated (header-only, constant-time comparison)
 * ✅ Input validated with Zod schemas
 * ✅ Scope checked (requires 'leads:write')
 * ✅ Audit logged
 */
export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting and audit
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // ✅ 1. Rate limit first (cheapest check)
    const limitResult = await rateLimit(request, 'public-leads');
    if (limitResult.isLimited) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          retryAfter: limitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Retry-After': limitResult.retryAfter!.toString(),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(limitResult.resetTime).toISOString(),
          },
        }
      );
    }

    // ✅ 2. Validate API key from Authorization header only
    const keyValidation = await validateAPIKey(request);
    if (!keyValidation.valid || !keyValidation.firmId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // ✅ 3. Check API key scope
    if (!hasScope(keyValidation.scopes || [], 'leads:write')) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403 }
      );
    }

    // ✅ 4. Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400 }
      );
    }

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

    // ✅ 5. Create lead in database
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        firm_id: keyValidation.firmId,
        first_name: validation.data.firstName,
        last_name: validation.data.lastName,
        email: validation.data.email,
        phone: validation.data.phone || null,
        matter_type: validation.data.matterType,
        property_address: validation.data.propertyAddress || null,
        budget: validation.data.budget || null,
        timeline: validation.data.timeline || null,
        notes: validation.data.notes || null,
        source: validation.data.source || 'api',
        status: 'new',
        created_at: new Date().toISOString(),
      })
      .select('id, email, status')
      .single();

    if (leadError) {
      console.error('Lead creation error:', leadError);

      // ✅ Log failed lead creation attempt
      await logLeadEvent(
        keyValidation.firmId,
        'create',
        null,
        `Lead creation failed: ${leadError.message}`,
        clientIp
      );

      return new Response(
        JSON.stringify({ error: 'Failed to create lead' }),
        { status: 500 }
      );
    }

    // ✅ 6. Log successful lead creation
    await logLeadEvent(
      keyValidation.firmId,
      'create',
      lead?.id as string,
      `Lead created via API from ${validation.data.source || 'external'}`,
      clientIp
    );

    // ✅ 7. Return success response with rate limit headers
    return new Response(
      JSON.stringify({
        success: true,
        id: lead?.id,
        email: lead?.email,
        status: lead?.status,
        message: 'Lead created successfully',
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': limitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(limitResult.resetTime).toISOString(),
        },
      }
    );
  } catch (error) {
    console.error('External leads API error:', error);

    // ✅ Sanitize error response (don't expose stack trace)
    return new Response(
      JSON.stringify({
        error: 'Failed to process request',
        ...(process.env.NODE_ENV === 'development' && {
          debug: (error as Error).message,
        }),
      }),
      { status: 500 }
    );
  }
}

/**
 * GET /api/external/leads/:id
 * Retrieve lead details (requires API key)
 */
export async function GET(request: Request) {
  try {
    // Rate limiting
    const limitResult = await rateLimit(request, 'public-leads');
    if (limitResult.isLimited) {
      return new Response(
        JSON.stringify({ error: 'Too many requests' }),
        { status: 429 }
      );
    }

    // Validate API key
    const keyValidation = await validateAPIKey(request);
    if (!keyValidation.valid) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Check scope
    if (!hasScope(keyValidation.scopes || [], 'leads:read')) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403 }
      );
    }

    // Get lead ID from URL
    const url = new URL(request.url);
    const leadId = url.searchParams.get('id');

    if (!leadId) {
      return new Response(
        JSON.stringify({ error: 'Lead ID required' }),
        { status: 400 }
      );
    }

    // Fetch lead (only from user's firm)
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('firm_id', keyValidation.firmId)
      .single();

    if (error || !lead) {
      return new Response(
        JSON.stringify({ error: 'Lead not found' }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify(lead), {
      status: 200,
      headers: {
        'X-RateLimit-Remaining': limitResult.remaining.toString(),
      },
    });
  } catch (error) {
    console.error('Lead retrieval error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve lead' }),
      { status: 500 }
    );
  }
}

/**
 * Log lead events to audit trail
 * Uses event types that match your database schema
 */
async function logLeadEvent(
  firmId: string,
  eventType: 'create' | 'read' | 'update' | 'delete',
  entityId: string | null,
  description: string,
  clientIp: string
): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      firm_id: firmId,
      user_id: null, // API key authentication, no specific user
      event_type: eventType,
      entity_type: 'lead',
      entity_id: entityId,
      description,
      ip_address: clientIp,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log lead event:', error);
    // Don't throw - audit logging failure shouldn't break lead creation
  }
}