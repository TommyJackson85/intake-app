// e2e/demo-dashboard.spec.ts
//
// SKIPPED: This app does not have a /demo route with in-memory mock data.
//
// The dashboard lives at /dashboard and requires Supabase authentication.
// "Demo mode" is a server-side flag (is_test_firm) set during signup when
// NEXT_PUBLIC_ALLOW_DEV_SIGNUP=true. It cannot be accessed without a live
// Supabase connection and valid credentials.
//
// Dashboard elements that would be tested once auth is available:
// - Summary cards: "New intakes to review", "Waiting on client info",
//   "Closings (next 7 days)", "Matters needing attention"
// - Tabs: "Intakes / Leads", "Open matters"
// - Tables with columns: Client, Matter, Status, Created
// - Key dates sidebar panel
// - Action buttons: "+ New intake link", "+ New matter", "Log note / upload"
//
// To enable these tests in the future, either:
// 1. Add a /demo route with fully mocked data (no Supabase), or
// 2. Seed a test database and use Playwright auth state to log in before tests.

import { test } from '@playwright/test';

test.skip('dashboard tests require authentication — see comments above', () => {});
