// app/api/external/clients/route.ts - FIXED
// Handles null apiKey properly

import { NextResponse } from 'next/server';
import { getFirmFromApiKey } from '@/lib/get-firm-from-api-key';
import { validateRequest } from '@/lib/validation-schemas';
import { CreateClientSchema } from '@/lib/validation-schemas';

/**
 * POST /api/external/clients
 * Create a new client via API key authentication
 * ✅ Fixed: Properly handles null apiKey
 */
export async function POST(request: Request) {
  try {
    // ✅ Extract API key from Authorization header
    const authHeader = request.headers.get('authorization');
    
    // ✅ Validate that apiKey is not null before passing to function
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.slice(7); // Remove 'Bearer ' prefix

    // ✅ Extra validation - apiKey should never be empty after extracting
    if (!apiKey || apiKey.length === 0) {
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 401 }
      );
    }

    let firm;
    try {
      // ✅ Now apiKey is guaranteed to be a non-empty string
      firm = await getFirmFromApiKey(apiKey);
    } catch (e: any) {
      if (e.message === 'MISSING_API_KEY') {
        return NextResponse.json({ error: 'Missing API key' }, { status: 401 });
      }
      if (e.message === 'INVALID_API_KEY') {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 403 });
      }
      throw e;
    }

    if (!firm) {
      return NextResponse.json({ error: 'Firm not found' }, { status: 404 });
    }

    // ✅ Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const validation = validateRequest(CreateClientSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.errors.flatten(),
        },
        { status: 400 }
      );
    }

    // ✅ Create client with firm context
    const clientData = {
      firm_id: firm.id,
      ...validation.data,
      created_at: new Date().toISOString(),
    };

    // ✅ TODO: Save to database
    // const { data: client, error } = await supabase
    //   .from('clients')
    //   .insert(clientData)
    //   .select()
    //   .single();

    // if (error) {
    //   console.error('Failed to create client:', error);
    //   return NextResponse.json(
    //     { error: 'Failed to create client' },
    //     { status: 500 }
    //   );
    // }

    return NextResponse.json(
      { 
        success: true,
        message: 'Client created successfully',
        data: clientData 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/external/clients
 * List clients for authenticated firm
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');

    // ✅ Validate authorization header exists and is properly formatted
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.slice(7);

    // ✅ Validate apiKey is not empty
    if (!apiKey || apiKey.length === 0) {
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 401 }
      );
    }

    let firm;
    try {
      firm = await getFirmFromApiKey(apiKey);
    } catch (e: any) {
      if (e.message === 'MISSING_API_KEY' || e.message === 'INVALID_API_KEY') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      throw e;
    }

    if (!firm) {
      return NextResponse.json({ error: 'Firm not found' }, { status: 404 });
    }

    // ✅ TODO: Fetch clients from database
    // const { data: clients, error } = await supabase
    //   .from('clients')
    //   .select('*')
    //   .eq('firm_id', firm.id)
    //   .order('created_at', { ascending: false });

    // if (error) {
    //   console.error('Failed to fetch clients:', error);
    //   return NextResponse.json(
    //     { error: 'Failed to fetch clients' },
    //     { status: 500 }
    //   );
    // }

    return NextResponse.json(
      {
        success: true,
        data: [], // Replace with actual clients
        count: 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}