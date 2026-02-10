/**
 * GET /api/gdpr/export
 * GDPR Data Export - Download all firm data as JSON
 *
 * Satisfies GDPR Article 15 (right to access)
 * Copy this entire file to: app/api/gdpr/export/route.ts
 */

import { NextRequest } from 'next/server';
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict';
import { getFirmId, getUserId, getClientIp } from '@/lib/session';
import { logGDPRExport } from '@/lib/auditLog';
import {
  unauthorizedResponse,
  serverErrorResponse,
  jsonResponse,
} from '@/lib/apiResponse';
import { GDPRExportData } from '@/types/database';

/**
 * GET /api/gdpr/export
 * Export all firm data for GDPR compliance
 * Returns JSON file with all tables filtered by firm_id
 */
export async function GET(request: NextRequest) {
  try {
    const firmId = await getFirmId();      // Promise<string | null> → string | null
    const userId = await getUserId();      // Promise<string | null> → string | null
    const ip = getClientIp(request);

    if (!firmId) {
      return unauthorizedResponse();
    }

    // At this point firmId is guaranteed non-null, so normalise for logging
    const firmIdForLog: string = firmId;
    const userIdForLog: string = userId ?? 'unknown'; // ✅ Always a string


    // Fetch all tables for this firm in parallel
    const [
      clientsRes,
      mattersRes,
      amlChecksRes,
      auditEventsRes,
      leadsRes,
    ] = await Promise.all([
      createSupabaseServerClientStrict()
        .from('clients')
        .select('*')
        .eq('firm_id', firmId),
      createSupabaseServerClientStrict()
        .from('matters')
        .select('*')
        .eq('firm_id', firmId),
      createSupabaseServerClientStrict()
        .from('aml_checks')
        .select('*')
        .eq('firm_id', firmId),
      createSupabaseServerClientStrict()
        .from('audit_logs')
        .select('*')
        .eq('firm_id', firmId),
      createSupabaseServerClientStrict()
        .from('marketing_leads')
        .select('*')
        .eq('firm_id', firmId),
    ]);

    // Check for errors
    if (
      clientsRes.error ||
      mattersRes.error ||
      amlChecksRes.error ||
      auditEventsRes.error ||
      leadsRes.error
    ) {
      const error =
        clientsRes.error ||
        mattersRes.error ||
        amlChecksRes.error ||
        auditEventsRes.error ||
        leadsRes.error;
      console.error('[GDPR Export] Query error:', error);
      return serverErrorResponse(error);
    }

    // Package all data
    const exportData: GDPRExportData = {
      exported_at: new Date().toISOString(),
      firm_id: firmId,
      clients: clientsRes.data || [],
      matters: mattersRes.data || [],
      aml_checks: amlChecksRes.data || [],
      audit_events: auditEventsRes.data || [],
      marketing_leads: leadsRes.data || [],
    };

    // Audit log: GDPR export
    await logGDPRExport(firmIdForLog, userIdForLog, 'json'); // ✅ Correct - 'json' matches the type


    // Return as downloadable JSON
    return jsonResponse(exportData);
  } catch (err: any) {
    console.error('[GDPR Export] Exception:', err);
    return serverErrorResponse(err);
  }
}