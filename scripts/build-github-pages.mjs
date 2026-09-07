#!/usr/bin/env node
/**
 * Build a static Next.js export suitable for GitHub Pages project hosting
 * under `/intake-app`.
 *
 * API routes, route handlers, force-dynamic pages, and dynamic segments without
 * generateStaticParams cannot be statically exported. This script temporarily
 * stashes those paths for the duration of `next build`, then restores them so
 * the working tree (and Vercel builds) stay unchanged.
 *
 * Usage: npm run build:github-pages
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const stashRoot = path.join(root, '.github-pages-export-stash')

/**
 * Paths that block `output: 'export'` or cannot produce static HTML without
 * request-time params / a Node server. Relative to repo root.
 */
const EXPORT_INCOMPATIBLE_PATHS = [
  // Route handlers / API (no Node server on GitHub Pages)
  'app/api',
  'app/auth/logout',
  // force-dynamic page
  'app/auth/post-login',
  // Server Action module (not available on static hosting)
  'app/auth/signup/signupAction.ts',
  // Dynamic App Router segments without generateStaticParams
  'app/demo/portal',
  'app/demo/intake',
  'app/demo/matters/[id]',
  'app/demo/fincen-cert',
  'app/intake',
  'app/dashboard/matters/[id]',
  'app/dashboard/intakes/[id]',
  // Request-time proxy (Next 16 middleware replacement) — unsupported for export
  'proxy.ts',
]

function ensureCleanStash() {
  if (fs.existsSync(stashRoot)) {
    fs.rmSync(stashRoot, { recursive: true, force: true })
  }
  fs.mkdirSync(stashRoot, { recursive: true })
}

function stashPath(relPath) {
  const from = path.join(root, relPath)
  if (!fs.existsSync(from)) return false
  const to = path.join(stashRoot, relPath)
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.renameSync(from, to)
  return true
}

function restoreStash() {
  if (!fs.existsSync(stashRoot)) return
  for (const relPath of EXPORT_INCOMPATIBLE_PATHS) {
    const from = path.join(stashRoot, relPath)
    if (!fs.existsSync(from)) continue
    const to = path.join(root, relPath)
    fs.mkdirSync(path.dirname(to), { recursive: true })
    if (fs.existsSync(to)) {
      fs.rmSync(to, { recursive: true, force: true })
    }
    fs.renameSync(from, to)
  }
  fs.rmSync(stashRoot, { recursive: true, force: true })
}

function assertExportArtifacts() {
  const outDir = path.join(root, 'out')
  const required = [
    'index.html',
    'demo/index.html',
    'demo/matters/index.html',
    'demo/documents/index.html',
    'demo/post-closing-undertakings/index.html',
  ]

  const missing = required.filter((rel) => !fs.existsSync(path.join(outDir, rel)))
  if (missing.length > 0) {
    throw new Error(
      `GitHub Pages export missing expected artifacts under out/: ${missing.join(', ')}`,
    )
  }

  // Spot-check that asset URLs / RSC references include the project base path.
  const homeHtml = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
  if (!homeHtml.includes('/intake-app/_next/') && !homeHtml.includes('/intake-app/')) {
    throw new Error(
      'Homepage HTML does not reference /intake-app base path; assetPrefix/basePath may be misconfigured.',
    )
  }

  console.log('Verified static export artifacts:')
  for (const rel of required) {
    console.log(`  ✓ out/${rel}`)
  }
}

function runBuild() {
  const result = spawnSync('npx', ['next', 'build'], {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      GITHUB_PAGES: 'true',
      // Avoid interactive prompts / telemetry noise in CI
      NEXT_TELEMETRY_DISABLED: '1',
    },
    shell: process.platform === 'win32',
  })
  if (result.status !== 0) {
    throw new Error(`next build failed with exit code ${result.status ?? 'unknown'}`)
  }
}

function main() {
  const stashed = []
  try {
    ensureCleanStash()
    for (const relPath of EXPORT_INCOMPATIBLE_PATHS) {
      if (stashPath(relPath)) {
        stashed.push(relPath)
        console.log(`Stashed for static export: ${relPath}`)
      }
    }
    console.log('\nBuilding GitHub Pages static export (GITHUB_PAGES=true, basePath=/intake-app)…\n')
    runBuild()
    assertExportArtifacts()
    console.log('\nGitHub Pages static export ready in ./out (publish this folder).')
  } catch (err) {
    console.error(err instanceof Error ? err.message : err)
    process.exitCode = 1
  } finally {
    restoreStash()
    if (stashed.length) {
      console.log(`Restored ${stashed.length} stashed path(s).`)
    }
  }
}

main()
