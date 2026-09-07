/**
 * Safe, versioned browser persistence for demo-only data.
 * SSR / static export: all storage access is gated on `window` + try/catch.
 * Invalid, outdated, or schema-invalid payloads fall back to null (caller uses seed).
 */

export const DEMO_PERSISTENCE_SCHEMA_VERSION = 1

/** Envelope written for new saves. Legacy raw JSON (pre-envelope) is still accepted on read. */
export type DemoPersistedEnvelope<T> = {
  v: number
  data: T
}

export const DEMO_MATTERS_STORAGE_KEY = 'lawintake-demo-matters-v1'
export const DEMO_FINCEN_CERT_STORAGE_KEY = 'lawintake-demo-fincen-cert-requests-v1'
export const DEMO_DOCUMENTS_STORAGE_KEY = 'lawintake-demo-documents-v1'
export const DEMO_DOCUMENT_REQUESTS_STORAGE_KEY = 'lawintake-demo-document-requests-v1'
export const DEMO_CONDO_DILIGENCE_STORAGE_KEY = 'lawintake-demo-condo-diligence-v1'
export const DEMO_POST_CLOSING_UNDERTAKINGS_STORAGE_KEY = 'lawintake-demo-post-closing-undertakings-v1'
export const DEMO_MATTER_REVIEW_TASKS_STORAGE_KEY = 'lawintake-demo-matter-review-tasks-v1'
export const DEMO_CONDO_DILIGENCE_ACTIVITIES_STORAGE_KEY = 'lawintake-demo-condo-diligence-activities-v1'
export const DEMO_INTAKE_LEADS_STORAGE_KEY = 'lawintake-demo-intake-leads-v1'

/** All localStorage keys owned by the demo experience (not AI-dev inspector session keys). */
export const DEMO_LOCAL_STORAGE_KEYS = [
  DEMO_MATTERS_STORAGE_KEY,
  DEMO_FINCEN_CERT_STORAGE_KEY,
  DEMO_DOCUMENTS_STORAGE_KEY,
  DEMO_DOCUMENT_REQUESTS_STORAGE_KEY,
  DEMO_CONDO_DILIGENCE_STORAGE_KEY,
  DEMO_POST_CLOSING_UNDERTAKINGS_STORAGE_KEY,
  DEMO_MATTER_REVIEW_TASKS_STORAGE_KEY,
  DEMO_CONDO_DILIGENCE_ACTIVITIES_STORAGE_KEY,
  DEMO_INTAKE_LEADS_STORAGE_KEY,
] as const

/** Intake leads were historically mirrored to sessionStorage under the same key string. */
export const DEMO_SESSION_STORAGE_KEYS = [DEMO_INTAKE_LEADS_STORAGE_KEY] as const

export function canUseBrowserStorage(): boolean {
  return typeof window !== 'undefined'
}

