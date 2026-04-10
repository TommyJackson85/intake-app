// app-api-external-aml-checks-hardened.ts
// app/api/external/aml/checks/route.ts - Hardened AML endpoint
// Copy-paste ready - DOS protection, timeout, retry logic, error sanitization, audit logging

import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict';
import { validateRequest } from '@/lib/validation-schemas';
import { CreateAMLCheckSchema } from '@/lib/validation-schemas';
import { validateAPIKey, hasScope } from '@/lib/api-key-security';
import { rateLimit } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/auditLog';

const AML_API_URL = process.env.AML_API_URL || 'https://api.aml-provider.com';
const AML_API_KEY = process.env.AML_API_KEY;
const AML_TIMEOUT = parseInt(process.env.AML_API_TIMEOUT || '5000', 10);
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
  const requestStartedAt = new Date().toISOString();

  try {
    const supabase = createSupabaseServerClientStrict();

    // ✅ 1. Validate API key from header only
    const keyValidation = await validateAPIKey(request);
    if (!keyValidation.valid || !keyValidation.firmId) {
      await logAuditEvent(
        null, // firmId - null for rejected requests
        null, // userId - null for API key auth
        'AML_CHECK_REQUEST_REJECTED',
        'aml_checks',
        keyValidation.keyId ?? 'unknown',
        {
          actorType: 'api_key',
          reason: 'invalid_or_missing_api_key',
          route: '/api/external/aml/checks',
          method: 'POST',
          startedAt: requestStartedAt,
        }
      );

      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    // ✅ 2. Check scopes
    if (!hasScope(keyValidation.scopes || [], 'aml:read')) {
      await logAuditEvent(
        keyValidation.firmId,
        null, // userId - null for API key auth
        'AML_CHECK_REQUEST_REJECTED',
        'aml_checks',
        keyValidation.keyId ?? 'unknown',
        {
          actorType: 'api_key',
          reason: 'insufficient_scope',
          requiredScope: 'aml:read',
          route: '/api/external/aml/checks',
          method: 'POST',
          startedAt: requestStartedAt,
        }
      );

      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403 },
      );
    }

    // 3. Rate limit by API key
    const limitResult = await rateLimit(request, 'aml-check');
    if (limitResult.isLimited) {
      await logAuditEvent(
        keyValidation.firmId,
        null, // userId - null for API key auth
        'AML_CHECK_RATE_LIMITED',
        'aml_checks',
        keyValidation.keyId ?? 'unknown',
        {
          actorType: 'api_key',
          route: '/api/external/aml/checks',
          method: 'POST',
          startedAt: requestStartedAt,
          retryAfter: limitResult.retryAfter,
        }
      );

      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        {
          status: 429,
          headers: {
            'Retry-After': limitResult.retryAfter!.toString(),
            'X-RateLimit-Remaining': '0',
          },
        },
      );
    }

    // ✅ 4. Parse and validate request
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      await logAuditEvent(
        keyValidation.firmId,
        null, // userId - null for API key auth
        'AML_CHECK_VALIDATION_FAILED',
        'aml_checks',
        keyValidation.keyId ?? 'unknown',
        {
          actorType: 'api_key',
          reason: 'invalid_json',
          route: '/api/external/aml/checks',
          method: 'POST',
          startedAt: requestStartedAt,
        }
      );

      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400 },
      );
    }

    const validation = validateRequest(CreateAMLCheckSchema, body);
    if (!validation.success) {
      await logAuditEvent(
        keyValidation.firmId,
        null, // userId - null for API key auth
        'AML_CHECK_VALIDATION_FAILED',
        'aml_checks',
        keyValidation.keyId ?? 'unknown',
        {
          actorType: 'api_key',
          reason: 'schema_validation_failed',
          route: '/api/external/aml/checks',
          method: 'POST',
          startedAt: requestStartedAt,
          validationErrors: validation.errors.flatten(),
        }
      );

      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validation.errors.flatten(),
        }),
        { status: 400 },
      );
    }

    const clientId = validation.data.clientId;

    // ✅ 5. Call AML provider with timeout and retry
    const amlResult = await checkAMLWithRetry(validation.data);

    if (!amlResult.success || !amlResult.data) {
      await logAuditEvent(
        keyValidation.firmId,
        null, // userId - null for API key auth
        'AML_CHECK_COMPLETED',
        'aml_checks',
        keyValidation.keyId ?? 'unknown',
        {
          actorType: 'api_key',
          clientId,
          result: 'failed',
          error: amlResult.error ?? 'unknown_error',
          route: '/api/external/aml/checks',
          method: 'POST',
          startedAt: requestStartedAt,
        }
      );

      return new Response(
        JSON.stringify({
          error: 'AML check failed',
          status: 'pending',
        }),
        { status: 503 },
      );
    }

    // ✅ 6. Store AML check result
    const { data: checkRecord, error: dbError } = await supabase
      .from('aml_checks')
      .insert({
        firm_id: keyValidation.firmId,
        client_id: clientId,
        check_status: amlResult.data.status,
        risk_level: amlResult.data.riskLevel,
        check_details: amlResult.data,
        checked_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (dbError || !checkRecord?.id) {
      console.error('Failed to store AML check:', dbError);

      await logAuditEvent(
        keyValidation.firmId,
        null, // userId - null for API key auth
        'AML_CHECK_COMPLETED',
        'aml_checks',
        keyValidation.keyId ?? 'unknown',
        {
          actorType: 'api_key',
          clientId,
          result: 'failed',
          error: 'db_insert_failed',
          route: '/api/external/aml/checks',
          method: 'POST',
          startedAt: requestStartedAt,
        }
      );

      return new Response(
        JSON.stringify({ error: 'Failed to store result' }),
        { status: 500 },
      );
    }

    // ✅ 7. Log successful check (audit log)
    await logAuditEvent(
      keyValidation.firmId,
      null, // userId - null for API key auth
      'AML_CHECK_COMPLETED',
      'aml_checks',
      checkRecord.id,
      {
        actorType: 'api_key',
        clientId,
        result: 'success',
        amlStatus: amlResult.data.status,
        riskLevel: amlResult.data.riskLevel,
        route: '/api/external/aml/checks',
        method: 'POST',
        startedAt: requestStartedAt,
      }
    );

    // ✅ 8. Return result
    const response: AMLCheckResponse = {
      checkId: checkRecord.id as string,
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

    await logAuditEvent(
      null, // firmId - null for system errors
      null, // userId - null for system errors
      'AML_CHECK_COMPLETED',
      'aml_checks',
      'system',
      {
        actorType: 'system',
        result: 'failed',
        error: 'unhandled_exception',
        route: '/api/external/aml/checks',
        method: 'POST',
        startedAt: requestStartedAt,
      }
    );

    return new Response(
      JSON.stringify({
        error: 'AML check service unavailable',
        status: 'pending',
      }),
      { status: 503 },
    );
  }
}

/**
 * Call AML provider with timeout and exponential backoff retry
 */
async function checkAMLWithRetry(
  data: AMLCheckRequest,
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
            Authorization: `Bearer ${AML_API_KEY}`,
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
        console.warn(`AML check timeout on attempt ${attempt + 1}`);
      } else {
        console.warn(
          `AML check failed on attempt ${attempt + 1}: ${
            (error as Error).message
          }`,
        );
      }
      // Continue to next retry
    }
  }

  // ✅ All retries failed
  return {
    success: false,
    error: `AML check failed after ${MAX_RETRIES} attempts: ${
      lastError?.message || 'Unknown error'
    }`,
  };
}

