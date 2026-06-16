// e2e/demo-intake.spec.ts
//
// SKIPPED: The intake creation flow at /dashboard/intakes/new requires auth.
//
// The "Create an intake link" page has these form fields:
// - Client email * (required)
// - Client name
// - Client phone
// - Matter type * (dropdown: Real estate purchase, sale, Conveyancing, etc.)
// - Property address
// - "Create link" submit button
//
// The public intake form at /intake/[token] works without auth BUT requires
// a valid token from the database. Without seeded data, it cannot be tested.
//
// To enable these tests, either:
// 1. Create a /demo route that renders the intake form with mock data, or
// 2. Seed a test database with a known token before running tests.

import { test } from '@playwright/test';

test.skip('intake flow tests require authentication or a seeded token — see comments above', () => {});
