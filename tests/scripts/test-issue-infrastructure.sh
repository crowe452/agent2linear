#!/bin/bash
# M15.1 Infrastructure Tests
# Tests for issue types, resolver, config, enhanced resolvers, API functions, and error handling
# Total: ~25 test cases

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0
TOTAL=0

# Test prefix for created entities
TIMESTAMP=$(date +%s)
TEST_PREFIX="TEST_INFRA_${TIMESTAMP}_"

# Store created issue IDs for cleanup
CREATED_ISSUES=()

echo "=========================================="
echo "M15.1 Infrastructure Tests"
echo "Test Run: $TIMESTAMP"
echo "=========================================="
echo ""

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
# PHASE 1: TYPE DEFINITIONS
# ===========================================

echo "=========================================="
echo "Phase 1: Type Definitions"
echo "=========================================="
echo ""

run_test "1" "Verify TypeScript compilation with new issue types"
if npm run typecheck > /dev/null 2>&1; then
  pass_test
else
  fail_test "TypeScript compilation failed"
fi

# ===========================================
# PHASE 2: ISSUE RESOLVER
# ===========================================

echo "=========================================="
echo "Phase 2: Issue Resolver"
echo "=========================================="
echo ""

# These tests will be implemented after issue resolver is created
run_test "2" "Resolve issue by UUID format (placeholder)"
echo "⏸ Skipped: Issue resolver not yet implemented"
echo ""

run_test "3" "Resolve issue by identifier (ENG-123 format) (placeholder)"
echo "⏸ Skipped: Issue resolver not yet implemented"
echo ""

run_test "4" "Test case insensitivity (eng-123 vs ENG-123) (placeholder)"
echo "⏸ Skipped: Issue resolver not yet implemented"
echo ""

run_test "5" "Test invalid identifier format (placeholder)"
echo "⏸ Skipped: Issue resolver not yet implemented"
echo ""

run_test "6" "Test malformed identifier error (placeholder)"
echo "⏸ Skipped: Issue resolver not yet implemented"
echo ""

# ===========================================
# PHASE 3: CONFIG SYSTEM
# ===========================================

echo "=========================================="
echo "Phase 3: Config System"
echo "=========================================="
echo ""

# These tests will be implemented after config updates
run_test "7" "Set defaultProject config (placeholder)"
echo "⏸ Skipped: Config updates not yet implemented"
echo ""

run_test "8" "Get defaultProject config (placeholder)"
echo "⏸ Skipped: Config updates not yet implemented"
echo ""

run_test "9" "Verify defaultTeam config exists (placeholder)"
echo "⏸ Skipped: Config updates not yet implemented"
echo ""

# ===========================================
# PHASE 4: ENHANCED RESOLVERS
# ===========================================

echo "=========================================="
echo "Phase 4: Enhanced Resolvers"
echo "=========================================="
echo ""

run_test "10" "Resolve member by email (placeholder)"
echo "⏸ Skipped: Member email resolver not yet implemented"
echo ""

run_test "11" "Resolve member by display name (placeholder)"
echo "⏸ Skipped: Member display name resolver not yet implemented"
echo ""

run_test "12" "Member display name disambiguation (placeholder)"
echo "⏸ Skipped: Member disambiguation not yet implemented"
echo ""

run_test "13" "Project resolution by exact name (placeholder)"
echo "⏸ Skipped: Project name resolver not yet implemented"
echo ""

run_test "14" "Project resolution by partial name (placeholder)"
echo "⏸ Skipped: Project name resolver not yet implemented"
echo ""

run_test "15" "Ambiguous project name error (placeholder)"
echo "⏸ Skipped: Project name disambiguation not yet implemented"
echo ""

run_test "16" "Cycle resolution by UUID (placeholder)"
echo "⏸ Skipped: Cycle resolver not yet implemented"
echo ""

run_test "17" "Cycle resolution by alias (placeholder)"
echo "⏸ Skipped: Cycle aliases not yet implemented"
echo ""

# ===========================================
# PHASE 5: LINEAR CLIENT FUNCTIONS
# ===========================================

echo "=========================================="
echo "Phase 5: Linear Client Functions"
echo "=========================================="
echo ""

run_test "18" "Create issue with minimal input (placeholder)"
echo "⏸ Skipped: createIssue API function not yet implemented"
echo ""

run_test "19" "Get issue by ID (placeholder)"
echo "⏸ Skipped: getIssueById API function not yet implemented"
echo ""

run_test "20" "Get issue by identifier (placeholder)"
echo "⏸ Skipped: getIssueByIdentifier API function not yet implemented"
echo ""

run_test "21" "List issues with basic filters (placeholder)"
echo "⏸ Skipped: getAllIssues API function not yet implemented"
echo ""

run_test "22" "Get current user issues (placeholder)"
echo "⏸ Skipped: getCurrentUserIssues API function not yet implemented"
echo ""

# ===========================================
# PHASE 6: VALIDATORS & ERROR HANDLING
# ===========================================

echo "=========================================="
echo "Phase 6: Validators & Error Handling"
echo "=========================================="
echo ""

run_test "23" "Test issue validators (placeholder)"
echo "⏸ Skipped: Issue validators not yet implemented"
echo ""

run_test "24" "Test GraphQL error handler (placeholder)"
echo "⏸ Skipped: Error handler not yet implemented"
echo ""

run_test "25" "Test alias error messages with suggestions (placeholder)"
echo "⏸ Skipped: Enhanced alias errors not yet implemented"
echo ""

# ===========================================
# SUMMARY
# ===========================================

echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "Total Tests: $TOTAL"
echo -e "Passed: ${GREEN}$PASS${NC}"
echo -e "Failed: ${RED}$FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
else
  echo -e "${RED}❌ Some tests failed!${NC}"
  exit 1
fi

# ===========================================
# CLEANUP SCRIPT GENERATION
# ===========================================

if [ ${#CREATED_ISSUES[@]} -gt 0 ]; then
  echo ""
  echo "=========================================="
  echo "Generating cleanup script..."
  echo "=========================================="

  cat > cleanup-infrastructure-test.sh <<EOF
#!/bin/bash
# Cleanup script for M15.1 infrastructure tests
# Generated: $(date)

echo "The following test issues were created:"
echo ""

EOF

  for issue_id in "${CREATED_ISSUES[@]}"; do
    echo "echo \"  - Issue ID: $issue_id\"" >> cleanup-infrastructure-test.sh
  done

  cat >> cleanup-infrastructure-test.sh <<EOF

echo ""
echo "Please delete these issues manually via Linear UI or wait for 'issue delete' command."
echo "Issue identifiers will be displayed after they are created."
EOF

  chmod +x cleanup-infrastructure-test.sh

  echo ""
  echo "✅ Cleanup script generated: cleanup-infrastructure-test.sh"
fi

echo ""
echo "=========================================="
echo "M15.1 Infrastructure Tests Complete"
echo "=========================================="
