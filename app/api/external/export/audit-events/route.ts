// app/api/external/export/audit-events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'

// app/api/external/export/audit-events/route.ts - FIXED VERSION
// TypeScript error fixed: proper null checking on authorization header

import { getFirmFromApiKey } from '@/lib/get-firm-from-api-key';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClientStrict();
    // ✅ FIXED: Properly extract and validate API key from Authorization header
    const authHeader = request.headers.get('authorization');
    
    // ✅ Check if header exists AND starts with 'Bearer '
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // ✅ NOW apiKey is guaranteed to be a string (not null)
    const apiKey = authHeader.slice(7); // Remove 'Bearer ' prefix

    let firm;
    try {
      firm = await getFirmFromApiKey(apiKey);
    } catch (e: any) {
      if (e.message === 'MISSING_API_KEY') {
        return NextResponse.json(
          { error: 'Missing API key' },
          { status: 401 }
        );
      }
      throw e;
    }

    if (!firm) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Get audit events for export
    const { data: auditEvents, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('firm_id', firm.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch audit events:', error);
      return NextResponse.json(
        { error: 'Failed to export data' },
        { status: 500 }
      );
    }

    // Format for CSV export
    const csv = generateCSV(auditEvents);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="audit-events.csv"',
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}

function generateCSV(data: any[]): string {
  if (data.length === 0) {
    return 'No data to export';
  }

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row =>
    headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',')
  );

  return [csvHeaders, ...csvRows].join('\n');
}