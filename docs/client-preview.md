# Client Preview

This document explains how the client preview feature works and how it remains read-only and safe.

## Overview

The client preview feature lets firm users (lawyers, staff) view the client-facing UI for a specific matter or intake **without** switching identity. It is a read-only preview.

## Routes

- `/dashboard/matters/[id]/client-preview` – Preview the client portal view for a matter
- `/dashboard/intakes/[id]/client-preview` – Preview the client intake form for an intake/lead

## Behaviour

### What It Does

- Renders the same UI structure that the client would see (matter list, intake form).
- Uses the same data as the real client view would.
- Clearly labels the page as a preview with a banner.

### Safety Constraints

| Constraint | Implementation |
|------------|----------------|
| **Read-only** | No ability to act as the client: no signing, uploading, editing answers, or sending messages. The preview components render display-only versions of forms and data. |
| **Same-tenant only** | API routes enforce that the matter/lead belongs to the current user's firm (`firm_id` check). No cross-tenant visibility. |
| **Clear labelling** | Banner: *"Preview of client view – you are still logged in as [Firm Name]. This is read-only."* |
| **No auth change** | Session and auth context are unchanged. No impersonation or identity switch. |

## Implementation

### Data APIs

- `GET /api/dashboard/intakes/[id]/client-preview-data` – Returns lead data for same-firm users.
- `GET /api/dashboard/matters/[id]/client-preview-data` – Returns matter + client data for same-firm users.

Both APIs:

1. Require an authenticated firm user (not a client).
2. Verify the resource belongs to the user's firm.
3. Return data in the same shape as the real client APIs would use, but fetched server-side with firm auth.

### Components

- `ClientIntakePreview` – Renders the intake form in read-only mode.
- `ClientMatterPreview` – Renders the client portal matter list in read-only mode.

### Access

- **Preview links** appear on the intakes list, matters list, and dashboard worklists as "Preview" or "Preview client view".
