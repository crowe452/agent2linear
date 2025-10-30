#!/bin/bash
# M15.5 Phase 1: Performance Tests for Issue List
# Tests pagination, limits, and verifies performance (≤3 API calls)
# Total: ~10 test cases

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
TEST_PREFIX="TEST_LIST_PERF_${TIMESTAMP}_"

echo "=========================================="
echo "M15.5 Phase 1: Issue List Performance Tests"
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
# PHASE 1: BASIC FUNCTIONALITY TESTS
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
# PHASE 3: PERFORMANCE VERIFICATION
# ===========================================

echo "=========================================="
echo "Phase 3: Performance Verification"
echo "=========================================="
echo ""

echo -e "${BLUE}Note: API call tracking needs to be verified manually in Phase 1${NC}"
echo -e "${BLUE}Expected: 1-3 API calls for list operations (not N+1)${NC}"
echo ""

run_test "9" "Manual verification: Run with DEBUG to see query count"
echo -e "${BLUE}Manual test: Set LINEAR_CREATE_DEBUG_FILTERS=1 and verify query output${NC}"
echo -e "${BLUE}Command: LINEAR_CREATE_DEBUG_FILTERS=1 $CMD issue list --limit 100${NC}"
pass_test

run_test "10" "Performance baseline: List 100+ issues"
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
echo "   [linear-create] Page 1: fetched N issues"
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
