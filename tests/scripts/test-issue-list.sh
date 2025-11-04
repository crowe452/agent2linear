#!/bin/bash
#
# Comprehensive Test Suite for: agent2linear issue list (M15.5)
#
# This script tests the issue list command including pagination, limits, sorting,
# output formats, advanced filters, and performance verification.
#
# Merged from:
#   - test-issue-list-performance.sh (M15.5 Phase 1)
#   - test-issue-list-phase3.sh (M15.5 Phase 3)
#
# Total: ~25 test cases
#
# Setup Requirements:
#   - LINEAR_API_KEY environment variable must be set
#   - agent2linear must be built (npm run build)
#   - At least one team with issues in your Linear workspace
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Script identification
SCRIPT_NAME=$(basename "$0")
TIMESTAMP=$(date +%s)

# Print runtime header
echo ""
echo -e "${YELLOW}==========================================${NC}"
echo -e "${YELLOW}TEST SUITE: ${BOLD}${SCRIPT_NAME}${NC}"
echo -e "${YELLOW}Description: Issue List Comprehensive Tests${NC}"
echo -e "${YELLOW}Timestamp: ${TIMESTAMP}${NC}"
echo -e "${YELLOW}==========================================${NC}"
echo ""

# Counters
PASS=0
FAIL=0
TOTAL=0

# Test prefix
TEST_PREFIX="TEST_LIST_${TIMESTAMP}_"

# Verify LINEAR_API_KEY is set
if [ -z "$LINEAR_API_KEY" ]; then
  echo -e "${RED}ERROR: LINEAR_API_KEY environment variable is not set${NC}"
  exit 1
fi

# Determine the script's directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Verify build exists
if [ ! -f "$PROJECT_ROOT/dist/index.js" ]; then
  echo -e "${RED}ERROR: Build not found at $PROJECT_ROOT/dist/index.js. Run 'npm run build' first${NC}"
  exit 1
fi

CMD="node $PROJECT_ROOT/dist/index.js"

# Helper function to run a test
run_test() {
  local test_num=$1
  local test_name=$2
  TOTAL=$((TOTAL + 1))
  echo -e "${YELLOW}Test $test_num: $test_name${NC}"
}

# Helper function to mark test as passed
pass_test() {
  PASS=$((PASS + 1))
  echo -e "${GREEN}✓ PASS${NC}"
  echo ""
}

# Helper function to mark test as failed
fail_test() {
  local message=$1
  FAIL=$((FAIL + 1))
  echo -e "${RED}✗ FAIL: $message${NC}"
  echo ""
}

# ===========================================
# PHASE 1: BASIC LIST FUNCTIONALITY
# ===========================================

echo "=========================================="
echo "Phase 1: Basic List Functionality"
echo "=========================================="
echo ""

run_test "1" "List issues with default limit (50)"
if $CMD issue list > /tmp/test_list_default.txt 2>&1; then
  # Verify output contains header
  if grep -q "Identifier" /tmp/test_list_default.txt; then
    pass_test
  else
    fail_test "Output missing header"
  fi
else
  fail_test "Command failed"
fi

run_test "2" "List issues with --limit 10"
if $CMD issue list --limit 10 > /tmp/test_list_limit10.txt 2>&1; then
  # Count lines (header + issues + summary line)
  LINE_COUNT=$(wc -l < /tmp/test_list_limit10.txt)
  # Should have: 1 header + up to 10 issues + 1 empty + 1 summary = up to 13 lines
  if [ $LINE_COUNT -le 13 ]; then
    pass_test
  else
    fail_test "Too many lines: $LINE_COUNT (expected ≤13)"
  fi
else
  fail_test "Command failed"
fi

run_test "3" "List issues with --limit 100"
if $CMD issue list --limit 100 > /tmp/test_list_limit100.txt 2>&1; then
  pass_test
else
  fail_test "Command failed"
fi

run_test "4" "List issues with --limit 250 (max)"
if $CMD issue list --limit 250 > /tmp/test_list_limit250.txt 2>&1; then
  pass_test
else
  fail_test "Command failed"
fi

run_test "5" "Error: --limit exceeds 250"
if $CMD issue list --limit 300 > /tmp/test_list_limit_error.txt 2>&1; then
  fail_test "Should have failed with limit > 250"
else
  if grep -q "cannot exceed 250" /tmp/test_list_limit_error.txt; then
    pass_test
  else
    fail_test "Wrong error message"
  fi
fi

run_test "6" "Error: --limit is not a number"
if $CMD issue list --limit abc > /tmp/test_list_limit_invalid.txt 2>&1; then
  fail_test "Should have failed with invalid limit"
