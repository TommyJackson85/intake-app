/**
 * GET /api/clients - Fetch all clients for a firm
 * POST /api/clients - Create a new client
 *
 * Copy this entire file to: app/api/clients/route.ts
 * ✅ FIXED: Handle null userId by converting to undefined
 * ✅ FIXED: Avoid generic mismatch on createSupabaseServerClientStrict()
 */

import { NextRequest } from 'next/server';
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict';
import { getFirmId, getUserId, getClientIp } from '@/lib/session';
import { logAuditEvent } from '@/lib/auditLog';
import {
  listResponse,
  unauthorizedResponse,
  badRequestResponse,
  serverErrorResponse,
  resourceResponse,
} from '@/lib/apiResponse';
import { Client, CreateClientInput } from '@/types/database';

/**
 * GET /api/clients
 * Fetch all clients for the authenticated firm
 */
export async function GET(request: NextRequest) {
  try {
    const firmId = await getFirmId();
    const userId = await getUserId(); // Returns string | null
    const ip = getClientIp(request);

    if (!firmId) {
      return unauthorizedResponse();
    }

    // Query clients for this firm only
    const { data: clients, error } = await createSupabaseServerClientStrict()
      .from('clients')
      .select('*')
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Clients GET] Query error:', error);
      return serverErrorResponse(error);
    }

    // ✅ FIX: Convert null to undefined for logAuditEvent
    await logAuditEvent(
      'CLIENTS_LIST_VIEWED',
      'Clients list viewed',
      ip,
      userId ?? 'anonymous', // null → undefined
      firmId,
      {
        entity_type: 'client_list',
        count: clients?.length || 0,
        route: '/api/clients',
        method: 'GET',
      }
    );

    return listResponse(clients || [], clients?.length || 0);
  } catch (err: any) {
    console.error('[Clients GET] Exception:', err);
    return serverErrorResponse(err);
  }
}

/**
 * POST /api/clients
 * Create a new client for the authenticated firm
 */
export async function POST(request: NextRequest) {
  try {
    const firmId = await getFirmId();
    const userId = await getUserId(); // Returns string | null
    const ip = getClientIp(request);

    if (!firmId) {
      return unauthorizedResponse();
    }

    // Parse request body
    const body: CreateClientInput = await request.json();

    // Validate required fields
    if (!body.name) {
      return badRequestResponse('Client name is required');
    }

    // Create client with firm_id always set by server (not client)
    const { data: client, error } = await createSupabaseServerClientStrict()
      .from('clients')
      .insert([
        {
          firm_id: firmId,
          name: body.name,
          email: body.email || null,
          phone: body.phone || null,
          address: body.address || null,
        },
      ])
      .select('*')
      .single();

    if (error) {
      console.error('[Clients POST] Insert error:', error);
      return serverErrorResponse(error);
    }

    // ✅ FIX: Convert null to undefined for logAuditEvent
    await logAuditEvent(
      'CLIENT_CREATED',
      'Client record created',
      ip,
      userId ?? 'anonymous', // null → undefined
      firmId,
      {
        entity_type: 'client',
        entity_id: client?.id,
        name: body.name,
        email: body.email,
        route: '/api/clients',
        method: 'POST',
        lawful_basis: 'Legal obligation (legal matter management)',
      }
    );

    return resourceResponse(client, 201);
  } catch (err: any) {
    console.error('[Clients POST] Exception:', err);
    return serverErrorResponse(err);
  }
}