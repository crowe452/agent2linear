import { getEntityCache, clearGlobalCache } from '../../lib/entity-cache.js';
import {
  clearAllCache,
  clearTeamsCache,
  clearInitiativesCache,
  clearMembersCache,
  clearTemplatesCache,
  clearStatusCache,
  clearWorkflowStatesCache,
  clearIssueLabelsCache,
  clearProjectLabelsCache
} from '../../lib/status-cache.js';

/**
 * Clear all cached entities (both session and persistent)
 */
export async function clearCache(options?: { entity?: string }) {
  const cache = getEntityCache();

  if (options?.entity) {
    // Clear specific entity type
    // All entity types with persistent cache support are included
    const validEntities = ['teams', 'initiatives', 'members', 'templates', 'statuses', 'workflow-states', 'issue-labels', 'project-labels'];

    if (!validEntities.includes(options.entity)) {
      console.error(`❌ Invalid entity type: ${options.entity}`);
      console.error(`   Valid options: ${validEntities.join(', ')}`);
      process.exit(1);
    }

    console.log(`🗑️  Clearing ${options.entity} cache...`);

    // Clear session cache (in-memory)
    cache.clearEntity(options.entity as any);

    // Clear persistent cache (file-based)
    switch (options.entity) {
      case 'teams':
        clearTeamsCache();
        break;
      case 'initiatives':
        clearInitiativesCache();
        break;
      case 'members':
        clearMembersCache();
        break;
      case 'templates':
        clearTemplatesCache();
        break;
      case 'statuses':
        clearStatusCache();
        break;
      case 'workflow-states':
        clearWorkflowStatesCache();
        break;
      case 'issue-labels':
        clearIssueLabelsCache();
        break;
      case 'project-labels':
        clearProjectLabelsCache();
        break;
    }

    console.log('✅ Cache cleared successfully (session + persistent)');
  } else {
    // Clear all caches
    console.log('🗑️  Clearing all cached entities...');

    // Clear session cache (in-memory)
    clearGlobalCache();

    // Clear persistent cache (file-based)
    clearAllCache();

    console.log('✅ All caches cleared successfully (session + persistent)');
  }

  console.log('\n💡 Cache will be repopulated on next access');
  console.log('💡 Use "agent2linear cache stats" to view cache status\n');
}
