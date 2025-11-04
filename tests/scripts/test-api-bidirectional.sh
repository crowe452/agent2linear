#!/usr/bin/env bash
###############################################################################
# Test: Linear API Bi-directional Relation Behavior
# Purpose: Verify if creating "A blocks B" automatically creates "B blockedBy A"
###############################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI="${SCRIPT_DIR}/../../dist/index.js"
TIMESTAMP=$(date +%s)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test result storage
PROJECT_A_ID=""
PROJECT_B_ID=""
RELATION_ID=""

###############################################################################
# Helper Functions
###############################################################################

log_test() {
    echo -e "${BLUE}[TEST $1]${NC} $2"
}

log_pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((PASSED_TESTS++))
}

log_fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    ((FAILED_TESTS++))
}

log_info() {
    echo -e "${YELLOW}ℹ INFO${NC}: $1"
}

###############################################################################
# Test Setup
###############################################################################

echo "======================================================================="
echo "Linear API Bi-directional Relation Behavior Test"
echo "======================================================================="
echo ""

# Get first available team
log_info "Fetching available teams..."
TEAM_ID=$(node "$CLI" teams list --json 2>/dev/null | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$TEAM_ID" ]; then
    echo -e "${RED}ERROR: No teams found. Cannot proceed with test.${NC}"
    exit 1
fi

log_info "Using team ID: $TEAM_ID"
echo ""

###############################################################################
# Test 1: Create Project A
###############################################################################

((TOTAL_TESTS++))
log_test $TOTAL_TESTS "Create Project A"

PROJECT_A_NAME="TEST_API_${TIMESTAMP}_PROJECT_A"
OUTPUT=$(node "$CLI" project create \
    --title "$PROJECT_A_NAME" \
    --team "$TEAM_ID" \
    --json 2>&1) || {
    log_fail "Failed to create Project A"
    echo "$OUTPUT"
    exit 1
}

PROJECT_A_ID=$(echo "$OUTPUT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$PROJECT_A_ID" ]; then
    log_pass "Project A created: $PROJECT_A_ID"
else
    log_fail "Could not extract Project A ID"
    echo "$OUTPUT"
    exit 1
fi

echo ""

###############################################################################
# Test 2: Create Project B
###############################################################################

((TOTAL_TESTS++))
log_test $TOTAL_TESTS "Create Project B"

PROJECT_B_NAME="TEST_API_${TIMESTAMP}_PROJECT_B"
OUTPUT=$(node "$CLI" project create \
    --title "$PROJECT_B_NAME" \
    --team "$TEAM_ID" \
    --json 2>&1) || {
    log_fail "Failed to create Project B"
    echo "$OUTPUT"
    exit 1
}

PROJECT_B_ID=$(echo "$OUTPUT" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$PROJECT_B_ID" ]; then
    log_pass "Project B created: $PROJECT_B_ID"
else
    log_fail "Could not extract Project B ID"
    echo "$OUTPUT"
    exit 1
fi

echo ""

###############################################################################
# Test 3: Create "A blocks B" relation via GraphQL API directly
###############################################################################

((TOTAL_TESTS++))
log_test $TOTAL_TESTS "Create 'A blocks B' relation via GraphQL"

log_info "This test requires direct GraphQL access. Creating test script..."

# Create a Node.js script to test GraphQL directly
cat > /tmp/test-relation-$TIMESTAMP.js << 'EOF'
const { LinearClient } = require('@linear/sdk');

async function testRelation() {
    const client = new LinearClient({ apiKey: process.env.LINEAR_API_KEY });

    const projectAId = process.argv[2];
    const projectBId = process.argv[3];

    console.log('Creating relation: A blocks B');
    console.log('Project A:', projectAId);
    console.log('Project B:', projectBId);
    console.log('');

    try {
        // Create "A blocks B" relation
        const result = await client.createProjectRelation({
            type: 'blocks',
            projectId: projectAId,
            relatedProjectId: projectBId,
            anchorType: 'project',
            relatedAnchorType: 'project'
        });

        const relation = await result.projectRelation;
        console.log('✓ Relation created successfully');
        console.log('Relation ID:', relation.id);
        console.log('Type:', relation.type);
        console.log('');

        // Now query Project A's relations
        console.log('Querying Project A relations...');
        const projectA = await client.project(projectAId);
        const relationsA = await projectA.projectRelations();

        console.log('Project A has', relationsA.nodes.length, 'relation(s):');
        for (const rel of relationsA.nodes) {
            const relatedProj = await rel.relatedProject;
            console.log('  -', rel.type, '→', relatedProj?.name, '(' + relatedProj?.id + ')');
        }
        console.log('');

        // Now query Project B's relations
        console.log('Querying Project B relations...');
        const projectB = await client.project(projectBId);
        const relationsB = await projectB.projectRelations();

        console.log('Project B has', relationsB.nodes.length, 'relation(s):');
        for (const rel of relationsB.nodes) {
            const relatedProj = await rel.relatedProject;
            console.log('  -', rel.type, '→', relatedProj?.name, '(' + relatedProj?.id + ')');
        }
        console.log('');

        // Analysis
        console.log('=== ANALYSIS ===');
        if (relationsB.nodes.length === 0) {
            console.log('❌ NO AUTOMATIC INVERSE RELATION');
            console.log('Creating "A blocks B" did NOT automatically create "B blockedBy A"');
            console.log('Implementation must handle both directions explicitly.');
        } else {
            const hasBlockedBy = relationsB.nodes.some(r => r.type === 'blockedBy');
            if (hasBlockedBy) {
                console.log('✓ AUTOMATIC INVERSE RELATION DETECTED');
                console.log('Creating "A blocks B" automatically created "B blockedBy A"');
                console.log('Implementation should avoid creating duplicate inverse relations.');
            } else {
                console.log('⚠ UNEXPECTED: Project B has relations but not "blockedBy"');
            }
        }

        return relation.id;

    } catch (error) {
        console.error('✗ Error:', error.message);
        throw error;
    }
}

testRelation()
    .then(relationId => {
        console.log('\nRelation ID for cleanup:', relationId);
        process.exit(0);
    })
    .catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    });
EOF

# Run the Node.js test
node /tmp/test-relation-$TIMESTAMP.js "$PROJECT_A_ID" "$PROJECT_B_ID" 2>&1 | tee /tmp/api-test-output-$TIMESTAMP.txt

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    log_pass "API test completed successfully"
else
    log_fail "API test failed"
fi

echo ""

###############################################################################
# Cleanup Information
###############################################################################

echo "======================================================================="
echo "Test Summary"
echo "======================================================================="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"
echo ""
echo "Test Projects Created:"
echo "  Project A: $PROJECT_A_NAME ($PROJECT_A_ID)"
echo "  Project B: $PROJECT_B_NAME ($PROJECT_B_ID)"
echo ""
echo "⚠ MANUAL CLEANUP REQUIRED:"
echo "Delete these projects manually from Linear UI:"
echo "  - $PROJECT_A_NAME"
echo "  - $PROJECT_B_NAME"
echo ""
echo "Or wait for 'project delete' command implementation."
echo "======================================================================="

# Cleanup temp files
rm -f /tmp/test-relation-$TIMESTAMP.js

exit 0
