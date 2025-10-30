#!/bin/bash
# M15.5 Phase 3: Advanced Features Tests for Issue List
# Tests advanced filters, sorting, and output formats
# Total: ~15 test cases

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0
TOTAL=0

# Test prefix
TIMESTAMP=$(date +%s)
TEST_PREFIX="TEST_LIST_P3_${TIMESTAMP}_"

echo "=========================================="
echo "M15.5 Phase 3: Issue List Advanced Features Tests"
echo "Test Run: $TIMESTAMP"
echo "=========================================="
echo ""

# Verify LINEAR_API_KEY is set
if [ -z "$LINEAR_API_KEY" ]; then
  echo -e "${RED}ERROR: LINEAR_API_KEY environment variable is not set${NC}"
  exit 1
fi

# Verify build exists
if [ ! -f "../../dist/index.js" ]; then
  echo -e "${RED}ERROR: Build not found. Run 'npm run build' first${NC}"
  exit 1
fi

CMD="node ../../dist/index.js"

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
# PHASE 3.1: SORTING TESTS
# ===========================================

echo "=========================================="
echo "Phase 3.1: Sorting Tests"
echo "=========================================="
echo ""

run_test "1" "Sort by priority descending (default)"
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

run_test "2" "Sort by created ascending"
if $CMD issue list --limit 5 --sort created --order asc > /tmp/test_sort_created_asc.txt 2>&1; then
  pass_test
else
  fail_test "Command failed"
fi

run_test "3" "Sort by updated descending"
if $CMD issue list --limit 5 --sort updated --order desc > /tmp/test_sort_updated_desc.txt 2>&1; then
  pass_test
else
  fail_test "Command failed"
fi

run_test "4" "Error: Invalid sort field"
if $CMD issue list --sort invalid > /tmp/test_sort_invalid.txt 2>&1; then
  fail_test "Should have failed with invalid sort field"
else
  if grep -q "Invalid sort field" /tmp/test_sort_invalid.txt; then
    pass_test
  else
    fail_test "Wrong error message"
  fi
fi

run_test "5" "Error: Invalid sort order"
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
# PHASE 3.2: OUTPUT FORMAT TESTS
# ===========================================

echo "=========================================="
echo "Phase 3.2: Output Format Tests"
echo "=========================================="
echo ""

run_test "6" "Output format: table (default)"
if $CMD issue list --limit 5 > /tmp/test_format_table.txt 2>&1; then
  if grep -q "Total:" /tmp/test_format_table.txt; then
    pass_test
  else
    fail_test "Table format missing summary"
  fi
else
  fail_test "Command failed"
fi

run_test "7" "Output format: JSON"
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

run_test "8" "Output format: TSV"
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
# PHASE 3.3: ADVANCED FILTER TESTS
# ===========================================

echo "=========================================="
echo "Phase 3.3: Advanced Filter Tests"
echo "=========================================="
echo ""

run_test "9" "Filter: --root-only (root issues only)"
if $CMD issue list --limit 5 --root-only > /tmp/test_filter_root_only.txt 2>&1; then
  pass_test
else
  fail_test "Command failed"
fi

run_test "10" "Filter: --search (full-text search)"
if $CMD issue list --limit 5 --search "TEST" > /tmp/test_filter_search.txt 2>&1; then
  pass_test
else
  fail_test "Command failed"
fi

run_test "11" "Error: --parent and --root-only together"
if $CMD issue list --parent BAN-1 --root-only > /tmp/test_filter_parent_conflict.txt 2>&1; then
  fail_test "Should have failed with conflicting filters"
else
  if grep -q "Cannot specify both" /tmp/test_filter_parent_conflict.txt; then
    pass_test
  else
    fail_test "Wrong error message"
  fi
fi

# ===========================================
# PHASE 3.4: SMART DEFAULTS TESTS
# ===========================================

echo "=========================================="
echo "Phase 3.4: Smart Defaults Tests"
echo "=========================================="
echo ""

run_test "12" "Smart default: assignee=me (no flags)"
if $CMD issue list --limit 5 > /tmp/test_default_assignee.txt 2>&1; then
  # Should succeed (uses current user by default)
  pass_test
else
  fail_test "Command failed"
fi

run_test "13" "Override default: --all-assignees"
if $CMD issue list --limit 5 --all-assignees > /tmp/test_all_assignees.txt 2>&1; then
  pass_test
else
  fail_test "Command failed"
fi

# ===========================================
# PHASE 3.5: COMBINED FILTERS
# ===========================================

echo "=========================================="
echo "Phase 3.5: Combined Filter Tests"
echo "=========================================="
echo ""

run_test "14" "Combined: --sort + --format + --limit"
if $CMD issue list --limit 3 --sort priority --order desc --format json > /tmp/test_combined.txt 2>&1; then
  if jq -e 'length == 3 or length < 3' /tmp/test_combined.txt > /dev/null 2>&1; then
    pass_test
  else
    fail_test "Combined filters failed"
  fi
else
  fail_test "Command failed"
fi

run_test "15" "Combined: --all-assignees + --completed + --format tsv"
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

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}All Phase 3 tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed.${NC}"
  exit 1
fi
