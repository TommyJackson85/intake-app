// app/api/external/export/aml-checks/route.ts
// Hardened AML checks export endpoint with audit logging

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict';
import { getFirmFromApiKey } from '@/lib/get-firm-from-api-key';
import { logAuditEvent } from '@/lib/auditLog';

export async function POST(request: NextRequest) {
  try {
    // ✅ Create Supabase client (server-side, strict)
    const supabase = await createSupabaseServerClientStrict();

    // ✅ Extract and validate API key from Authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 },
      );
    }

    // ✅ API key is now guaranteed to be a string
    const apiKey = authHeader.slice(7); // Remove "Bearer " prefix

    let firm;
    try {
      firm = await getFirmFromApiKey(apiKey);
    } catch (e: any) {
      if (e?.message === 'MISSING_API_KEY') {
        return NextResponse.json(
          { error: 'Missing API key' },
          { status: 401 },
        );
      }
      throw e;
    }

    if (!firm) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 },
      );
    }

    // ✅ Get AML checks for export
    const { data: amlChecks, error } = await supabase
      .from('aml_checks')
      .select('*')
      .eq('firm_id', firm.id);

    if (error) {
      console.error('Failed to fetch AML checks:', error);

      // 🔐 Audit failed export attempt
      await logAuditEvent(
        firm.id.toString(),
        null,
        'aml_checks_export_failed',
        'aml_checks',
        'export',
        {
          route: '/api/external/export/aml-checks',
          method: 'POST',
          reason: error.message ?? 'unknown',
        }
      );

      return NextResponse.json(
        { error: 'Failed to export data' },
        { status: 500 },
      );
    }

    // ✅ Audit successful export
    await logAuditEvent(
      firm.id.toString(),
      null,
      'aml_checks_export',
      'aml_checks',
      'export',
      {
        route: '/api/external/export/aml-checks',
        method: 'POST',
        firmId: firm.id,
        recordCount: amlChecks?.length ?? 0,
      }
    );

    // Format for CSV export
    const csv = generateCSV(amlChecks ?? []);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="aml-checks.csv"',
      },
    });
  } catch (error) {
    console.error('Export error:', error);

    // 🔐 Best-effort audit for unexpected errors
    try {
      await logAuditEvent(
        null,
        null,
        'aml_checks_export_error',
        'aml_checks',
        'export',
        {
          route: '/api/external/export/aml-checks',
          method: 'POST',
          error: (error as Error).message ?? 'unknown',
        }
      );
    } catch {
      // Avoid throwing from audit in catch
    }

    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 },
    );
  }
}

function generateCSV(data: any[]): string {
  if (!data || data.length === 0) {
    return 'No data to export';
  }

  const headers = Object.keys(data[0] ?? {});
  const csvHeaders = headers.join(',');

  const csvRows = data.map(row =>
    headers
      .map(header => {
        const value = row[header];
        if (value == null) return '';
        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma or quote
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(','),
  );

  return [csvHeaders, ...csvRows].join('\n');
}