// lib/session.ts
import { cookies } from 'next/headers'

export async function getFirmIdFromSession(): Promise<string | null> {
  return (await cookies()).get('firm_id')?.value || null
}

export async function getUserIdFromSession(): Promise<string | null> {
  return (await cookies()).get('user_id')?.value || null
}

export async function requireSessionFirm(): Promise<string> {
  const firmId = await getFirmIdFromSession()

  if (!firmId) {
    throw new Error('Unauthorized')
  }

  return firmId
}