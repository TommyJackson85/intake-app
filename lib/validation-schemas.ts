// lib/validation-schemas.ts - Zod schemas for all endpoints
// Copy-paste ready - prevents injection attacks

import { z } from 'zod';

// ============================================
// Authentication Schemas
// ============================================

export const SignInSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(255),
});

export const SignUpSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(8, 'Password too short').max(255),
  confirmPassword: z.string(),
  firmName: z.string().min(2, 'Firm name too short').max(255),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

export const PasswordResetSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
});

export const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(8).max(255),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(255),
  confirmPassword: z.string(),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

// ============================================
// Client Schemas
// ============================================

export const CreateClientSchema = z.object({
  name: z.string().min(1, 'Name required').max(255),
  email: z.string().email('Invalid email').max(255),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
    .optional()
    .nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(50).optional().nullable(),
  zipCode: z.string().max(20).optional().nullable(),
  matterType: z.enum([
    'real_estate_purchase',
    'real_estate_sale',
    'conveyancing',
    'lease_agreement',
    'property_dispute',
    'other',
  ]),
  notes: z.string().max(5000).optional().nullable(),
  amlStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
});

export const UpdateClientSchema = CreateClientSchema.partial();

// ============================================
// Lead Schemas
// ============================================

export const CreateLeadSchema = z.object({
  firstName: z.string().min(1, 'First name required').max(100),
  lastName: z.string().min(1, 'Last name required').max(100),
  email: z.string().email('Invalid email').max(255),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
    .optional()
    .nullable(),
  matterType: z.enum([
    'real_estate_purchase',
    'real_estate_sale',
    'conveyancing',
    'lease_agreement',
    'property_dispute',
    'other',
  ]),
  propertyAddress: z.string().max(500).optional().nullable(),
  budget: z.number().positive('Budget must be positive').optional(),
  timeline: z.enum(['urgent', 'soon', 'flexible']).optional(),
  notes: z.string().max(2000).optional().nullable(),
  source: z.enum([
    'website_form',
    'google_search',
    'facebook',
    'referral',
    'previous_client',
    'other',
  ]).optional(),
});

export const UpdateLeadSchema = CreateLeadSchema.partial();

export const UpdateLeadStatusSchema = z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'rejected']),
  notes: z.string().max(1000).optional(),
});

// ============================================
// Matter Schemas
// ============================================

export const CreateMatterSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  title: z.string().min(5, 'Title too short').max(255),
  matterType: z.enum([
    'real_estate_purchase',
    'real_estate_sale',
    'conveyancing',
    'lease_agreement',
    'property_dispute',
    'other',
  ]),
  description: z.string().max(5000).optional(),
  assignedTo: z.string().uuid('Invalid user ID').optional(),
  status: z.enum(['open', 'in_progress', 'on_hold', 'closed']).optional(),
  budget: z.number().positive().optional(),
  deadline: z.string().datetime().optional(),
});

export const UpdateMatterSchema = CreateMatterSchema.partial();

// ============================================
// AML Check Schemas
// ============================================

export const CreateAMLCheckSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  name: z.string().min(1, 'Name required').max(255),
  email: z.string().email('Invalid email').max(255),
  dateOfBirth: z.string().datetime().optional(),
  address: z.string().max(500).optional(),
});

export const AMLCheckResultSchema = z.object({
  checkId: z.string(),
  status: z.enum(['pending', 'passed', 'failed', 'manual_review']),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  findings: z.array(z.string()).optional(),
  timestamp: z.string().datetime(),
});

// ============================================
// API Key Schemas
// ============================================

export const RotateAPIKeySchema = z.object({
  currentPassword: z.string().min(8, 'Password required'),
});

export const APIKeyResponseSchema = z.object({
  apiKey: z.string(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  scopes: z.array(z.enum(['leads:read', 'leads:write', 'clients:read', 'clients:write', 'aml:read', 'matters:read'])),
});

// ============================================
// Firm Settings Schemas
// ============================================

export const UpdateFirmSettingsSchema = z.object({
  name: z.string().min(2, 'Name too short').max(255).optional(),
  email: z.string().email('Invalid email').max(255).optional(),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
    .optional(),
  address: z.string().max(500).optional(),
  timezone: z.string().refine(
    (tz) => Intl.DateTimeFormat.prototype.resolvedOptions().timeZone === tz || tz === 'UTC',
    'Invalid timezone'
  ).optional(),
  amlProvider: z.enum(['provider_a', 'provider_b', 'provider_c']).optional(),
});

// ============================================
// Pagination & Filter Schemas
// ============================================

export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc').optional(),
});

export const LeadFilterSchema = PaginationSchema.extend({
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'rejected']).optional(),
  source: z.string().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
});

// ============================================
// GDPR Schemas
// ============================================

export const GDPRExportSchema = z.object({
  includeAuditLogs: z.boolean().default(false),
  format: z.enum(['json', 'csv']).default('json'),
});

export const GDPRDeleteSchema = z.object({
  confirmPassword: z.string().min(8, 'Password required'),
  confirmDelete: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm deletion' }),
  }),
});

// ============================================
// Type Exports (for TypeScript)
// ============================================

export type SignInInput = z.infer<typeof SignInSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type CreateClientInput = z.infer<typeof CreateClientSchema>;
export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;
export type UpdateLeadStatusInput = z.infer<typeof UpdateLeadStatusSchema>;
export type CreateMatterInput = z.infer<typeof CreateMatterSchema>;
export type CreateAMLCheckInput = z.infer<typeof CreateAMLCheckSchema>;
export type UpdateFirmSettingsInput = z.infer<typeof UpdateFirmSettingsSchema>;

// ============================================
// Validation Helper
// ============================================

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}