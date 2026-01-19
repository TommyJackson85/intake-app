import fs from 'fs'
import path from 'path'
import { glob } from 'glob'

type RetentionConfig = Record<string, string>

function fail(message: string): never {
  console.error(`❌ Compliance check failed: ${message}`)
  process.exit(1)
}

function warn(message: string) {
  console.warn(`⚠️  Compliance warning: ${message}`)
}

function loadRetentionConfig(): RetentionConfig {
  const cfgPath = path.join(process.cwd(), 'retention.config.json')
  if (!fs.existsSync(cfgPath)) {
    fail('retention.config.json not found in repo root')
  }
  const raw = fs.readFileSync(cfgPath, 'utf8')
  return JSON.parse(raw)
}

function loadDataRetentionSchedule(): string {
  const schedulePath = path.join(
    process.cwd(),
    'legal/DATA_RETENTION_SCHEDULE.md',
  )

  if (!fs.existsSync(schedulePath)) {
    fail('DATA_RETENTION_SCHEDULE.md not found')
  }
  return fs.readFileSync(schedulePath, 'utf8')
}

async function getSqlTables(): Promise<string[]> {
  // Very simple parser: look for "create table if not exists public.<name>" in Supabase SQL
  const files = await glob('supabase/migrations/**/*.sql', {
    ignore: '**/snapshots/**',
    nodir: true,
  })

  const tableNames = new Set<string>()

  for (const file of files) {
    const sql = fs.readFileSync(file, 'utf8')
    const regex =
      /create\s+table\s+if\s+not\s+exists\s+public\.([a-zA-Z0-9_]+)/gi
    let match: RegExpExecArray | null
    while ((match = regex.exec(sql)) !== null) {
      tableNames.add(match[1])
    }
  }

  return Array.from(tableNames)
}

// 1) Ensure every key in retention.config.json appears in DATA_RETENTION_SCHEDULE.md
function checkRetentionVsSchedule(
  retentionCfg: RetentionConfig,
  scheduleMd: string,
) {
  const missingInSchedule: string[] = []

  for (const tableOrCategory of Object.keys(retentionCfg)) {
    if (tableOrCategory.startsWith('_')) continue // meta entries like _backups
    const pattern = new RegExp(`\\b${tableOrCategory}\\b`, 'i')
    if (!pattern.test(scheduleMd)) {
      missingInSchedule.push(tableOrCategory)
    }
  }

  if (missingInSchedule.length > 0) {
    fail(
      `These entries exist in retention.config.json but are not mentioned in DATA_RETENTION_SCHEDULE.md: ${missingInSchedule.join(
        ', ',
      )}`,
    )
  }
}

// 2) Ensure important schema tables have retention entries
function checkSchemaVsRetention(
  retentionCfg: RetentionConfig,
  schemaTables: string[],
) {
  // These are the core personal-data tables we care about for retention.
  // marketing_leads is controller-only marketing data but still has a documented retention rule,
  // so it stays here; "doesn't require firm_id" does NOT mean "no retention".
  const requiredTables = [
    'marketing_leads',
    'profiles',
    'firms',
    'clients',
    'matters',
    'aml_checks',
    'audit_events',
  ]

  const missing: string[] = []
  for (const tbl of requiredTables) {
    if (schemaTables.includes(tbl) && !retentionCfg[tbl]) {
      missing.push(tbl)
    }
  }

  if (missing.length > 0) {
    fail(
      `These schema tables are present in supabase/migrations but missing in retention.config.json: ${missing.join(
        ', ',
      )}`,
    )
  }
}

// 3) Very simple code-pattern check: aml_checks access must import logAuditEvent
async function checkAmlAccessLogging() {
  const apiFiles = await glob('app/api/**/*.ts?(x)', { nodir: true })
  const offenders: string[] = []

  for (const file of apiFiles) {
    const code = fs.readFileSync(file, 'utf8')
    if (
      code.includes("from('aml_checks'") ||
      code.includes('from("aml_checks"')
    ) {
      const hasAuditImport =
        code.includes("from '@/lib/auditLog'") ||
        code.includes('from "./auditLog"') ||
        code.includes('logAuditEvent(')

      if (!hasAuditImport) {
        offenders.push(file)
      }
    }
  }

  if (offenders.length > 0) {
    fail(
      `The following API files query aml_checks but do not appear to use logAuditEvent/audit logging: ${offenders.join(
        ', ',
      )}`,
    )
  }
}

async function main() {
  console.log('🔍 Running compliance checks...')

  const retentionCfg = loadRetentionConfig()
  const scheduleMd = loadDataRetentionSchedule()
  const schemaTables = await getSqlTables()

  checkRetentionVsSchedule(retentionCfg, scheduleMd)
  checkSchemaVsRetention(retentionCfg, schemaTables)
  await checkAmlAccessLogging()

  console.log('✅ Compliance checks passed')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
