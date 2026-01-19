// lib/api-scope.ts

export function assertScope(scopes: string[], required: string) {
  if (!scopes.includes(required)) {
    throw new Error('INSUFFICIENT_SCOPE')
  }
}

export type ApiScope =
  | 'leads:create'
  | 'gdpr:export'
  | 'gdpr:delete'
  | 'aml:write'

export const REQUIRED_SCOPES = {
  createLead: 'leads:create' as ApiScope,
  exportGdpr: 'gdpr:export' as ApiScope,
}