// e2e/demo-matter.spec.ts
//
// SKIPPED: Matter detail pages live at /dashboard/matters and require auth.
//
// The matters list page (/dashboard/matters/page.tsx) is a placeholder with no
// implemented matter table yet. The page says:
//   "Matters for your firm will appear here."
//
// Matter detail view, status dropdown, and field display are not yet built.
// When implemented, tests should cover:
// - Clicking a matter row opens a detail panel or page
// - Matter fields visible: property address, client name, closing date
// - Matter status dropdown is present and functional

import { test } from '@playwright/test';

test.skip('matter detail tests require authentication and are not yet implemented — see comments above', () => {});