export function safeLocalStorageGet(key: string): string | null {
  if (!canUseBrowserStorage()) return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function safeLocalStorageSet(key: string, value: string): boolean {
  if (!canUseBrowserStorage()) return false
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function safeLocalStorageRemove(key: string): void {
  if (!canUseBrowserStorage()) return
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export function safeSessionStorageGet(key: string): string | null {
  if (!canUseBrowserStorage()) return null
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

export function safeSessionStorageSet(key: string, value: string): boolean {
  if (!canUseBrowserStorage()) return false
  try {
    window.sessionStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function safeSessionStorageRemove(key: string): void {
  if (!canUseBrowserStorage()) return
  try {
    window.sessionStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export function wrapDemoPersistedData<T>(
  data: T,
  version: number = DEMO_PERSISTENCE_SCHEMA_VERSION,
): DemoPersistedEnvelope<T> {
  return { v: version, data }
}

export function serializeDemoPersistedData<T>(
  data: T,
  version: number = DEMO_PERSISTENCE_SCHEMA_VERSION,
): string {
  return JSON.stringify(wrapDemoPersistedData(data, version))
}

function isEnvelope(value: unknown): value is DemoPersistedEnvelope<unknown> {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    'v' in value &&
    'data' in value &&
    typeof (value as DemoPersistedEnvelope<unknown>).v === 'number'
  )
}

/**
 * Parse + version-check + validate. Accepts:
 * - Versioned `{ v, data }` envelopes (preferred)
 * - Legacy raw JSON payloads (pre-envelope), treated as current schema when they validate
 *
 * Returns null for missing, invalid JSON, wrong version, or failed schema validation.
 */
export function readDemoPersistedData<T>(
  raw: string | null | undefined,
  validate: (data: unknown) => T | null,
  options?: { expectedVersion?: number },
): T | null {
  if (raw == null || raw === '') return null
  const expectedVersion = options?.expectedVersion ?? DEMO_PERSISTENCE_SCHEMA_VERSION
  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch {
    return null
  }

  let candidate: unknown
  if (isEnvelope(parsed)) {
    if (parsed.v !== expectedVersion) return null
    candidate = parsed.data
  } else {
    // Legacy unversioned payload — accept only if schema validates.
    candidate = parsed
  }

  try {
    return validate(candidate)
  } catch {
    return null
  }
}

export function writeDemoPersistedData<T>(key: string, data: T): boolean {
  return safeLocalStorageSet(key, serializeDemoPersistedData(data))
}

/** Clears every demo-owned localStorage + sessionStorage key. Safe on SSR. */
export function clearAllDemoPersistedState(): void {
  for (const key of DEMO_LOCAL_STORAGE_KEYS) {
    safeLocalStorageRemove(key)
  }
  for (const key of DEMO_SESSION_STORAGE_KEYS) {
    safeSessionStorageRemove(key)
  }
}

/** Minimal matter row guard — enough to avoid blank/corrupt list; full shape filled by merge with seed. */
export function validateDemoMattersStoredArray(data: unknown): Array<{ id: string } & Record<string, unknown>> | null {
  if (!Array.isArray(data)) return null
  const rows: Array<{ id: string } & Record<string, unknown>> = []
  for (const item of data) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    const o = item as Record<string, unknown>
    if (typeof o.id !== 'string' || !o.id.trim()) continue
    if (typeof o.file_id !== 'string' || !o.file_id.trim()) continue
    rows.push(o as { id: string } & Record<string, unknown>)
  }
  // Empty array is valid “cleared list” for first-visit absence we use null via missing key;
  // empty stored array still means “use seed merge with nothing stored” — treat as valid.
  return rows
}

export function validateIdArray(data: unknown): Array<{ id: string } & Record<string, unknown>> | null {
  if (!Array.isArray(data)) return null
  const rows: Array<{ id: string } & Record<string, unknown>> = []
  for (const item of data) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    const o = item as Record<string, unknown>
    if (typeof o.id !== 'string' || !o.id.trim()) continue
    rows.push(o as { id: string } & Record<string, unknown>)
  }
  return rows
}

export function validateObjectMap(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  return data as Record<string, unknown>
}

export function validateFinCENCertRequestsArray(
  data: unknown,
): Array<{ token: string; matterId: string } & Record<string, unknown>> | null {
  if (!Array.isArray(data)) return null
  const rows: Array<{ token: string; matterId: string } & Record<string, unknown>> = []
  for (const item of data) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    const o = item as Record<string, unknown>
    if (typeof o.token !== 'string' || !o.token.trim()) continue
    if (typeof o.matterId !== 'string') continue
    rows.push(o as { token: string; matterId: string } & Record<string, unknown>)
  }
  return rows
}

export function validateIntakeLeadsArray(
  data: unknown,
): Array<{ id: string; token: string } & Record<string, unknown>> | null {
  if (!Array.isArray(data)) return null
  const rows: Array<{ id: string; token: string } & Record<string, unknown>> = []
  for (const item of data) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    const o = item as Record<string, unknown>
    if (typeof o.id !== 'string' || !o.id.trim()) continue
    if (typeof o.token !== 'string' || !o.token.trim()) continue
    rows.push(o as { id: string; token: string } & Record<string, unknown>)
  }
  return rows.length > 0 ? rows : null
}
