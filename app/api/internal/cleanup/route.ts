// app/api/internal/cleanup/route.ts - Fixed cleanup endpoint
// Removes the TypeScript error with limitSensitive()

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAPIKey, hasScope } from '@/lib/api-key-security';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/internal/cleanup
 * ✅ Internal cleanup job - remove old data
 * ✅ Requires valid API key with admin scope
 * ✅ Soft-delete data first (archive), then hard-delete after retention period
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ Get API key from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.slice(7);

    // ✅ Validate API key
    const keyValidation = await validateAPIKey(new Request(request.url, { headers: request.headers }));
    if (!keyValidation.valid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ✅ Check for admin scope
    if (!hasScope(keyValidation.scopes || [], 'admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // ✅ Verify this is an internal request (from Vercel Crons or similar)
    // Optional: Check for internal secret
    const internalSecret = request.headers.get('x-internal-secret');
    if (internalSecret !== process.env.INTERNAL_CLEANUP_SECRET) {
      return NextResponse.json(
        { error: 'Invalid internal secret' },
        { status: 403 }
      );
    }

    // ============================================
    // CLEANUP TASKS
    // ============================================

    const results = {
      archived: 0,
      deleted: 0,
      errors: [] as string[],
      timestamp: new Date().toISOString(),
    };

    try {
      // ============================================
      // Step 1: ARCHIVE OLD REJECTED LEADS (90 days)
      // ============================================
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      const { data: archivedLeads, error: archiveError } = await supabaseAdmin
        .from('leads')
        .update({
          status: 'archived',
          archived_at: new Date().toISOString(),
        })
        .eq('status', 'rejected')
        .lt('created_at', ninetyDaysAgo.toISOString())
        .select('id');

      if (archiveError) {
        results.errors.push(`Archive leads error: ${archiveError.message}`);
      } else {
        results.archived += archivedLeads?.length || 0;
        console.log(`Archived ${archivedLeads?.length || 0} old leads`);
      }
    } catch (error) {
      results.errors.push(`Leads archive failed: ${(error as Error).message}`);
    }

    try {
      // ============================================
      // Step 2: HARD DELETE ARCHIVED LEADS (180 days)
      // ============================================
      const oneEightyDaysAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

      const { data: deletedLeads, error: deleteError } = await supabaseAdmin
        .from('leads')
        .delete()
        .eq('status', 'archived')
        .lt('archived_at', oneEightyDaysAgo.toISOString())
        .select('id');

      if (deleteError) {
        results.errors.push(`Delete leads error: ${deleteError.message}`);
      } else {
        results.deleted += deletedLeads?.length || 0;
        console.log(`Hard-deleted ${deletedLeads?.length || 0} archived leads`);
      }
    } catch (error) {
      results.errors.push(`Leads deletion failed: ${(error as Error).message}`);
    }

    try {
      // ============================================
      // Step 3: CLEANUP OLD AUDIT LOGS (1 year)
      // ============================================
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

      const { data: deletedLogs, error: logsError } = await supabaseAdmin
        .from('audit_logs')
        .delete()
        .lt('created_at', oneYearAgo.toISOString())
        .select('id');

      if (logsError) {
        results.errors.push(`Delete audit logs error: ${logsError.message}`);
      } else {
        results.deleted += deletedLogs?.length || 0;
        console.log(`Hard-deleted ${deletedLogs?.length || 0} old audit logs`);
      }
    } catch (error) {
      results.errors.push(`Audit logs cleanup failed: ${(error as Error).message}`);
    }

    try {
      // ============================================
      // Step 4: CLEANUP EXPIRED SESSIONS (7 days)
      // ============================================
      const { data: deletedSessions, error: sessionsError } = await supabaseAdmin
        .from('sessions')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (sessionsError) {
        results.errors.push(`Delete sessions error: ${sessionsError.message}`);
      } else {
        results.deleted += deletedSessions?.length || 0;
        console.log(`Deleted ${deletedSessions?.length || 0} expired sessions`);
      }
    } catch (error) {
      results.errors.push(`Sessions cleanup failed: ${(error as Error).message}`);
    }

    try {
      // ============================================
      // Step 5: CLEANUP EXPIRED API KEYS (none active past 90 days)
      // ============================================
      const { data: expiredKeys, error: keysError } = await supabaseAdmin
        .from('api_keys')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .eq('is_active', false)
        .select('id');

      if (keysError) {
        results.errors.push(`Delete API keys error: ${keysError.message}`);
      } else {
        results.deleted += expiredKeys?.length || 0;
        console.log(`Deleted ${expiredKeys?.length || 0} expired API keys`);
      }
    } catch (error) {
      results.errors.push(`API keys cleanup failed: ${(error as Error).message}`);
    }

    // ============================================
    // LOG CLEANUP OPERATION
    // ============================================
    try {
      await supabaseAdmin.from('audit_logs').insert({
        event_type: 'CLEANUP_JOB_COMPLETED',
        description: 'Internal cleanup job executed',
        metadata: results,
      });
    } catch (error) {
      console.error('Failed to log cleanup:', error);
    }

    // ============================================
    // RETURN RESULTS
    // ============================================
    const status = results.errors.length > 0 ? 206 : 200; // 206 = Partial Content if errors

    return NextResponse.json(results, { status });
  } catch (error) {
    console.error('Cleanup job error:', error);

    return NextResponse.json(
      {
        error: 'Cleanup job failed',
        message: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/internal/cleanup/status
 * Check cleanup job status
 */
export async function GET(request: NextRequest) {
  try {
    // ✅ Require internal secret
    const internalSecret = request.headers.get('x-internal-secret');
    if (internalSecret !== process.env.INTERNAL_CLEANUP_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get last cleanup run
    const { data: lastCleanup } = await supabaseAdmin
      .from('audit_logs')
      .select('metadata, created_at')
      .eq('event_type', 'CLEANUP_JOB_COMPLETED')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      status: 'operational',
      lastCleanup: lastCleanup ? {
        timestamp: lastCleanup.created_at,
        results: lastCleanup.metadata,
      } : null,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { status: 'error', error: (error as Error).message },
      { status: 500 }
    );
  }
}

// ============================================
// SETUP: Add to vercel.json for scheduled runs
// ============================================
/*
// vercel.json
{
  "crons": [
    {
      "path": "/api/internal/cleanup",
      "schedule": "0 2 * * *"  // Run daily at 2 AM UTC
    }
  ]
}

// Add to .env.local
INTERNAL_CLEANUP_SECRET=your-very-long-secret-key-minimum-32-chars

// Trigger manually for testing:
curl -X POST http://localhost:3000/api/internal/cleanup \
  -H "Authorization: Bearer sk_test_yourkey" \
  -H "x-internal-secret: your-secret-key"
*/