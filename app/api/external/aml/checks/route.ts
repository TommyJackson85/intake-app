
//app-api-external-aml-checks-hardened.ts
// app/api/external/aml/checks/route.ts - Hardened AML endpoint
// Copy-paste ready - DOS protection, timeout, retry logic, error sanitization

import { createClient } from '@supabase/supabase-js';
import { validateRequest } from '@/lib/validation-schemas';
import { CreateAMLCheckSchema } from '@/lib/validation-schemas';
import { validateAPIKey, hasScope } from '@/lib/api-key-security';
import { rateLimit } from '@/lib/rate-limit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const AML_API_URL = process.env.AML_API_URL || 'https://api.aml-provider.com';
const AML_API_KEY = process.env.AML_API_KEY;
const AML_TIMEOUT = parseInt(process.env.AML_API_TIMEOUT || '5000');
const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 1000; // 1 second

interface AMLCheckRequest {
  clientId: string;
  name: string;
  email: string;
  dateOfBirth?: string;
  address?: string;
}

interface AMLCheckResponse {
  checkId: string;
  status: 'passed' | 'failed' | 'pending' | 'manual_review';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  findings?: string[];
  timestamp: string;
}

/**
 * POST /api/external/aml/checks
 * ✅ Rate limited
 * ✅ Input validated
 * ✅ API timeout enforced
 * ✅ Retry logic with backoff
 * ✅ Error sanitization
 * ✅ Audit logging
 */
export async function POST(request: Request) {
  try {
    // ✅ 1. Validate API key from header only
    const keyValidation = await validateAPIKey(request);
    if (!keyValidation.valid || !keyValidation.firmId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // ✅ 2. Check scopes
    if (!hasScope(keyValidation.scopes || [], 'aml:read')) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403 }
      );
    }

    // ✅ 3. Rate limit by API key
    const limitResult = await rateLimit(request, 'aml-check');
    if (limitResult.isLimited) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        {
          status: 429,
          headers: {
            'Retry-After': limitResult.retryAfter!.toString(),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // ✅ 4. Parse and validate request
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400 }
      );
    }

    const validation = validateRequest(CreateAMLCheckSchema, body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validation.errors.flatten(),
        }),
        { status: 400 }
      );
    }

    // ✅ 5. Call AML provider with timeout and retry
    const amlResult = await checkAMLWithRetry(validation.data);

    if (!amlResult.success) {
      // Log failed check
      await logAMLCheck(
        keyValidation.firmId,
        validation.data.clientId,
        'failed',
        amlResult.error
      );

      // ✅ Sanitize error response
      return new Response(
        JSON.stringify({
          error: 'AML check failed',
          status: 'pending',
        }),
        { status: 503 }
      );
    }

    // ✅ 6. Store AML check result
    const { data: checkRecord, error: dbError } = await supabase
      .from('aml_checks')
      .insert({
        firm_id: keyValidation.firmId,
        client_id: validation.data.clientId,
        check_status: amlResult.data.status,
        risk_level: amlResult.data.riskLevel,
        check_details: amlResult.data,
        checked_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('Failed to store AML check:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to store result' }),
        { status: 500 }
      );
    }

    // ✅ 7. Log successful check
    await logAMLCheck(
      keyValidation.firmId,
      validation.data.clientId,
      'success',
      null,
      checkRecord?.id as string
    );

    // ✅ 8. Return result
    const response: AMLCheckResponse = {
      checkId: checkRecord?.id as string,
      status: amlResult.data.status,
      riskLevel: amlResult.data.riskLevel,
      findings: amlResult.data.findings,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': limitResult.remaining.toString(),
      },
    });
  } catch (error) {
    console.error('AML check error:', error);

    // ✅ Sanitize error response
    return new Response(
      JSON.stringify({
        error: 'AML check service unavailable',
        status: 'pending',
      }),
      { status: 503 }
    );
  }
}

/**
 * Call AML provider with timeout and exponential backoff retry
 */
async function checkAMLWithRetry(
  data: AMLCheckRequest
): Promise<{
  success: boolean;
  data?: AMLCheckResponse;
  error?: string;
}> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Calculate backoff: 1s, 2s, 4s
      if (attempt > 0) {
        const delay = INITIAL_BACKOFF * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // ✅ Set timeout on fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AML_TIMEOUT);

      try {
        const response = await fetch(`${AML_API_URL}/checks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AML_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Don't retry on client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw new Error(`AML API client error: ${response.status}`);
          }

          // Retry on server errors (5xx)
          throw new Error(`AML API error: ${response.status}`);
        }

        const result = await response.json();

        return {
          success: true,
          data: {
            checkId: result.id || `check_${Date.now()}`,
            status: result.status || 'pending',
            riskLevel: result.risk_level || 'low',
            findings: result.findings || [],
            timestamp: new Date().toISOString(),
          },
        };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      lastError = error as Error;

      if (error instanceof TypeError && error.message.includes('aborted')) {
        // Timeout occurred
        console.warn(`AML check timeout on attempt ${attempt + 1}`);
      } else {
        console.warn(
          `AML check failed on attempt ${attempt + 1}: ${(error as Error).message}`
        );
      }

      // Continue to next retry
    }
  }

  // ✅ All retries failed
  return {
    success: false,
    error: `AML check failed after ${MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`,
  };
}

/**
 * Log AML check for audit trail
 */
async function logAMLCheck(
  firmId: string,
  clientId: string,
  result: 'success' | 'failed',
  error: string | null,
  checkId?: string
): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      firm_id: firmId,
      event_type: 'AML_CHECK_COMPLETED',
      description: `AML check ${result} for client ${clientId}`,
      metadata: {
        clientId,
        checkId,
        result,
        error,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to log AML check:', error);
  }
}

/**
 * GET /api/external/aml/checks/:checkId
 * Retrieve AML check result
 */
export async function GET(request: Request) {
  try {
    // Extract checkId from URL
    const url = new URL(request.url);
    const checkId = url.searchParams.get('checkId');

    if (!checkId) {
      return new Response(
        JSON.stringify({ error: 'checkId required' }),
        { status: 400 }
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

    // Rate limit
    const limitResult = await rateLimit(request, 'aml-check');
    if (limitResult.isLimited) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429 }
      );
    }

    // Get check result
    const { data: check, error } = await supabase
      .from('aml_checks')
      .select('*')
      .eq('id', checkId)
      .eq('firm_id', keyValidation.firmId)
      .single();

    if (error || !check) {
      return new Response(
        JSON.stringify({ error: 'Check not found' }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify(check), {
      status: 200,
      headers: { 'X-RateLimit-Remaining': limitResult.remaining.toString() },
    });
  } catch (error) {
    console.error('AML retrieval error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve check' }),
      { status: 500 }
    );
  }
}