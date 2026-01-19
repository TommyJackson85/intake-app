// lib/env-validation.ts - Environment variable validation at startup
// Copy-paste ready - prevents misconfiguration

import { z } from 'zod';

/**
 * Environment variable schema
 */
const EnvSchema = z.object({
  // ========== PUBLIC ENV VARS ==========
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('Invalid Supabase URL')
    .describe('Supabase project URL'),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'Supabase anon key is required')
    .describe('Supabase anonymous key'),

  // ========== SECRET ENV VARS (NOT NEXT_PUBLIC) ==========
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'Service role key is required')
    .describe('Supabase service role key (for admin operations)'),

  DATABASE_URL: z
    .string()
    .url('Invalid database URL')
    .optional()
    .describe('Direct database connection string'),

  // ========== AML CONFIGURATION ==========
  AML_PROVIDER: z
    .enum(['provider_a', 'provider_b', 'provider_c'])
    .optional()
    .describe('AML provider selection'),

  AML_API_KEY: z
    .string()
    .min(1, 'AML API key required if AML enabled')
    .optional()
    .describe('AML provider API key'),

  AML_API_URL: z
    .string()
    .url('Invalid AML API URL')
    .optional()
    .describe('AML provider API endpoint'),

  AML_API_TIMEOUT: z
    .string()
    .transform((v) => parseInt(v, 10))
    .refine((n) => n > 0 && n <= 30000, 'Timeout must be 0-30000ms')
    .optional()
    .default('5000')
    .describe('AML API timeout in milliseconds'),

  // ========== SECURITY CONFIGURATION ==========
  JWT_SECRET: z
    .string()
    .min(32, 'JWT secret must be at least 32 characters')
    .describe('Secret for JWT signing'),

  SESSION_SECRET: z
    .string()
    .min(32, 'Session secret must be at least 32 characters')
    .describe('Secret for session signing'),

  ENCRYPTION_KEY: z
    .string()
    .min(32, 'Encryption key must be at least 32 characters')
    .describe('Key for encryption at rest'),

  // ========== EMAIL CONFIGURATION ==========
  EMAIL_PROVIDER: z
    .enum(['sendgrid', 'mailgun', 'resend'])
    .optional()
    .describe('Email service provider'),

  SENDGRID_API_KEY: z
    .string()
    .optional()
    .describe('SendGrid API key'),

  MAILGUN_API_KEY: z
    .string()
    .optional()
    .describe('Mailgun API key'),

  RESEND_API_KEY: z
    .string()
    .optional()
    .describe('Resend API key'),

  EMAIL_FROM: z
    .string()
    .email('Invalid sender email')
    .optional()
    .describe('Default from email address'),

  // ========== DEPLOYMENT CONFIGURATION ==========
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development')
    .describe('Environment'),

  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('Invalid app URL')
    .optional()
    .describe('Application base URL'),

  // ========== MONITORING & LOGGING ==========
  SENTRY_AUTH_TOKEN: z
    .string()
    .optional()
    .describe('Sentry authentication token'),

  SENTRY_PROJECT_ID: z
    .string()
    .optional()
    .describe('Sentry project ID'),

  LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error'])
    .default('info')
    .describe('Logging level'),

  // ========== FEATURE FLAGS ==========
  ENABLE_AML_CHECKS: z
    .string()
    .transform((v) => v === 'true')
    .default('false')
    .describe('Enable AML integration'),

  ENABLE_ANALYTICS: z
    .string()
    .transform((v) => v === 'true')
    .default('true')
    .describe('Enable analytics'),

  RATE_LIMIT_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('true')
    .describe('Enable rate limiting'),
});

export type Env = z.infer<typeof EnvSchema>;

/**
 * Validated environment variables
 */
let validatedEnv: Env | null = null;

/**
 * Get validated environment variables
 * Call this at application startup
 */
