/**
 * Data Classification & Role-Based Filtering
 * Copy this entire file to: lib/dataClassification.ts
 * 
 * Restricts access to sensitive fields (AML, KYC data) based on user role
 * Ensures compliance with data minimization principle (GDPR)
 */

import { Profile } from '@/types/database'

/**
 * Define which columns are "highly confidential"
 * Maps entity_type -> array of sensitive column names
 * 
 * Only firm_owner and lawyer roles see these fields
 * Staff/support roles have them filtered out
 */
export const HIGHLY_CONFIDENTIAL_FIELDS: Record<string, string[]> = {
  aml_checks: [
    'pep_flag', // Politically exposed person flag
    'risk_score', // AML risk score
    'kyc_status', // KYC approval status
    'beneficial_owners', // Beneficial ownership info
    'checked_at', // When KYC was performed
  ],
  clients: [
    'ssn', // Social security number (if stored)
    'tax_id', // Tax ID
    'government_id', // Government ID number
  ],
  matters: [
    'settlement_amount', // Financial data sensitivity
    'adverse_party_info', // Opposing party details
  ],
}

/**
 * Filter out confidential fields based on user role
 * 
 * @param record - The database record to filter
 * @param entityType - Type of entity (aml_checks, clients, etc.)
 * @param userRole - User's role (firm_owner, lawyer, staff, support_readonly)
 * @returns Filtered record with sensitive fields removed (if not authorized)
 * 
 * @example
 * const amlCheck = await getAMLCheckFromDB(id)
 * const filtered = filterByConfidentiality(amlCheck, 'aml_checks', userRole)
 * // If userRole='staff' → pep_flag, risk_score removed
 * // If userRole='lawyer' → all fields present
 */
export function filterByConfidentiality(
  record: Record<string, any>,
  entityType: string,
  userRole?: string
): Record<string, any> {
  // If no confidential fields defined for this type, return as-is
  if (!HIGHLY_CONFIDENTIAL_FIELDS[entityType]) {
    return record
  }

  // If user role is not set or not authorized, remove all confidential fields
  if (!userRole || !['firm_owner', 'lawyer'].includes(userRole)) {
    const filtered = { ...record }
    const sensitiveFields = HIGHLY_CONFIDENTIAL_FIELDS[entityType]

    sensitiveFields.forEach(field => {
      delete filtered[field]
    })

    return filtered
  }

  // Authorized role (firm_owner, lawyer) sees everything
  return record
}

/**
 * Filter an array of records
 * 
 * @example
 * const amlChecks = await getAMLChecks(firmId)
 * const filtered = filterByConfidentialityBatch(amlChecks, 'aml_checks', userRole)
 */
export function filterByConfidentialityBatch(
  records: Record<string, any>[],
  entityType: string,
  userRole?: string
): Record<string, any>[] {
  return records.map(record =>
    filterByConfidentiality(record, entityType, userRole)
  )
}

/**
 * Determine data sensitivity level
 * 
 * @returns 'normal' | 'confidential' | 'highly_confidential'
 */
export function getDataSensitivity(
  entityType: string
): 'normal' | 'confidential' | 'highly_confidential' {
  if (HIGHLY_CONFIDENTIAL_FIELDS[entityType]) {
    return 'highly_confidential'
  }
  return 'normal'
}

/**
 * Check if user can access a specific field
 * 
 * @example
 * if (!canAccessField('aml_checks', 'pep_flag', userRole)) {
 *   return res.status(403).json({ error: 'Access denied' })
 * }
 */
export function canAccessField(
  entityType: string,
  fieldName: string,
  userRole?: string
): boolean {
  const confidentialFields = HIGHLY_CONFIDENTIAL_FIELDS[entityType] || []

  // If field is not confidential, everyone can access
  if (!confidentialFields.includes(fieldName)) {
    return true
  }

  // If field is confidential, only firm_owner and lawyer can access
  if (!userRole || !['firm_owner', 'lawyer'].includes(userRole)) {
    return false
  }

  return true
}

/**
 * Get list of fields that are hidden from a user
 * Useful for frontend (show "restricted" indicators)
 * 
 * @example
 * const hiddenFields = getHiddenFields('aml_checks', userRole)
 * // Returns: ['pep_flag', 'risk_score', ...] if user is staff
 * // Returns: [] if user is lawyer
 */
export function getHiddenFields(
  entityType: string,
  userRole?: string
): string[] {
  if (!userRole || !['firm_owner', 'lawyer'].includes(userRole)) {
    return HIGHLY_CONFIDENTIAL_FIELDS[entityType] || []
  }

  return []
}
