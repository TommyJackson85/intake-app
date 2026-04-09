// app/api/external/gdpr/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import { logAuditEvent } from '@/lib/auditLog';

// app/api/external/gdpr/export/route.ts - GDPR Data Export with TypeScript null-safety fix
// Copy-paste ready - Fixed null type error

import { getFirmFromApiKey } from '@/lib/get-firm-from-api-key';

/**
 * GET /api/external/gdpr/export
 * Export all user data in machine-readable format (JSON or CSV)
 *
 * ✅ FIXED: Proper null checking for authHeader
 * ✅ Type-safe: TypeScript errors resolved
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClientStrict();

    // ✅ Get API key from Authorization header only
    const authHeader = request.headers.get('authorization');

    // ✅ CRITICAL FIX: Check if header exists AND has correct format
    // This prevents TypeScript error: "Argument of type 'string | null' is not assignable to parameter of type 'string'"
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // ✅ Now apiKey is guaranteed to be a string (TypeScript knows authHeader is NOT null)
    const apiKey = authHeader.slice(7); // Remove 'Bearer '

    // ✅ Safe to pass apiKey to function expecting string
    let firm;
    try {
      firm = await getFirmFromApiKey(apiKey);
    } catch (e: any) {
      if (e.message === 'MISSING_API_KEY') {
        return NextResponse.json({ error: 'Missing API key' }, { status: 401 });
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!firm) {
      return NextResponse.json({ error: 'Firm not found' }, { status: 404 });
    }

    // Get format from query (json or csv)
    const format = request.nextUrl.searchParams.get('format') || 'json';

    // Get all user data
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('firm_id', firm.id);

    const { data: clients } = await supabase
      .from('clients')
      .select('*')
      .eq('firm_id', firm.id);

    const { data: matters } = await supabase
      .from('matters')
      .select('*')
      .in(
        'client_id',
        clients?.map((c) => c.id) || []
      );

    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .eq('firm_id', firm.id);

    const { data: amlChecks } = await supabase
      .from('aml_checks')
      .select('*')
      .eq('firm_id', firm.id);

    await logAuditEvent(
      firm.id.toString(),
      null,
      'aml_checks_export',
      'aml_checks',
      'all',
      {
        route: '/api/external/gdpr/export',
        method: 'GET',
        format,
      }
    );


    const exportData = {
      exportDate: new Date().toISOString(),
      firmId: firm.id,
      firmName: firm.name,
      data: {
        users: users || [],
        clients: clients || [],
        matters: matters || [],
        leads: leads || [],
        amlChecks: amlChecks || [],
      },
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(exportData);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="gdpr-export.csv"',
        },
      });
    }

    // Default: JSON format
    return NextResponse.json(exportData, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="gdpr-export.json"',
      },
    });
  } catch (error) {
    console.error('GDPR export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data: any): string {
  const lines: string[] = [];

  // Users CSV
  if (data.data.users.length > 0) {
    lines.push('=== USERS ===');
    lines.push(Object.keys(data.data.users[0]).join(','));
    data.data.users.forEach((user: any) => {
      lines.push(Object.values(user).join(','));
    });
    lines.push('');
  }

  // Clients CSV
  if (data.data.clients.length > 0) {
    lines.push('=== CLIENTS ===');
    lines.push(Object.keys(data.data.clients[0]).join(','));
    data.data.clients.forEach((client: any) => {
      lines.push(Object.values(client).join(','));
    });
    lines.push('');
  }

  // Matters CSV
  if (data.data.matters.length > 0) {
    lines.push('=== MATTERS ===');
    lines.push(Object.keys(data.data.matters[0]).join(','));
    data.data.matters.forEach((matter: any) => {
      lines.push(Object.values(matter).join(','));
    });
    lines.push('');
  }

  // Leads CSV
  if (data.data.leads.length > 0) {
    lines.push('=== LEADS ===');
    lines.push(Object.keys(data.data.leads[0]).join(','));
    data.data.leads.forEach((lead: any) => {
      lines.push(Object.values(lead).join(','));
    });
    lines.push('');
  }

  // AML Checks CSV
  if (data.data.amlChecks.length > 0) {
    lines.push('=== AML CHECKS ===');
    lines.push(Object.keys(data.data.amlChecks[0]).join(','));
    data.data.amlChecks.forEach((check: any) => {
      lines.push(Object.values(check).join(','));
    });
  }

  return lines.join('\n');
}