#!/bin/bash
# Live M22.1 validation tests with LINEAR_API_KEY
# Tests the validation warnings and info messages in real commands

set -e

CLI="node dist/index.js"
TEAM="2df5f813-6fa7-44ba-a828-04b04a92efd3"  # Test team from the integration tests
PREFIX="M22_1_VAL_$(date +%Y%m%d_%H%M%S)"

echo "=================================================="
echo "M22.1 Live Validation Tests"
echo "=================================================="
echo ""

echo "Test 1: Auto-detection only (recommended approach)"
echo "Command: proj create --start-date '2025-Q1'"
echo "Expected: No warning, auto-detects resolution: quarter"
echo ""
$CLI proj create --title "${PREFIX}_AutoDetect_Q1" --team $TEAM --start-date "2025-Q1"
echo ""

echo "=================================================="
echo "Test 2: ISO date + explicit resolution (legitimate use case)"
echo "Command: proj create --start-date '2025-01-15' --start-date-resolution quarter"
echo "Expected: Info message 'Using explicit resolution: quarter'"
echo ""
$CLI proj create --title "${PREFIX}_ISO_Explicit_Quarter" --team $TEAM --start-date "2025-01-15" --start-date-resolution quarter
echo ""

echo "=================================================="
echo "Test 3: Conflicting format + flag"
echo "Command: proj create --start-date '2025-Q1' --start-date-resolution month"
echo "Expected: Warning about conflict"
echo ""
$CLI proj create --title "${PREFIX}_Conflict_Q1_Month" --team $TEAM --start-date "2025-Q1" --start-date-resolution month
echo ""

echo "=================================================="
echo "Test 4: Redundant but matching (no warning expected)"
echo "Command: proj create --start-date '2025-Q1' --start-date-resolution quarter"
echo "Expected: No warning (redundant but harmless)"
echo ""
$CLI proj create --title "${PREFIX}_Redundant_Q1_Quarter" --team $TEAM --start-date "2025-Q1" --start-date-resolution quarter
echo ""

echo "=================================================="
echo "All M22.1 validation tests completed!"
echo "=================================================="
