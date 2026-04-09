/**
 * GET /api/clients - Fetch all clients for a firm
 * POST /api/clients - Create a new client
 *
 * Uses session-bound anon client + RLS for firm-scoped access (no service-role).
 */

import { NextRequest } from 'next/server';
import { getServerSupabase } from '@/lib/serverSupabase';
import { getCurrentUserServer } from '@/lib/server/current-user';
import { getClientIp } from '@/lib/session';
import { logAuditEvent } from '@/lib/auditLog';
import {
  listResponse,
  unauthorizedResponse,
  badRequestResponse,
  serverErrorResponse,
  resourceResponse,
} from '@/lib/apiResponse';
import { CreateClientInput } from '@/types/database';

/**
 * GET /api/clients
 * Fetch all clients for the authenticated firm (RLS enforces firm_id scope)
 */
export async function GET(request: NextRequest) {
  try {
    const current = await getCurrentUserServer();
    if (!current) return unauthorizedResponse();
    const firmId = current.profile.firm_id;
    const userId = current.authUser.id;
    const ip = getClientIp(request);

    if (!firmId) {
      return unauthorizedResponse();
    }

    const supabase = await getServerSupabase();
    // RLS: only rows where firm_id matches user's profile.firm_id are visible
    const { data: clients, error } = await supabase
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
      userId,
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
 * Create a new client for the authenticated firm (RLS enforces INSERT only for own firm_id)
 */
export async function POST(request: NextRequest) {
  try {
    const current = await getCurrentUserServer();
    if (!current) return unauthorizedResponse();
    const firmId = current.profile.firm_id;
    const userId = current.authUser.id;
    const ip = getClientIp(request);

    if (!firmId) {
      return unauthorizedResponse();
    }

    // Parse request body
    const body: CreateClientInput = await request.json();

    // Validate required fields
    if (!body.full_name) {
      return badRequestResponse('Client name is required');
    }

    const supabase = await getServerSupabase();
    // RLS: INSERT only allowed when firm_id matches user's profile.firm_id
    const { data: client, error } = await supabase
      .from('clients')
      .insert([
        {
          firm_id: firmId,
          full_name: body.full_name,
          email: body.email ?? '',
          phone: body.phone || null,
          address_line_1: body.address || null,
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
      userId,
      firmId,
      {
        entity_type: 'client',
        entity_id: client?.id,
        name: body.full_name,
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