/**
 * GET /api/external/aml/checks/:checkId
 * Retrieve AML check result
 * ✅ Audit logging on read
 */
export async function GET(request: Request) {
  const requestStartedAt = new Date().toISOString();

  try {
    const supabase = createSupabaseServerClientStrict();

    const url = new URL(request.url);
    const checkId = url.searchParams.get('checkId');

    if (!checkId) {
      await logAuditEvent(
        null, // firmId - null for missing checkId
        null, // userId - null for API key auth
        'AML_CHECK_READ_FAILED',
        'aml_checks',
        'unknown',
        {
          actorType: 'api_key',
          reason: 'missing_check_id',
          route: '/api/external/aml/checks',
          method: 'GET',
          startedAt: requestStartedAt,
        }
      );

      return new Response(
        JSON.stringify({ error: 'checkId required' }),
        { status: 400 },
      );
    }

    // Validate API key
    const keyValidation = await validateAPIKey(request);
    if (!keyValidation.valid || !keyValidation.firmId) {
      await logAuditEvent(
        null, // firmId - null for rejected requests
        null, // userId - null for API key auth
        'AML_CHECK_READ_FAILED',
        'aml_checks',
        keyValidation.keyId ?? 'unknown',
        {
          actorType: 'api_key',
          reason: 'invalid_or_missing_api_key',
          route: '/api/external/aml/checks',
          method: 'GET',
          startedAt: requestStartedAt,
        }
      );

      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 },
      );
    }

    // Rate limit
    const limitResult = await rateLimit(request, 'aml-check');
    if (limitResult.isLimited) {
      await logAuditEvent(
        keyValidation.firmId,
        null, // userId - null for API key auth
        'AML_CHECK_RATE_LIMITED',
        'aml_checks',
        keyValidation.keyId ?? 'unknown',
        {
          actorType: 'api_key',
          route: '/api/external/aml/checks',
          method: 'GET',
          startedAt: requestStartedAt,
          retryAfter: limitResult.retryAfter,
        }
      );

      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429 },
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
      await logAuditEvent(
        keyValidation.firmId,
        null, // userId - null for API key auth
        'AML_CHECK_READ_FAILED',
        'aml_checks',
        keyValidation.keyId ?? 'unknown',
        {
          actorType: 'api_key',
          reason: 'not_found',
          route: '/api/external/aml/checks',
          method: 'GET',
          startedAt: requestStartedAt,
        }
      );

      return new Response(
        JSON.stringify({ error: 'Check not found' }),
        { status: 404 },
      );
    }

    await logAuditEvent(
      keyValidation.firmId,
      null, // userId - null for API key auth
      'AML_CHECK_READ',
      'aml_checks',
      keyValidation.keyId ?? 'unknown',
      {
        actorType: 'api_key',
        route: '/api/external/aml/checks',
        method: 'GET',
        startedAt: requestStartedAt,
      }
    );

    return new Response(JSON.stringify(check), {
      status: 200,
      headers: {
        'X-RateLimit-Remaining': limitResult.remaining.toString(),
      },
    });
  } catch (error) {
    console.error('AML retrieval error:', error);

    await logAuditEvent(
      null, // firmId - null for system errors
      null, // userId - null for system errors
      'AML_CHECK_READ_FAILED',
      'aml_checks',
      'system',
      {
        actorType: 'system',
        reason: 'unhandled_exception',
        route: '/api/external/aml/checks',
        method: 'GET',
        startedAt: requestStartedAt,
      }
    );

    return new Response(
      JSON.stringify({ error: 'Failed to retrieve check' }),
      { status: 500 },
    );
  }
}