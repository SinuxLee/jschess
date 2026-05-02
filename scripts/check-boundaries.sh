#!/usr/bin/env bash
# scripts/check-boundaries.sh — CI gate for package boundaries.
# Fails fast (non-zero) if any forbidden import pattern is detected.
# Runs as plain grep so ESLint-disable comments cannot silence it.

set -euo pipefail

fail=0

check() {
  local description="$1"
  local dir="$2"
  local pattern="$3"
  if grep -rnE "$pattern" "$dir" \
      --include='*.ts' --include='*.svelte' \
      --exclude='*.test.ts' 2>/dev/null; then
    echo "❌ Boundary violation: $description"
    fail=1
  fi
}

check "engine imports DOM globals" \
  "packages/engine/src" \
  "\\b(document|window|HTMLElement|Audio|Image|fetch|localStorage)\\b"

check "engine imports other workspace packages" \
  "packages/engine/src" \
  "^(import|export).*from ['\"]@jschess/(ai|game|app)"

check "ai imports DOM globals" \
  "packages/ai/src" \
  "\\b(document|window|HTMLElement|Audio|Image|localStorage)\\b"

check "ai imports svelte or app/game" \
  "packages/ai/src" \
  "^(import|export).*from ['\"](@jschess/(game|app)|svelte)"

check "game imports DOM globals" \
  "packages/game/src" \
  "\\b(document|window|HTMLElement|Audio|Image|localStorage)\\b"

check "game imports svelte or app" \
  "packages/game/src" \
  "^(import|export).*from ['\"](svelte|@jschess/app|@preact/signals)"

check "game imports @jschess/ai" \
  "packages/game/src" \
  "^(import|export).*from ['\"]@jschess/ai"

check "game uses svelte runes" \
  "packages/game/src" \
  "\\\$state|\\\$derived|\\\$effect|\\\$props"

# app may import @jschess/engine and @jschess/game directly.
# @jschess/ai is the Search engine — app may only import it inside the
# Web Worker entry under packages/app/src/workers/. Anywhere else would
# pull the ~200KB search engine into the main bundle, defeating the worker.
if grep -rnE "^(import|export).*from ['\"]@jschess/ai" \
    packages/app/src \
    --include='*.ts' --include='*.svelte' \
    --exclude='*.test.ts' 2>/dev/null \
    | grep -v '^packages/app/src/workers/'; then
  echo "❌ Boundary violation: app imports @jschess/ai outside packages/app/src/workers/"
  fail=1
fi

if [ $fail -ne 0 ]; then
  echo ""
  echo "Boundary check FAILED."
  exit 1
fi

echo "✅ All package boundaries respected."
