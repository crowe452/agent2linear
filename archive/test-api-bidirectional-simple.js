#!/usr/bin/env node
/**
 * Test: Linear API Bi-directional Relation Behavior
 * Purpose: Verify if creating "A blocks B" automatically creates "B blockedBy A"
 *
 * This answers the CRITICAL question from DEPENDENCIES.md lines 22-26.
 */

import { LinearClient } from '@linear/sdk';

async function testBidirectionalBehavior() {
    console.log('='.repeat(70));
    console.log('Linear API Bi-directional Relation Behavior Test');
    console.log('='.repeat(70));
    console.log('');

    if (!process.env.LINEAR_API_KEY) {
        console.error('❌ ERROR: LINEAR_API_KEY environment variable not set');
        process.exit(1);
    }

    const client = new LinearClient({ apiKey: process.env.LINEAR_API_KEY });
    const timestamp = Date.now();

    let projectA, projectB, relation;

    try {
        // Step 1: Get first available team
        console.log('Step 1: Getting first available team...');
        const teams = await client.teams();
        const team = teams.nodes[0];

        if (!team) {
            console.error('❌ ERROR: No teams found');
            process.exit(1);
        }

        console.log(`✓ Using team: ${team.name} (${team.id})`);
        console.log('');

        // Step 2: Create Project A
        console.log('Step 2: Creating Project A...');
        const resultA = await client.createProject({
            name: `TEST_API_BIDIR_${timestamp}_A`,
            teamIds: [team.id]
        });
        projectA = await resultA.project;
        console.log(`✓ Project A created: ${projectA.name} (${projectA.id})`);
        console.log('');

        // Step 3: Create Project B
        console.log('Step 3: Creating Project B...');
        const resultB = await client.createProject({
            name: `TEST_API_BIDIR_${timestamp}_B`,
            teamIds: [team.id]
        });
        projectB = await resultB.project;
        console.log(`✓ Project B created: ${projectB.name} (${projectB.id})`);
        console.log('');

        // Step 4: Create "A blocks B" relation
        console.log('Step 4: Creating relation with type "dependency"...');
        console.log(`  Source: ${projectA.id} (A)`);
        console.log(`  Target: ${projectB.id} (B)`);
        console.log(`  Type: "dependency" (API only accepts this value)`);

        // Note: anchorType must be 'start', 'end', or 'milestone' (not 'project')
        // For project-level dependencies (not milestone-specific), omit milestone IDs
        const relationResult = await client.createProjectRelation({
            type: 'dependency',
            projectId: projectA.id,
            relatedProjectId: projectB.id,
            anchorType: 'end',        // Could be 'start' or 'end' for project-level
            relatedAnchorType: 'start'  // Meaning: A's end depends on B's start
        });

        relation = await relationResult.projectRelation;
        console.log(`✓ Relation created: ${relation.id}`);
        console.log('');

        // Step 5: Query Project A's relations
        console.log('Step 5: Querying Project A relations...');
        const projectAFresh = await client.project(projectA.id);
        const relationsA = await projectAFresh?.relations();

        console.log(`Project A has ${relationsA?.nodes?.length || 0} relation(s):`);
        if (relationsA?.nodes) {
            for (const rel of relationsA.nodes) {
                const relProj = await rel.relatedProject;
                console.log(`  • type="${rel.type}" anchorType="${rel.anchorType}" → ${relProj?.name} (${relProj?.id})`);
            }
        }
        console.log('');

        // Step 6: Query Project B's relations
        console.log('Step 6: Querying Project B relations...');
        const projectBFresh = await client.project(projectB.id);
        const relationsB = await projectBFresh?.relations();

        console.log(`Project B has ${relationsB?.nodes?.length || 0} relation(s):`);
        if (relationsB?.nodes) {
            for (const rel of relationsB.nodes) {
                const relProj = await rel.project;
                console.log(`  • type="${rel.type}" anchorType="${rel.anchorType}" ← ${relProj?.name} (${relProj?.id})`);
            }
        }
        console.log('');

        // Step 7: Analysis
        console.log('='.repeat(70));
        console.log('ANALYSIS');
        console.log('='.repeat(70));
        console.log('');

        if (relationsB.nodes.length === 0) {
            console.log('❌ NO AUTOMATIC INVERSE RELATION');
            console.log('');
            console.log('Result: Creating "A blocks B" did NOT automatically create "B blockedBy A"');
            console.log('');
            console.log('Implementation Impact:');
            console.log('  • Each direction requires a separate ProjectRelation entry');
            console.log('  • When user specifies --blocking B, create type="blocks"');
            console.log('  • When user specifies --blocked-by A, create type="blockedBy"');
            console.log('  • No risk of duplicate automatic relations');
            console.log('');
        } else {
            const hasBlockedBy = relationsB.nodes.some(r => r.type === 'blockedBy');
            const hasBlocks = relationsB.nodes.some(r => r.type === 'blocks');

            if (hasBlockedBy) {
                console.log('✓ AUTOMATIC INVERSE RELATION DETECTED');
                console.log('');
                console.log('Result: Creating "A blocks B" automatically created "B blockedBy A"');
                console.log('');
                console.log('Implementation Impact:');
                console.log('  • Bi-directional relations are automatic');
                console.log('  • Creating --blocking also creates inverse --blocked-by');
                console.log('  • Must avoid duplicate relation creation');
                console.log('  • Only create one direction, Linear handles the inverse');
                console.log('');
            } else if (hasBlocks) {
                console.log('⚠️  UNEXPECTED: Project B has "blocks" relation (not "blockedBy")');
                console.log('');
                console.log('This is unexpected and needs further investigation.');
                console.log('');
            } else {
                console.log('⚠️  UNEXPECTED: Project B has relations but neither "blocks" nor "blockedBy"');
                console.log('');
                console.log('Relation types found:', relationsB.nodes.map(r => r.type).join(', '));
                console.log('');
            }
        }

        console.log('='.repeat(70));
        console.log('');

        // Cleanup info
        console.log('Test Projects Created:');
        console.log(`  • ${projectA.name} (${projectA.id})`);
        console.log(`  • ${projectB.name} (${projectB.id})`);
        console.log('');
        console.log('⚠️  MANUAL CLEANUP: Delete these projects from Linear UI');
        console.log('');

    } catch (error) {
        console.error('');
        console.error('❌ Test failed with error:');
        console.error(error.message);
        if (error.errors) {
            console.error('GraphQL errors:', error.errors);
        }
        process.exit(1);
    }
}

// Run the test
testBidirectionalBehavior()
    .then(() => {
        console.log('Test completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
