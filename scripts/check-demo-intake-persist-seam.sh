#!/usr/bin/env bash
# Guardrail: DemoIntakeLead.intake / submittedIntake must be persisted only via
# registerIntakeLead + submitDemoIntakeLead (lib/demo/store.tsx), which call
# normalizeIntakeSnapshotForPersist. See JSDoc on that function and system-contract intakes domain.
set -euo pipefail
cd "$(dirname "$0")/.."

violations=0

is_allowed_submitted_intake_line() {
  local file="$1"
  case "$file" in
    lib/demo/store.tsx | lib/demo/demoData.ts | lib/demo/types.ts | tests/*) return 0 ;;
    *) return 1 ;;
  esac
}

# Non-null / non-type submittedIntake assignments (bypass risk if outside allowlist).
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  file="${line%%:*}"
  if is_allowed_submitted_intake_line "$file"; then continue; fi
  echo "check-demo-intake-persist-seam: unexpected submittedIntake assignment — $line" >&2
  violations=$((violations + 1))
done < <(
  git grep -n 'submittedIntake:' -- '*.ts' '*.tsx' 2>/dev/null \
    | grep -vE 'submittedIntake:[[:space:]]+null\b|submittedIntake:[[:space:]]+DemoIntakeSnapshot' \
    || true
)

# Inline intake: { snapshot literals under lib/ or app/ (seed + tests use allowlist / tests dir).
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  file="${line%%:*}"
  case "$file" in
    lib/demo/demoData.ts) continue ;;
    tests/*) continue ;;
    *)
      echo "check-demo-intake-persist-seam: inline intake: { … } under lib/app — prefer registerIntakeLead / seed data — $line" >&2
      violations=$((violations + 1))
      ;;
  esac
done < <(git grep -nE '[[:space:]]intake:[[:space:]]*\{' lib app -- '*.ts' '*.tsx' 2>/dev/null || true)

# Same for submittedIntake: { … } outside demo seed.
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  file="${line%%:*}"
  case "$file" in
    lib/demo/demoData.ts) continue ;;
    tests/*) continue ;;
    *)
      echo "check-demo-intake-persist-seam: inline submittedIntake: { … } under lib/app — use submitDemoIntakeLead / seed data — $line" >&2
      violations=$((violations + 1))
      ;;
  esac
done < <(git grep -nE '[[:space:]]submittedIntake:[[:space:]]*\{' lib app -- '*.ts' '*.tsx' 2>/dev/null || true)

if [[ "$violations" -ne 0 ]]; then
  echo "check-demo-intake-persist-seam: failed ($violations finding(s)). Allowed writers: lib/demo/store.tsx (register/submit), lib/demo/demoData.ts (seed), lib/demo/types.ts (types), tests/* (fixtures)." >&2
  exit 1
fi

echo "check-demo-intake-persist-seam: ok"
