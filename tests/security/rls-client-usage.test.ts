/**
 * Security tests: user-facing routes must use anon client (getServerSupabase) + RLS;
 * dev sudo/impersonation must still use service-role and isSudoEnabled().
 * Run: npm test
 */

import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const repoRoot = path.resolve(__dirname, '../..')

function readRouteFile(relativePath: string): string {
  const fullPath = path.join(repoRoot, relativePath)
  return fs.readFileSync(fullPath, 'utf-8')
}

describe('RLS and Supabase client usage', () => {
  it('user-facing dashboard routes use getServerSupabase, not service-role', () => {
    const userRoutes = [
      'app/api/dashboard/home/route.ts',
      'app/api/dashboard/intakes/route.ts',
      'app/api/dashboard/intakes/create/route.ts',
      'app/api/dashboard/matters/route.ts',
      'app/api/dashboard/intakes/[id]/client-preview-data/route.ts',
      'app/api/dashboard/intakes/[id]/send-link/route.ts',
      'app/api/dashboard/matters/[id]/client-preview-data/route.ts',
      'app/api/clients/route.ts',
      'app/api/auth/accept-terms/route.ts',
      'app/api/auth/leave-demo-firm/route.ts',
      'app/api/portal/home/route.ts',
    ]
    for (const file of userRoutes) {
      const content = readRouteFile(file)
      expect(
        content.includes('createSupabaseServerClientStrict'),
        `${file} should NOT use createSupabaseServerClientStrict (use getServerSupabase for RLS)`
      ).toBe(false)
      expect(
        content.includes('getServerSupabase'),
        `${file} should use getServerSupabase for user-facing data access`
      ).toBe(true)
    }
  })

  it('dev sudo / impersonation routes still use service-role and isSudoEnabled', () => {
    const devRoutes = [
      'app/api/dev/impersonate/route.ts',
      'app/api/dev/stop-impersonate/route.ts',
      'app/api/dev/send-test-intake-link/route.ts',
      'app/api/auth/use-dev-test-firm/route.ts',
    ]
    for (const file of devRoutes) {
      const content = readRouteFile(file)
      expect(
        content.includes('createSupabaseServerClientStrict') || content.includes('admin'),
        `${file} should use service-role for dev sudo`
      ).toBe(true)
      expect(
        content.includes('isSudoEnabled'),
        `${file} should guard with isSudoEnabled()`
      ).toBe(true)
    }
  })

  it('getCurrentUserServer uses getServerSupabase for non-impersonation profile/firm fetch', () => {
    const content = readRouteFile('lib/server/current-user.ts')
    expect(content).toContain('getServerSupabase')
    // Non-impersonation path should use supabase (from getServerSupabase) for profile and firm
    expect(content).toMatch(/await supabase\s*\.\s*from\s*\(\s*['"]profiles['"]/)
    expect(content).toMatch(/await supabase\s*\.\s*from\s*\(\s*['"]firms['"]/)
    // Impersonation path should still use admin
    expect(content).toContain('createSupabaseServerClientStrict')
    expect(content).toContain('isSudoEnabled')
  })
})
