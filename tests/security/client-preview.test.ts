/**
 * Security tests: lawyer cannot preview another firm's intake or matter.
 * Run: npm test
 *
 * These tests verify that client-preview APIs enforce firm_id isolation.
 * They use mocked getCurrentUserServer and Supabase responses.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock server dependencies before importing route handlers
vi.mock('@/lib/server/current-user', () => ({
  getCurrentUserServer: vi.fn(),
}));
vi.mock('@/lib/serverClientStrict', () => ({
  createSupabaseServerClientStrict: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({ data: null, error: { message: 'PGRST116' } })
            ),
            maybeSingle: vi.fn(() =>
              Promise.resolve({ data: null, error: null })
            ),
          })),
          single: vi.fn(() =>
            Promise.resolve({ data: null, error: { message: 'PGRST116' } })
          ),
        })),
      })),
    })),
  })),
}));
vi.mock('@/lib/auditLog', () => ({
  logAuditEvent: vi.fn(() => Promise.resolve()),
}));

describe('Client preview firm isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('matters client-preview returns 404 when matter belongs to another firm', async () => {
    const { getCurrentUserServer } = await import('@/lib/server/current-user');
    vi.mocked(getCurrentUserServer).mockResolvedValue({
      authUser: { id: 'user-a', email: 'lawyer@firma.com' },
      profile: { firm_id: 'firm-a-id', role: 'lawyer' },
      firm: { id: 'firm-a-id', name: 'Firm A', state: 'FL' },
    } as any);

    const { GET } = await import(
      '@/app/api/dashboard/matters/[id]/client-preview-data/route'
    );
    const res = await GET(
      new Request('http://localhost/api/dashboard/matters/other-firm-matter-id/client-preview-data'),
      { params: Promise.resolve({ id: 'other-firm-matter-id' }) } as any
    );

    expect(res.status).toBe(404);
  });

  it('intakes client-preview returns 404 when lead belongs to another firm', async () => {
    const { getCurrentUserServer } = await import('@/lib/server/current-user');
    vi.mocked(getCurrentUserServer).mockResolvedValue({
      authUser: { id: 'user-a', email: 'lawyer@firma.com' },
      profile: { firm_id: 'firm-a-id', role: 'lawyer' },
      firm: { id: 'firm-a-id', name: 'Firm A', state: 'FL' },
    } as any);

    const { GET } = await import(
      '@/app/api/dashboard/intakes/[id]/client-preview-data/route'
    );
    const res = await GET(
      new Request('http://localhost/api/dashboard/intakes/other-firm-lead-id/client-preview-data'),
      { params: Promise.resolve({ id: 'other-firm-lead-id' }) } as any
    );

    expect(res.status).toBe(404);
  });
});