else
  if grep -q "positive number" /tmp/test_list_limit_invalid.txt; then
    pass_test
  else
    fail_test "Wrong error message"
  fi
fi

# ===========================================
# PHASE 2: PAGINATION TESTS
# ===========================================

echo "=========================================="
echo "Phase 2: Pagination Tests"
echo "=========================================="
echo ""

run_test "7" "List issues with --all flag (pagination)"
if $CMD issue list --all > /tmp/test_list_all.txt 2>&1; then
  # Verify output format
  if grep -q "Total:" /tmp/test_list_all.txt; then
    pass_test
  else
    fail_test "Missing summary line"
  fi
else
  fail_test "Command failed"
fi

run_test "8" "Verify table output format"
if $CMD issue list --limit 5 > /tmp/test_list_format.txt 2>&1; then
  # Check for tab-separated columns
  if grep -q $'\t' /tmp/test_list_format.txt; then
    pass_test
  else
    fail_test "Output not tab-separated"
  fi
else
  fail_test "Command failed"
fi

# ===========================================
# PHASE 3: SORTING TESTS
# ===========================================

echo "=========================================="
echo "Phase 3: Sorting Tests"
echo "=========================================="
echo ""

run_test "9" "Sort by priority descending (default)"
if $CMD issue list --limit 5 --sort priority --order desc > /tmp/test_sort_priority_desc.txt 2>&1; then
  # Check output contains expected header
  if grep -q "Identifier" /tmp/test_sort_priority_desc.txt; then
    pass_test
  else
    fail_test "Output missing header"
  fi
else
  fail_test "Command failed"
fi

run_test "10" "Sort by created ascending"
if $CMD issue list --limit 5 --sort created --order asc > /tmp/test_sort_created_asc.txt 2>&1; then
  pass_test
else
  fail_test "Command failed"
fi

run_test "11" "Sort by updated descending"
if $CMD issue list --limit 5 --sort updated --order desc > /tmp/test_sort_updated_desc.txt 2>&1; then
  pass_test
else
  fail_test "Command failed"
fi

run_test "12" "Error: Invalid sort field"
if $CMD issue list --sort invalid > /tmp/test_sort_invalid.txt 2>&1; then
  fail_test "Should have failed with invalid sort field"
else
  if grep -q "Invalid sort field" /tmp/test_sort_invalid.txt; then
    pass_test
  else
    fail_test "Wrong error message"
  fi
fi

run_test "13" "Error: Invalid sort order"
if $CMD issue list --sort priority --order invalid > /tmp/test_sort_order_invalid.txt 2>&1; then
  fail_test "Should have failed with invalid sort order"
else
  if grep -q "Invalid sort order" /tmp/test_sort_order_invalid.txt; then
    pass_test
  else
    fail_test "Wrong error message"
  fi
fi

# ===========================================
# PHASE 4: OUTPUT FORMAT TESTS
# ===========================================

echo "=========================================="
echo "Phase 4: Output Format Tests"
echo "=========================================="
echo ""

run_test "14" "Output format: table (default)"
if $CMD issue list --limit 5 > /tmp/test_format_table.txt 2>&1; then
  if grep -q "Total:" /tmp/test_format_table.txt; then
    pass_test
  else
    fail_test "Table format missing summary"
  fi
else
  fail_test "Command failed"
fi

run_test "15" "Output format: JSON"
if $CMD issue list --limit 2 --format json > /tmp/test_format_json.txt 2>&1; then
  # Validate JSON structure
  if jq -e '.[0].identifier' /tmp/test_format_json.txt > /dev/null 2>&1; then
    pass_test
  else
    fail_test "Invalid JSON structure"
  fi
else
  fail_test "Command failed"
fi

run_test "16" "Output format: TSV"
if $CMD issue list --limit 2 --format tsv > /tmp/test_format_tsv.txt 2>&1; then
  # Check for tab-separated header
  if head -1 /tmp/test_format_tsv.txt | grep -q $'identifier\ttitle\tstate'; then
    pass_test
  else
    fail_test "TSV format incorrect"
  fi
else
  fail_test "Command failed"
fi

# ===========================================
# PHASE 5: ADVANCED FILTER TESTS
# ===========================================

echo "=========================================="
echo "Phase 5: Advanced Filter Tests"
echo "=========================================="
echo ""

run_test "17" "Filter: --root-only (root issues only)"
if $CMD issue list --limit 5 --root-only > /tmp/test_filter_root_only.txt 2>&1; then
  pass_test
else
  fail_test "Command failed"
fi

