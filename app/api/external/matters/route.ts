// app/api/external/matters/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import { getFirmFromApiKey } from '@/lib/get-firm-from-api-key'
import { logAuditEvent } from '@/lib/auditLog'

import { assertScope, REQUIRED_SCOPES } from '@/lib/api-scope'
import { getFirmFromApiKeyWithScopes } from '@/lib/get-firm-api-key'

// app/api/external/matters/route.ts - Fixed TypeScript errors
// Fixed: Proper null checking for API key
import { validateRequest } from '@/lib/validation-schemas';
import { CreateMatterSchema } from '@/lib/validation-schemas';
import { validateAPIKey, hasScope } from '@/lib/api-key-security';
import { rateLimit } from '@/lib/rate-limit';


/**
 * POST /api/external/matters
 * Create a new matter
 *
 * ✅ API key validated (header-only)
 * ✅ Input validated with Zod
 * ✅ Scope checked (requires 'matters:write')
 * ✅ Rate limited
 * ✅ Audit logged
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClientStrict();

    // Get client IP for rate limiting
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // ✅ 1. Rate limit
    const limitResult = await rateLimit(request, 'api-general');
    if (limitResult.isLimited) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': limitResult.retryAfter!.toString(),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // ✅ 2. Validate API key from Authorization header only
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Invalid authorization format' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.slice(7); // Remove 'Bearer '

    // ✅ Null check: apiKey could be empty string
    if (!apiKey || apiKey.length === 0) {
      return NextResponse.json(
        { error: 'Missing API key' },
        { status: 401 }
      );
    }

    // Validate the API key using the new secure function
    const keyValidation = await validateAPIKey(request);
    if (!keyValidation.valid || !keyValidation.firmId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ✅ 3. Check scope
    if (!hasScope(keyValidation.scopes || [], 'matters:write')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // ✅ 4. Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    const validation = validateRequest(CreateMatterSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.errors.flatten(),
        },
        { status: 400 }
      );
    }

    // ✅ 5. Verify client belongs to firm
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, firm_id')
      .eq('id', validation.data.clientId)
      .eq('firm_id', keyValidation.firmId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found or unauthorized' },
        { status: 404 }
      );
    }

    // ✅ 6. Create matter
    const { data: matter, error: matterError } = await supabase
      .from('matters')
      .insert({
        client_id: validation.data.clientId,
        firm_id: keyValidation.firmId,
        title: validation.data.title,
        matter_type: validation.data.matterType,
        description: validation.data.description || null,
        assigned_to: validation.data.assignedTo || null,
        status: validation.data.status || 'open',
        budget: validation.data.budget || null,
        deadline: validation.data.deadline || null,
        created_at: new Date().toISOString(),
      })
      .select('id, title, status')
      .single();

    if (matterError) {
      console.error('Matter creation error:', matterError);

      // Log failed creation
      await logMatterEvent(
        keyValidation.firmId,
        'create',
        null,
        `Matter creation failed: ${matterError.message}`,
        clientIp
      );

      return NextResponse.json(
        { error: 'Failed to create matter' },
        { status: 500 }
      );
    }

    // ✅ 7. Log successful creation
    await logMatterEvent(
      keyValidation.firmId,
      'create',
      matter?.id as string,
      `Matter created: ${validation.data.title}`,
      clientIp
    );

    // ✅ 8. Return success
    return NextResponse.json(
      {
        success: true,
        id: matter?.id,
        title: matter?.title,
        status: matter?.status,
      },
      {
        status: 201,
        headers: {
          'X-RateLimit-Remaining': limitResult.remaining.toString(),
        },
      }
    );
  } catch (error) {
    console.error('External matters API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to process request',
        ...(process.env.NODE_ENV === 'development' && {
          debug: (error as Error).message,
        }),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/external/matters
 * List matters for a client
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClientStrict();

    // Rate limiting
    const limitResult = await rateLimit(request, 'api-general');
    if (limitResult.isLimited) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Validate API key
    const keyValidation = await validateAPIKey(request);
    if (!keyValidation.valid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check scope
    if (!hasScope(keyValidation.scopes || [], 'matters:read')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get client ID from query
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId required' },
        { status: 400 }
      );
    }

    // Fetch matters (only from user's firm)
    const { data: matters, error } = await supabase
      .from('matters')
      .select('*')
      .eq('client_id', clientId)
      .eq('firm_id', keyValidation.firmId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch matters' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { matters, count: matters?.length || 0 },
      {
        status: 200,
        headers: {
          'X-RateLimit-Remaining': limitResult.remaining.toString(),
        },
      }
    );
  } catch (error) {
    console.error('Matter retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve matters' },
      { status: 500 }
    );
  }
}

/**
 * Log matter events to audit trail
 */
async function logMatterEvent(
  firmId: string,
  eventType: 'create' | 'read' | 'update' | 'delete',
  entityId: string | null,
  description: string,
  clientIp: string
): Promise<void> {
  try {
    const supabase = createSupabaseServerClientStrict();
    await supabase.from('audit_logs').insert({
      firm_id: firmId,
      user_id: null, // API key authentication
      event_type: eventType,
      entity_type: 'matter',
      entity_id: entityId,
      description,
      ip_address: clientIp,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log matter event:', error);
  }
}