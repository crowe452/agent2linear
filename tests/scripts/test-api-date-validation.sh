#!/usr/bin/env bash
###############################################################################
# Test: API Date Validation
# Wrapper script to execute test-api-date-validation.js
###############################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Execute the JavaScript test with tsx (since it imports TypeScript source)
npx tsx "${SCRIPT_DIR}/test-api-date-validation.js" "$@"
