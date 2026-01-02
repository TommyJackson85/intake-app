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
  const schedulePath = path.join(process.cwd(), 'legal/DATA_RETENTION_SCHEDULE.md')

  if (!fs.existsSync(schedulePath)) {
    fail('DATA_RETENTION_SCHEDULE.md not found')
  }
  return fs.readFileSync(schedulePath, 'utf8')
}

async function getSqlTables(): Promise<string[]> {
  // Very simple parser: look for "create table <name>" in Supabase SQL
  const files = await glob('supabase/migrations/**/*.sql', {
    ignore: '**/snapshots/**',
    nodir: true,
  })

  const tableNames = new Set<string>()

  for (const file of files) {
    const sql = fs.readFileSync(file, 'utf8')
    const regex = /create\s+table\s+if\s+not\s+exists\s+public\.([a-zA-Z0-9_]+)/gi
    let match: RegExpExecArray | null
    while ((match = regex.exec(sql)) !== null) {
      tableNames.add(match[1])
    }
  }

  return Array.from(tableNames)
}

function checkRetentionVsSchedule(retentionCfg: RetentionConfig, scheduleMd: string) {
  // 1) Every key in retention.config.json should appear in DATA_RETENTION_SCHEDULE.md
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

  // 2) Optionally warn if schedule mentions tables not in retention.config.json
  const scheduleLines = scheduleMd.split('\n')
  const mentioned: string[] = []
  for (const line of scheduleLines) {
    // crude capture of lowercase table-like tokens
    const m = line.match(/\b(marketing_leads|profiles|firms|auth\.users|clients|matters|aml_checks|audit_events|DB backups)\b/gi)
    if (m) {
      mentioned.push(...m.map((s) => s.replace('auth.users', 'auth.users')))
    }
  }

  const unknown: string[] = []
  for (const token of mentioned) {
    const key = token === 'auth.users' ? 'auth.users' : token
    if (!retentionCfg[key] && !retentionCfg[key.split('.')[0]]) {
      unknown.push(token)
    }
  }

  if (unknown.length > 0) {
    warn(
      `DATA_RETENTION_SCHEDULE.md mentions tables/categories not found in retention.config.json: ${Array.from(
        new Set(unknown),
      ).join(', ')}`,
    )
  }
}

function checkSchemaVsRetention(retentionCfg: RetentionConfig, schemaTables: string[]) {
  // Check that important tables from schema have retention entries
  const requiredTables = ['marketing_leads', 'profiles', 'firms', 'clients', 'matters', 'aml_checks', 'audit_events']

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

// Very simple code-pattern check: aml_checks access must import logAuditEvent
async function checkAmlAccessLogging() {
  const apiFiles = await glob('app/api/**/*.ts?(x)', { nodir: true })
  const offenders: string[] = []

  for (const file of apiFiles) {
    const code = fs.readFileSync(file, 'utf8')
    if (code.includes("from('aml_checks'") || code.includes('from("aml_checks"')) {
      const hasAuditImport =
        code.includes("from '@/lib/auditLog'") ||
        code.includes('from "./auditLog"') ||
        code.includes("logAuditEvent(")

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
