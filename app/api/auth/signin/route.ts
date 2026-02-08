// app/api/auth/signin/route.ts
// FINAL VERSION – matches your current lib/session.ts API

import { createClient } from '@supabase/supabase-js';
import { validateRequest, SignInSchema } from '@/lib/validation-schemas';
import { rateLimit } from '@/lib/rate-limit';
import { logLogin } from '@/lib/auditLog';
import { createSessionRecord, setSessionCookie } from '@/lib/session';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/auth/signin
 */
export async function POST(request: Request) {
  try {
    // 1) Rate limiting
    const limitResult = await rateLimit(request, 'signin-attempt');
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    if (limitResult.isLimited) {
      await logLogin('unknown', 'failed', clientIp, 'Too many login attempts');

      return new Response(
        JSON.stringify({
          error: 'Too many login attempts. Please try again later.',
        }),
        {
          status: 429,
          headers: {
            'Retry-After': limitResult.retryAfter!.toString(),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(
              limitResult.resetTime
            ).toISOString(),
          },
        }
      );
    }

    // 2) Parse body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400 }
      );
    }

    // 3) Validate input
    const validation = validateRequest(SignInSchema, body);

    if (!validation.success) {
      await logLogin(
        (body as any)?.email || 'unknown',
        'failed',
        clientIp,
        'Invalid input'
      );

      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // 4) Authenticate via Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      await logLogin(
        email,
        'failed',
        clientIp,
        error?.message || 'Invalid credentials'
      );

      const isEmailNotConfirmed =
        error?.message?.toLowerCase().includes('confirm') ||
        error?.message?.toLowerCase().includes('email not confirmed');

      if (isEmailNotConfirmed) {
        return new Response(
          JSON.stringify({
            error: 'Please confirm your email address before signing in. Check your inbox and spam folder.',
            code: 'EMAIL_NOT_CONFIRMED',
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = data.user;

    // 5) Load user profile (profiles.firm_id may be null if user has not registered a firm yet)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, firm_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      await logLogin(email, 'failed', clientIp, 'User profile missing');

      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 500 }
      );
    }

    // 6) Create session via existing lib/session.ts
    const userAgent = request.headers.get('user-agent') || '';
    const tokenHashValue = userData.firm_id ?? '';
    const sessionId = await createSessionRecord(
      user.id,
      clientIp,
      userAgent,
      tokenHashValue
    );

    if (!sessionId) {
      await logLogin(
        email,
        'failed',
        clientIp,
        'Failed to create session'
      );

      return new Response(
        JSON.stringify({ error: 'Failed to create session' }),
        { status: 500 }
      );
    }

    // 7) Prepare response
    const response = new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firmId: userData.firm_id ?? null,
        },
        message: 'Signed in successfully',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': limitResult.remaining.toString(),
        },
      }
    );

    // 8) Set secure session cookie using your helper
    await setSessionCookie('session_token', sessionId, {
      maxAge: 30 * 60, // 30 minutes in seconds
    });
    await setSessionCookie('user_id', user.id);
    // Only set firm_id cookie when user has a firm (so API routes get correct context)
    if (userData.firm_id) {
      await setSessionCookie('firm_id', String(userData.firm_id));
    }

    // 9) Log success
    await logLogin(email, 'success', clientIp, 'Session created');

    return response;
  } catch (error) {
    console.error('Signin endpoint error:', error);

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/signin
 */
export async function GET(_request: Request) {
  try {
    return new Response(
      JSON.stringify({
        message: 'POST credentials to this endpoint',
        method: 'POST',
        fields: ['email', 'password'],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('GET signin error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get signin info' }),
      { status: 500 }
    );
  }
}