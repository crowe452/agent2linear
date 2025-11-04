#!/usr/bin/env bash
###############################################################################
# Test: API Dependencies (M23-TS01)
# Wrapper script to execute test-api-dependencies.js
###############################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Execute the JavaScript test with tsx (since it imports TypeScript source)
npx tsx "${SCRIPT_DIR}/test-api-dependencies.js" "$@"
