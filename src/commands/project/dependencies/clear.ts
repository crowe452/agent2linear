/**
 * M23: Project Dependency Management - Clear Command
 *
 * Remove all dependency relations from a project with confirmation
 */

import { resolveProject } from '../../../lib/project-resolver.js';
import { getLinearClient, getProjectRelations, deleteProjectRelation } from '../../../lib/linear-client.js';
import { getRelationDirection } from '../../../lib/parsers.js';
import { showError, showSuccess } from '../../../lib/output.js';
import * as readline from 'readline';

interface ClearDependenciesOptions {
  direction?: 'depends-on' | 'blocks';
  yes?: boolean;
}

async function promptConfirmation(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

export async function clearProjectDependencies(
  nameOrId: string,
  options: ClearDependenciesOptions = {}
) {
  try {
    // Resolve project
    console.log(`\n🔍 Resolving project "${nameOrId}"...\n`);
    const resolved = await resolveProject(nameOrId);

    if (!resolved) {
      showError('Project not found', `Could not find project: ${nameOrId}`);
      process.exit(1);
    }

    const projectId = resolved.projectId;
    const projectName = resolved.project?.name || nameOrId;
    const client = getLinearClient();

    // Fetch existing relations
    console.log('🔍 Fetching existing dependencies...\n');
    const existingRelations = await getProjectRelations(client, projectId);

    if (existingRelations.length === 0) {
      console.log('ℹ️  No dependencies found for this project\n');
      process.exit(0);
    }

    // Filter by direction if specified
    let relationsToDelete = existingRelations;
    if (options.direction) {
      relationsToDelete = existingRelations.filter(rel =>
        getRelationDirection(rel, projectId) === options.direction
      );

      if (relationsToDelete.length === 0) {
        console.log(`ℹ️  No "${options.direction}" dependencies found for this project\n`);
        process.exit(0);
      }
    }

    // Show what will be deleted
    const directionLabel = options.direction ? ` (${options.direction} only)` : '';
    console.log(`📋 Project: ${projectName} (${projectId})`);
    console.log(`🗑️  Will delete ${relationsToDelete.length} dependenc${relationsToDelete.length === 1 ? 'y' : 'ies'}${directionLabel}:\n`);

    // Group by direction for display
    const dependsOn = relationsToDelete.filter(rel => getRelationDirection(rel, projectId) === 'depends-on');
    const blocks = relationsToDelete.filter(rel => getRelationDirection(rel, projectId) === 'blocks');

    if (dependsOn.length > 0) {
      console.log(`   ⬅️  Depends On (${dependsOn.length}):`);
      for (const rel of dependsOn) {
        const targetProject = rel.project.id === projectId ? rel.relatedProject : rel.project;
        console.log(`      • ${targetProject.name} (${targetProject.id})`);
      }
    }

    if (blocks.length > 0) {
      console.log(`   ➡️  Blocks (${blocks.length}):`);
      for (const rel of blocks) {
        const targetProject = rel.project.id === projectId ? rel.relatedProject : rel.project;
        console.log(`      • ${targetProject.name} (${targetProject.id})`);
      }
    }

    console.log('');

    // Confirmation prompt
    if (!options.yes) {
      const confirmed = await promptConfirmation(
        `⚠️  This will permanently delete ${relationsToDelete.length} dependenc${relationsToDelete.length === 1 ? 'y' : 'ies'}. Continue?`
      );

      if (!confirmed) {
        console.log('❌ Operation cancelled\n');
        process.exit(0);
      }
    }

    // Delete relations
    console.log(`\n🗑️  Clearing dependencies...\n`);

    let successCount = 0;
    let failCount = 0;

    for (const relation of relationsToDelete) {
      try {
        await deleteProjectRelation(client, relation.id);
        const targetProject = relation.project.id === projectId ? relation.relatedProject : relation.project;
        const direction = getRelationDirection(relation, projectId);
        const directionSymbol = direction === 'depends-on' ? '⬅️' : '➡️';
        console.log(`   ✓ Removed ${directionSymbol} ${direction}: ${targetProject.name}`);
        successCount++;
      } catch (error) {
        console.error(`   ✗ Failed to remove ${relation.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failCount++;
      }
    }

    // Summary
    console.log('');
    if (successCount > 0) {
      showSuccess(
        `Cleared ${successCount} dependenc${successCount === 1 ? 'y' : 'ies'}`,
        failCount > 0 ? { 'Failed': failCount.toString() } : undefined
      );
    } else {
      showError('Failed to clear dependencies', `${failCount} failed`);
      process.exit(1);
    }

  } catch (error) {
    showError('Error', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}
