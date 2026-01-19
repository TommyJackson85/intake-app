/**
 * Standardized API Response Helpers
 * Copy this entire file to: lib/apiResponse.ts
 * 
 * Ensures consistent error/success responses across all API routes
 */

import { NextResponse } from 'next/server'

/**
 * Return a success JSON response with proper headers
 * 
 * @example
 * return jsonResponse({ data: [...] }, 200)
 */
export function jsonResponse(data: any, status: number = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
    },
  })
}

/**
 * Return an error response
 * 
 * @example
 * return errorResponse('Not found', 404)
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: any
) {
  console.error(`[API Error ${status}]:`, message, details)

  const response = {
    error: message,
    ...(process.env.NODE_ENV === 'development' && { details }),
  }

  return jsonResponse(response, status)
}

/**
 * Return 401 Unauthorized
 * 
 * @example
 * return unauthorizedResponse()
 */
export function unauthorizedResponse(message: string = 'Not authenticated') {
  return errorResponse(message, 401)
}

/**
 * Return 403 Forbidden
 * 
 * @example
 * return forbiddenResponse()
 */
export function forbiddenResponse(message: string = 'Access denied') {
  return errorResponse(message, 403)
}

/**
 * Return 400 Bad Request
 * 
 * @example
 * return badRequestResponse('Email is required')
 */
export function badRequestResponse(message: string) {
  return errorResponse(message, 400)
}

/**
 * Return 404 Not Found
 * 
 * @example
 * return notFoundResponse('Client not found')
 */
export function notFoundResponse(message: string = 'Not found') {
  return errorResponse(message, 404)
}

/**
 * Return 500 Internal Server Error
 * 
 * @example
 * return serverErrorResponse(err)
 */
export function serverErrorResponse(err: any, message?: string) {
  const msg = message || err?.message || 'Internal server error'
  return errorResponse(msg, 500, err)
}

/**
 * Success response with data
 * 
 * @example
 * return successResponse({ clients: [...] })
 */
export function successResponse(data: any) {
  return jsonResponse({ success: true, ...data }, 200)
}

/**
 * Success response for list endpoints
 * 
 * @example
 * return listResponse([client1, client2], 2)
 */
export function listResponse(data: any[], count: number) {
  return jsonResponse({ data, count }, 200)
}

/**
 * Success response for single resource (create/update)
 * 
 * @example
 * return resourceResponse(newClient, 201)
 */
export function resourceResponse(data: any, status: number = 200) {
  return jsonResponse(data, status)
}

/**
 * Success response for deletion
 * 
 * @example
 * return deleteResponse('Client deleted')
 */
export function deleteResponse(message: string = 'Deleted successfully') {
  return jsonResponse({ success: true, message }, 200)
}