/**
 * Database Type Definitions
 * Copy this entire file to: types/database.ts
 */

// ============================================================================
// CORE DOMAIN TYPES
// ============================================================================

export interface Firm {
  id: string
  firm_name: string
  firm_state?: string
  api_key?: string
  created_at: string
}

export interface Profile {
  id: string
  email: string
  password_hash: string
  firm_id: string
  role: 'firm_owner' | 'lawyer' | 'staff' | 'support_readonly'
  created_at: string
}

export interface Client {
  id: string
  firm_id: string
  name: string
  email?: string
  phone?: string
  address?: string
  created_at: string
  updated_at: string
}

export interface Matter {
  id: string
  firm_id: string
  client_id: string
  matter_type?: 'purchase' | 'sale' | 'refi' | 'other'
  matter_status: 'open' | 'closed' | 'pending' | 'on_hold'
  created_at: string
  updated_at: string
}

export interface AMLCheck {
  id: string
  firm_id: string
  client_id: string
  kyc_status?: 'pending' | 'approved' | 'rejected'
  pep_flag: boolean
  risk_score?: number
  beneficial_owners?: Record<string, any>[]
  checked_at?: string
  created_at: string
  updated_at: string
}

export interface AuditEvent {
  id: string
  firm_id: string
  user_id?: string | null
  event_type: 'login' | 'create' | 'read' | 'update' | 'delete' | 'export' | 'api_key_rotated'
  entity_type: string
  entity_id?: string | null
  ip_address?: string | null
  details?: Record<string, any> | null
  lawful_basis?: string | null
  created_at: string
}

export interface MarketingLead {
  id: string
  firm_id: string
  email: string
  firm_name?: string
  state?: string
  ip_address?: string
  created_at: string
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface SignInRequest {
  email: string
  password: string
}

export interface SignInResponse {
  success: boolean
  user_id?: string
  firm_id?: string
  error?: string
}

export interface ApiListResponse<T> {
  data: T[]
  count: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ApiErrorResponse {
  error: string
  details?: any
}

// ============================================================================
// SESSION & CONTEXT TYPES
// ============================================================================

export interface SessionContext {
  firmId: string
  userId: string
  userRole: 'firm_owner' | 'lawyer' | 'staff' | 'support_readonly'
}

export interface AuthSession {
  firmId: string | null
  userId: string | null
  isAuthenticated: boolean
}

// ============================================================================
// AUDIT LOG TYPES
// ============================================================================

export interface AuditLogInput {
  firm_id: string
  user_id?: string | null
  event_type: AuditEvent['event_type']
  entity_type: string
  entity_id?: string | null
  ip_address?: string
  details?: Record<string, any>
  lawful_basis?: string
}

// ============================================================================
// FORM INPUT TYPES
// ============================================================================

export interface CreateClientInput {
  name: string
  email?: string
  phone?: string
  address?: string
}

export interface UpdateClientInput {
  name?: string
  email?: string
  phone?: string
  address?: string
}

export interface CreateMatterInput {
  client_id: string
  matter_type?: string
  matter_status?: string
}

export interface CreateAMLCheckInput {
  client_id: string
  kyc_status?: string
  pep_flag?: boolean
  risk_score?: number
  beneficial_owners?: Record<string, any>[]
}

// ============================================================================
// GDPR EXPORT TYPES
// ============================================================================

export interface GDPRExportData {
  exported_at: string
  firm_id: string
  clients: Client[]
  matters: Matter[]
  aml_checks: AMLCheck[]
  audit_events: AuditEvent[]
  marketing_leads: MarketingLead[]
}

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export const DEFAULT_PAGE_LIMIT = 10
export const MAX_PAGE_LIMIT = 100