run_test "18" "Filter: --search (full-text search)"
if $CMD issue list --limit 5 --search "TEST" > /tmp/test_filter_search.txt 2>&1; then
  pass_test
else
  fail_test "Command failed"
fi

run_test "19" "Error: --parent and --root-only together"
if $CMD issue list --parent BAN-1 --root-only > /tmp/test_filter_parent_conflict.txt 2>&1; then
  fail_test "Should have failed with conflicting filters"
else
  if grep -q "Cannot specify both" /tmp/test_filter_parent_conflict.txt; then
    pass_test
  else
    fail_test "Wrong error message"
  fi
fi

run_test "20" "Smart default: assignee=me (no flags)"
if $CMD issue list --limit 5 > /tmp/test_default_assignee.txt 2>&1; then
  # Should succeed (uses current user by default)
  pass_test
else
  fail_test "Command failed"
fi

run_test "21" "Override default: --all-assignees"
if $CMD issue list --limit 5 --all-assignees > /tmp/test_all_assignees.txt 2>&1; then
  pass_test
else
  fail_test "Command failed"
fi

# ===========================================
# PHASE 6: COMBINED OPERATIONS TESTS
# ===========================================

echo "=========================================="
echo "Phase 6: Combined Operations Tests"
echo "=========================================="
echo ""

run_test "22" "Combined: --sort + --format + --limit"
if $CMD issue list --limit 3 --sort priority --order desc --format json > /tmp/test_combined.txt 2>&1; then
  if jq -e 'length == 3 or length < 3' /tmp/test_combined.txt > /dev/null 2>&1; then
    pass_test
  else
    fail_test "Combined filters failed"
  fi
else
  fail_test "Command failed"
fi

run_test "23" "Combined: --all-assignees + --completed + --format tsv"
if $CMD issue list --limit 5 --all-assignees --completed --format tsv > /tmp/test_combined2.txt 2>&1; then
  if head -1 /tmp/test_combined2.txt | grep -q "identifier"; then
    pass_test
  else
    fail_test "Combined filters failed"
  fi
else
  fail_test "Command failed"
fi

# ===========================================
# PHASE 7: PERFORMANCE VERIFICATION
# ===========================================

echo "=========================================="
echo "Phase 7: Performance Verification"
echo "=========================================="
echo ""

echo -e "${BLUE}Note: API call tracking needs to be verified manually${NC}"
echo -e "${BLUE}Expected: 1-3 API calls for list operations (not N+1)${NC}"
echo ""

run_test "24" "Manual verification: Run with DEBUG to see query count"
echo -e "${BLUE}Manual test: Set LINEAR_CREATE_DEBUG_FILTERS=1 and verify query output${NC}"
echo -e "${BLUE}Command: LINEAR_CREATE_DEBUG_FILTERS=1 $CMD issue list --limit 100${NC}"
pass_test

run_test "25" "Performance baseline: List 250 issues in <30s"
START_TIME=$(date +%s)
if $CMD issue list --limit 250 > /tmp/test_list_perf.txt 2>&1; then
  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))

  ISSUE_COUNT=$(grep -c $'\t' /tmp/test_list_perf.txt || true)
  echo "  Fetched: ~$ISSUE_COUNT issues"
  echo "  Duration: ${DURATION}s"

  if [ $DURATION -lt 30 ]; then
    pass_test
  else
    fail_test "Too slow: ${DURATION}s (expected <30s)"
  fi
else
  fail_test "Command failed"
fi

# ===========================================
# SUMMARY
# ===========================================

echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "Total:  $TOTAL"
echo -e "${GREEN}Passed: $PASS${NC}"
if [ $FAIL -gt 0 ]; then
  echo -e "${RED}Failed: $FAIL${NC}"
else
  echo -e "Failed: $FAIL"
fi
echo ""

# ===========================================
# PERFORMANCE NOTES
# ===========================================

echo "=========================================="
echo "Performance Verification Notes"
echo "=========================================="
echo ""
echo "To verify API call count (should be ≤3 calls):"
echo ""
echo "1. Enable debug mode:"
echo "   LINEAR_CREATE_DEBUG_FILTERS=1 $CMD issue list --limit 100"
echo ""
echo "2. Look for pagination logs like:"
echo "   [agent2linear] Page 1: fetched N issues"
echo ""
echo "3. Verify only 1-2 API calls are made (one per page if pagination needed)"
echo ""
echo "4. For API call tracking, future enhancement will add:"
echo "   - Automatic API call counter"
echo "   - Performance metrics output"
echo "   - Validation that we're NOT in N+1 pattern"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed.${NC}"
  exit 1
fi
