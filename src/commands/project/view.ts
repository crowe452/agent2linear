import { getProjectDetails } from '../../lib/linear-client.js';
import { resolveProject } from '../../lib/project-resolver.js';
import { showResolvedAlias, showEntityNotFound } from '../../lib/output.js';
import { openInBrowser } from '../../lib/browser.js';

export async function viewProject(nameOrId: string, options: { web?: boolean; autoAlias?: boolean } = {}) {
  // Use smart resolver to handle ID, alias, or name
  console.log(`\n🔍 Resolving project "${nameOrId}"...\n`);

  const resolved = await resolveProject(nameOrId, {
    autoAlias: options.autoAlias,
  });

  if (!resolved) {
    showEntityNotFound('project', nameOrId);
    console.error('   Tip: Use exact project name, project ID, or create an alias');
    process.exit(1);
  }

  const resolvedId = resolved.projectId;

  // Show how the project was resolved
  if (resolved.resolvedBy === 'alias') {
    showResolvedAlias(resolved.usedAlias!, resolvedId);
  } else if (resolved.resolvedBy === 'name') {
    console.log(`   ✓ Found project by name: "${resolved.project?.name}"`);
    if (resolved.createdAlias) {
      console.log(`   ✓ Created alias "${resolved.createdAlias.alias}" (${resolved.createdAlias.scope})`);
    }
  } else if (resolved.resolvedBy === 'cache') {
    console.log(`   ✓ Found in cache: "${resolved.project?.name}"`);
  }

  try {
    console.log(`\n🔍 Fetching project details...\n`);

    const details = await getProjectDetails(resolvedId);

    if (!details) {
      showEntityNotFound('project', resolvedId);
      process.exit(1);
    }

    const { project, lastAppliedTemplate, milestones, issues } = details;

    // Handle --web flag
    if (options.web) {
      console.log(`🌐 Opening in browser: ${project.name}`);
      await openInBrowser(project.url);
      console.log(`✓ Browser opened to ${project.url}`);
      process.exit(0);
    }

    // Display project details
    console.log(`📋 Project: ${project.name}`);
    console.log(`   ID: ${project.id}`);
    console.log(`   State: ${project.state}`);

    if (project.initiative) {
      console.log(`   Initiative: ${project.initiative.name} (${project.initiative.id})`);
    }

    if (project.team) {
      console.log(`   Team: ${project.team.name} (${project.team.id})`);
    }

    if (lastAppliedTemplate) {
      console.log(`   Template: ${lastAppliedTemplate.name} (${lastAppliedTemplate.id})`);
    }

    console.log(`   URL: ${project.url}`);

    // Display milestones
    if (milestones.length > 0) {
      console.log(`\n📅 Milestones (${milestones.length}):`);
      for (const milestone of milestones) {
        console.log(`   ✓ ${milestone.name}`);
      }
    }

    // Display issues
    if (issues.length > 0) {
      console.log(`\n📝 Issues (${issues.length}):`);
      for (const issue of issues) {
        console.log(`   ✓ ${issue.identifier}: ${issue.title}`);
      }
    }

    // M23: Display dependencies
    try {
      const { getLinearClient, getProjectRelations } = await import('../../lib/linear-client.js');
      const { getRelationDirection } = await import('../../lib/parsers.js');
      const client = getLinearClient();

      const relations = await getProjectRelations(client, resolvedId);

      if (relations.length > 0) {
        // Group by direction
        const dependsOn = relations.filter(rel => getRelationDirection(rel, resolvedId) === 'depends-on');
        const blocks = relations.filter(rel => getRelationDirection(rel, resolvedId) === 'blocks');

        console.log(`\n🔗 Dependencies:`);

        if (dependsOn.length > 0) {
          console.log(`   ⬅️  Depends On (${dependsOn.length}):`);
          for (const rel of dependsOn) {
            const targetProject = rel.project.id === resolvedId ? rel.relatedProject : rel.project;
            const anchorDesc = `[${rel.anchorType} → ${rel.relatedAnchorType}]`;
            console.log(`      • ${targetProject.name} (${targetProject.id})`);
            console.log(`        ${anchorDesc} ${rel.anchorType === 'end' && rel.relatedAnchorType === 'start' ? 'My end waits for their start' : 'Custom anchor configuration'}`);
          }
        }

        if (blocks.length > 0) {
          console.log(`   ➡️  Blocks (${blocks.length}):`);
          for (const rel of blocks) {
            const targetProject = rel.project.id === resolvedId ? rel.relatedProject : rel.project;
            const anchorDesc = `[${rel.anchorType} → ${rel.relatedAnchorType}]`;
            console.log(`      • ${targetProject.name} (${targetProject.id})`);
            console.log(`        ${anchorDesc} ${rel.anchorType === 'start' && rel.relatedAnchorType === 'end' ? 'Their end waits for my start' : 'Custom anchor configuration'}`);
          }
        }
      } else {
        console.log(`\n🔗 Dependencies: None`);
      }
    } catch (error) {
      // Silently skip dependency display if there's an error
      console.error(`   ⚠️  Could not load dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log();
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}
