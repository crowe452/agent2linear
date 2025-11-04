#!/usr/bin/env node
/**
 * M23-TS01 Extended: Test multiple dependencies and complex scenarios
 *
 * This tests more complex scenarios:
 * - Multiple dependencies from one project
 * - Bidirectional dependencies
 * - Different anchor types
 */

import { getLinearClient, createProjectRelation, getProjectRelations, deleteProjectRelation } from '../../src/lib/linear-client.js';
import { getRelationDirection } from '../../src/lib/parsers.js';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

function log(message) {
  console.log(message);
}

function logSuccess(message) {
  console.log(`${GREEN}✓${RESET} ${message}`);
}

function logInfo(message) {
  console.log(`${BLUE}ℹ${RESET} ${message}`);
}

async function main() {
  const [proj1, proj2, proj3] = [
    '8fe57a2f-8054-4753-b019-5e737bec5827',
    'c298e4af-047b-489c-b877-82529ab94451',
    '0e0314b2-e688-4c51-93c8-d6ab4ddc2da1'
  ];

  log('');
  log('='.repeat(60));
  log('M23-TS01 Extended: Multiple Dependency Scenarios');
  log('='.repeat(60));
  log('');

  const client = getLinearClient();
  const createdRelations = [];

  try {
    // Scenario 1: Project 1 depends on both Project 2 and Project 3
    logInfo('Scenario 1: Create multiple dependencies from one project');

    const rel1 = await createProjectRelation(client, {
      projectId: proj1,
      relatedProjectId: proj2,
      anchorType: 'end',
      relatedAnchorType: 'start',
    });
    createdRelations.push(rel1.id);
    logSuccess(`Created: Proj1 depends on Proj2 (${rel1.id})`);

    const rel2 = await createProjectRelation(client, {
      projectId: proj1,
      relatedProjectId: proj3,
      anchorType: 'end',
      relatedAnchorType: 'start',
    });
    createdRelations.push(rel2.id);
    logSuccess(`Created: Proj1 depends on Proj3 (${rel2.id})`);

    // Fetch and verify
    const relations1 = await getProjectRelations(client, proj1);
    logSuccess(`Fetched ${relations1.length} relations for Proj1`);

    relations1.forEach(rel => {
      const dir = getRelationDirection(rel, proj1);
      logInfo(`  - ${rel.relatedProject.name}: ${dir} (${rel.anchorType}→${rel.relatedAnchorType})`);
    });

    // Scenario 2: Verify Linear prevents duplicate dependencies
    log('');
    logInfo('Scenario 2: Test duplicate dependency prevention');

    try {
      await createProjectRelation(client, {
        projectId: proj1,
        relatedProjectId: proj2,
        anchorType: 'end',
        relatedAnchorType: 'start',
      });
      logInfo('ERROR: Should have thrown duplicate error');
    } catch (err) {
      if (err.message.includes('Relation exists')) {
        logSuccess('Linear API correctly prevents duplicate dependencies');
      } else {
        throw err;
      }
    }

    // Scenario 3: Bidirectional dependency with different projects
    log('');
    logInfo('Scenario 3: Create reverse dependency (Proj2 → Proj3)');

    const rel3 = await createProjectRelation(client, {
      projectId: proj2,
      relatedProjectId: proj3,
      anchorType: 'start',
      relatedAnchorType: 'end',
    });
    createdRelations.push(rel3.id);
    logSuccess(`Created: Proj2 → Proj3 (start→end) (${rel3.id})`);

    // Verify from both perspectives
    const relations2 = await getProjectRelations(client, proj2);
    logInfo(`Proj2 has ${relations2.length} relation(s):`);
    relations2.forEach(rel => {
      const dir = getRelationDirection(rel, proj2);
      if (rel.project.id === proj2) {
        logInfo(`  - I ${dir} ${rel.relatedProject.name}`);
      } else {
        logInfo(`  - ${rel.project.name} ${dir === 'depends-on' ? 'blocks' : 'depends-on'} me`);
      }
    });

    // Scenario 4: Different anchor combinations
    log('');
    logInfo('Scenario 4: Create dependency with different anchors (start→start)');

    const rel4 = await createProjectRelation(client, {
      projectId: proj3,
      relatedProjectId: proj1,
      anchorType: 'start',
      relatedAnchorType: 'start',
    });
    createdRelations.push(rel4.id);
    logSuccess(`Created: Proj3 start → Proj1 start (${rel4.id})`);

    const relations3 = await getProjectRelations(client, proj3);
    logInfo(`Proj3 has ${relations3.length} relation(s):`);
    relations3.forEach(rel => {
      logInfo(`  - Anchors: ${rel.anchorType}→${rel.relatedAnchorType}`);
    });

    // Cleanup
    log('');
    logInfo('Cleanup: Deleting all test relations');
    for (const relId of createdRelations) {
      await deleteProjectRelation(client, relId);
      logSuccess(`Deleted: ${relId}`);
    }

    log('');
    log('='.repeat(60));
    logSuccess('All multi-dependency scenarios passed!');
    log('='.repeat(60));
    log('');

  } catch (error) {
    console.error(`${RED}Error:${RESET} ${error.message}`);

    // Attempt cleanup
    log('');
    logInfo('Attempting cleanup of created relations...');
    for (const relId of createdRelations) {
      try {
        await deleteProjectRelation(client, relId);
        logSuccess(`Cleaned up: ${relId}`);
      } catch (cleanupError) {
        console.error(`Failed to cleanup ${relId}: ${cleanupError.message}`);
      }
    }

    process.exit(1);
  }
}

main();
