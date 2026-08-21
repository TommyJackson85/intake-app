#!/usr/bin/env bash
# Idempotent Cloud Agent install script for intake-app (Next.js + Supabase).
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[install] Installing dependencies with npm ci..."
if ! npm ci; then
  echo "[install] npm ci failed (lockfile drift?); falling back to npm install." >&2
  npm install
fi

# Provide local placeholder env vars so the dev server can boot for UI/demo work.
# Only created when no real configuration is present. Real Supabase credentials
# should be provided via Cloud Agent Secrets (injected as environment variables),
# which take precedence over these placeholders.
if [ ! -f .env.local ] && [ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ]; then
  echo "[install] Writing placeholder .env.local (no real Supabase config detected)."
  cat > .env.local <<'ENV'
# Local development placeholders created by .cursor/install.sh.
# These are NOT real credentials. Point them at a real Supabase project
# (via Secrets or your own .env.local) to exercise auth/database flows.
# The in-memory /demo experience works without a live backend.
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=local-anon-key-placeholder
SUPABASE_SERVICE_ROLE_KEY=local-service-role-key-placeholder
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ALLOW_DEV_SIGNUP=true
ENV
else
  echo "[install] Skipping placeholder .env.local (existing file or real config present)."
fi

echo "[install] Done."
