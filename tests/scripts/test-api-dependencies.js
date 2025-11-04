#!/usr/bin/env node
/**
 * M23-TS01: Test library functions with real API
 *
 * This script tests the core dependency management API functions:
 * - createProjectRelation()
 * - getProjectRelations()
 * - deleteProjectRelation()
 * - Parser functions (resolveDependencyProjects, parseAdvancedDependency, etc.)
 *
 * Requirements:
 * - LINEAR_API_KEY environment variable
 * - npm run build (to have dist/index.js)
 * - At least two existing projects in Linear
 *
 * Usage:
 *   node tests/scripts/test-api-dependencies.js <project-id-1> <project-id-2>
 *
 * Example:
 *   node tests/scripts/test-api-dependencies.js proj_abc123 proj_xyz789
 */

// Import directly from library modules since they're not exported from index
import { getLinearClient, createProjectRelation, getProjectRelations, deleteProjectRelation } from '../../src/lib/linear-client.js';
import { parseAdvancedDependency, validateAnchorType, getRelationDirection } from '../../src/lib/parsers.js';

// ANSI color codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

let passedTests = 0;
let failedTests = 0;

function log(message) {
  console.log(message);
}

function logSuccess(message) {
  console.log(`${GREEN}✓${RESET} ${message}`);
  passedTests++;
}

function logError(message) {
  console.log(`${RED}✗${RESET} ${message}`);
  failedTests++;
}

function logInfo(message) {
  console.log(`${BLUE}ℹ${RESET} ${message}`);
}

