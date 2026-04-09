/**
 * Security tests: demo → real firm registration flow.
 * Run: npm test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/serverSupabase', () => ({
  getServerSupabase: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: { user: { id: 'test-user-id' } },
            error: null,
          })
        ),
      },
    })
  ),
}));

// Mock admin Supabase
const mockProfile = { firm_id: 'demo-firm-id' };
const mockFirm = { is_demo_firm: true };
const mockInsertedFirm = { id: 'new-real-firm-id' };

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: mockProfile, error: null })
              ),
            })),
          })),
        };
      }
      if (table === 'firms') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: mockFirm, error: null })
              ),
            })),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: mockInsertedFirm, error: null })
              ),
            })),
          })),
        };
      }
      if (table === 'profiles') {
        return {
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        };
      }
      return {};
    }),
  })),
}));

vi.mock('@/lib/auditLog', () => ({
  logAuditEvent: vi.fn(() => Promise.resolve()),
}));

describe('Register firm from demo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when name and state are missing', async () => {
    const { POST } = await import('@/app/api/auth/register-firm/route');
    const res = await POST(
      new Request('http://localhost/api/auth/register-firm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when state is missing', async () => {
    const { POST } = await import('@/app/api/auth/register-firm/route');
    const res = await POST(
      new Request('http://localhost/api/auth/register-firm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'My Law Firm' }),
      })
    );
    expect(res.status).toBe(400);
  });
});