export function getValidatedEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = EnvSchema.parse(process.env);
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter((e) => e.code === 'invalid_type')
        .map((e) => e.path.join('.'));

      const invalidVars = error.errors
        .filter((e) => e.code !== 'invalid_type')
        .map((e) => `${e.path.join('.')}: ${e.message}`);

      const message = [
        'Environment variable validation failed:',
        missingVars.length > 0 ? `Missing: ${missingVars.join(', ')}` : '',
        invalidVars.length > 0 ? `Invalid: ${invalidVars.join('; ')}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      console.error(message);
      throw new Error(message);
    }

    throw error;
  }
}

/**
 * Validate specific environment variable
 */
export function validateEnvVar(key: keyof Env): string | undefined {
  const env = getValidatedEnv();
  return env[key] as any;
}

/**
 * Check if in production
 */
export function isProduction(): boolean {
  return getValidatedEnv().NODE_ENV === 'production';
}

/**
 * Check if in development
 */
export function isDevelopment(): boolean {
  return getValidatedEnv().NODE_ENV === 'development';
}

// ============================================
// Security Checks
// ============================================

/**
 * Verify production security requirements
 */
export function verifyProductionSecurity(): string[] {
  const env = getValidatedEnv();
  const warnings: string[] = [];

  if (env.NODE_ENV === 'production') {
    // Check secrets are strong
    if (env.JWT_SECRET && env.JWT_SECRET.length < 32) {
      warnings.push('JWT_SECRET is too short (<32 chars)');
    }

    if (env.SESSION_SECRET && env.SESSION_SECRET.length < 32) {
      warnings.push('SESSION_SECRET is too short (<32 chars)');
    }

    // Check database connection
    if (!env.DATABASE_URL && !env.NEXT_PUBLIC_SUPABASE_URL) {
      warnings.push('No database connection configured');
    }

    // Check HTTPS in production
    if (
      env.NEXT_PUBLIC_APP_URL &&
      !env.NEXT_PUBLIC_APP_URL.startsWith('https://')
    ) {
      warnings.push('App URL must use HTTPS in production');
    }

    // Check AML configuration if enabled
    if (env.ENABLE_AML_CHECKS && !env.AML_API_KEY) {
      warnings.push('AML enabled but no API key provided');
    }
  }

  return warnings;
}

/**
 * Call at application startup to validate environment
 */
export function validateEnvironmentAtStartup(): void {
  console.log('[ENV] Validating environment variables...');

  const env = getValidatedEnv();

  console.log(`[ENV] Environment: ${env.NODE_ENV}`);
  console.log(`[ENV] Supabase URL: ${env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`[ENV] AML Enabled: ${env.ENABLE_AML_CHECKS}`);
  console.log(`[ENV] Rate Limiting: ${env.RATE_LIMIT_ENABLED}`);

  const warnings = verifyProductionSecurity();
  if (warnings.length > 0) {
    console.warn('[ENV] Security warnings:');
    warnings.forEach((w) => console.warn(`  - ${w}`));
  }

  console.log('[ENV] Environment validation complete ✅');
}

/**
 * .env.example - Copy this to .env.local
 *
 * ===== PUBLIC (Safe to commit) =====
 * NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
 * NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * NEXT_PUBLIC_APP_URL=https://app.example.com
 *
 * ===== SECRET (Never commit) =====
 * SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * DATABASE_URL=postgresql://user:pass@host/db
 * JWT_SECRET=your-very-long-secret-key-minimum-32-characters-long
 * SESSION_SECRET=your-very-long-secret-key-minimum-32-characters-long
 * ENCRYPTION_KEY=your-very-long-secret-key-minimum-32-characters-long
 *
 * ===== AML =====
 * ENABLE_AML_CHECKS=true
 * AML_PROVIDER=provider_a
 * AML_API_KEY=your-aml-api-key
 * AML_API_URL=https://api.aml-provider.com
 * AML_API_TIMEOUT=5000
 *
 * ===== EMAIL =====
 * EMAIL_PROVIDER=sendgrid
 * SENDGRID_API_KEY=SG.xxxxxxxxxxxx
 * EMAIL_FROM=noreply@example.com
 *
 * ===== MONITORING =====
 * SENTRY_AUTH_TOKEN=your-sentry-token
 * SENTRY_PROJECT_ID=123456
 * LOG_LEVEL=info
 *
 * ===== FEATURE FLAGS =====
 * ENABLE_ANALYTICS=true
 * RATE_LIMIT_ENABLED=true
 */