function logWarning(message) {
  console.log(`${YELLOW}⚠${RESET} ${message}`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node test-api-dependencies.js <project-id-1> <project-id-2>');
    console.error('');
    console.error('Example:');
    console.error('  node tests/scripts/test-api-dependencies.js proj_abc123 proj_xyz789');
    process.exit(1);
  }

  const [projectId1, projectId2] = args;

  log('');
  log('='.repeat(60));
  log('M23-TS01: Testing Project Dependency API Functions');
  log('='.repeat(60));
  log('');

  try {
    const client = getLinearClient();
    logSuccess('Linear client initialized');

    // Test 1: Validate anchor types
    log('');
    logInfo('Test 1: Validate anchor types');
    try {
      const anchor1 = validateAnchorType('start');
      if (anchor1 === 'start') logSuccess('validateAnchorType("start") = "start"');
      else throw new Error(`Expected "start", got "${anchor1}"`);

      const anchor2 = validateAnchorType('end');
      if (anchor2 === 'end') logSuccess('validateAnchorType("end") = "end"');
      else throw new Error(`Expected "end", got "${anchor2}"`);

      const anchor3 = validateAnchorType('  START  ');
      if (anchor3 === 'start') logSuccess('validateAnchorType("  START  ") = "start" (case insensitive, trimmed)');
      else throw new Error(`Expected "start", got "${anchor3}"`);

      try {
        validateAnchorType('middle');
        logError('validateAnchorType("middle") should throw error');
      } catch (err) {
        logSuccess('validateAnchorType("middle") throws error as expected');
      }
    } catch (error) {
      logError(`Anchor validation test failed: ${error.message}`);
    }

    // Test 2: Parse advanced dependency syntax
    log('');
    logInfo('Test 2: Parse advanced dependency syntax (using project IDs)');
    try {
      const parsed = parseAdvancedDependency(`${projectId2}:end:start`);
      if (parsed.relatedProjectId === projectId2 &&
          parsed.anchorType === 'end' &&
          parsed.relatedAnchorType === 'start') {
        logSuccess(`parseAdvancedDependency("${projectId2}:end:start") parsed correctly`);
      } else {
        throw new Error('Parsed values incorrect');
      }

      try {
        parseAdvancedDependency('invalid:syntax');
        logError('parseAdvancedDependency("invalid:syntax") should throw error');
      } catch (err) {
        logSuccess('parseAdvancedDependency("invalid:syntax") throws error as expected');
      }
    } catch (error) {
      logError(`Advanced dependency parsing test failed: ${error.message}`);
    }

    // Test 3: Create project relation (depends-on: end→start)
    log('');
    logInfo(`Test 3: Create dependency: ${projectId1} depends on ${projectId2}`);
    let relationId = null;
    try {
      const relation = await createProjectRelation(client, {
        projectId: projectId1,
        relatedProjectId: projectId2,
        anchorType: 'end',
        relatedAnchorType: 'start',
      });

      relationId = relation.id;
      logSuccess(`Created relation: ${relation.id}`);
      logInfo(`  Project: ${relation.project.name} (${relation.project.id})`);
      logInfo(`  Related: ${relation.relatedProject.name} (${relation.relatedProject.id})`);
      logInfo(`  Anchors: ${relation.anchorType} → ${relation.relatedAnchorType}`);
    } catch (error) {
      logError(`Failed to create relation: ${error.message}`);
    }

    // Test 4: Fetch project relations
    log('');
    logInfo(`Test 4: Fetch relations for project ${projectId1}`);
    try {
      const relations = await getProjectRelations(client, projectId1);
      logSuccess(`Fetched ${relations.length} relation(s)`);

      if (relations.length > 0) {
        relations.forEach((rel, idx) => {
          logInfo(`  [${idx + 1}] ${rel.project.name} → ${rel.relatedProject.name} (${rel.anchorType}→${rel.relatedAnchorType})`);
        });
      }

      // Test getRelationDirection
      if (relationId && relations.length > 0) {
        const testRelation = relations.find(r => r.id === relationId);
        if (testRelation) {
          const direction1 = getRelationDirection(testRelation, projectId1);
          const direction2 = getRelationDirection(testRelation, projectId2);

          logSuccess(`getRelationDirection from ${projectId1}: "${direction1}"`);
          logSuccess(`getRelationDirection from ${projectId2}: "${direction2}"`);

          if (direction1 === 'depends-on' && direction2 === 'blocks') {
            logSuccess('Direction calculation correct: project1 depends-on project2, project2 blocks project1');
          } else {
            logError(`Unexpected directions: ${direction1}, ${direction2}`);
          }
        }
      }
    } catch (error) {
      logError(`Failed to fetch relations: ${error.message}`);
    }

    // Test 5: Delete project relation
    if (relationId) {
      log('');
      logInfo(`Test 5: Delete relation ${relationId}`);
      try {
        const success = await deleteProjectRelation(client, relationId);
        if (success) {
          logSuccess('Relation deleted successfully');
        } else {
          logError('Failed to delete relation (success = false)');
        }

        // Verify deletion
        const relationsAfter = await getProjectRelations(client, projectId1);
        const stillExists = relationsAfter.some(r => r.id === relationId);
        if (!stillExists) {
          logSuccess('Verified: relation no longer exists');
        } else {
          logError('Relation still exists after deletion');
        }
      } catch (error) {
        logError(`Failed to delete relation: ${error.message}`);
      }
    }

    // Test 6: Create relation with different anchor types
    log('');
    logInfo('Test 6: Create relation with start→end anchors');
    let relation2Id = null;
    try {
      const relation = await createProjectRelation(client, {
        projectId: projectId1,
        relatedProjectId: projectId2,
        anchorType: 'start',
        relatedAnchorType: 'end',
      });

      relation2Id = relation.id;
      logSuccess(`Created relation with start→end: ${relation.id}`);

      // Clean up immediately
      await deleteProjectRelation(client, relation2Id);
      logSuccess('Cleaned up test relation');
    } catch (error) {
      logError(`Failed to create start→end relation: ${error.message}`);
    }

    // Summary
    log('');
    log('='.repeat(60));
    log('Test Summary');
    log('='.repeat(60));
    log(`${GREEN}Passed:${RESET} ${passedTests}`);
    log(`${RED}Failed:${RESET} ${failedTests}`);
    log('');

    if (failedTests > 0) {
      logWarning('Some tests failed. Review the output above.');
      process.exit(1);
    } else {
      logSuccess('All tests passed!');
      log('');
      logInfo('Phase 1 Core Library implementation is working correctly.');
      log('');
    }

  } catch (error) {
    logError(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main();
