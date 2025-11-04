/**
 * Shared resolution utilities for agent2linear CLI
 *
 * These utilities provide consistent entity resolution logic across commands,
 * trying multiple resolution strategies (alias, ID, name) with proper logging.
 */

import { resolveAlias } from './aliases.js';
import { resolveProjectStatusId, resolveWorkflowStateId } from './status-cache.js';

/**
 * Resolution result type
 */
export interface ResolutionResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Entity type for resolution
 */
export type ResolvableEntityType = 'project-status' | 'workflow-state';

/**
 * Resolve status entity with multi-strategy lookup
 *
 * Tries multiple resolution strategies in order:
 * 1. Alias resolution (fast, local)
 * 2. Direct ID (if matches format)
 * 3. Name lookup (via cache or API)
 *
 * Includes console logging to show resolution progress to user.
 *
 * @param input - User input (alias, ID, or name)
 * @param entityType - Type of entity to resolve
 * @returns Resolution result with ID or error
 *
 * @example
 * ```typescript
 * // Resolve by alias
 * const result1 = await resolveStatus("in-progress", "project-status");
 * // Console: "📎 Resolved alias: in-progress → status_abc123"
 *
 * // Resolve by name
 * const result2 = await resolveStatus("In Progress", "project-status");
 * // Console: "✓ Found status by name: 'In Progress'"
 *
 * // Resolve by ID
 * const result3 = await resolveStatus("status_abc123", "project-status");
 * // Console: "✓ Using status ID: status_abc123"
 * ```
 */
export async function resolveStatus(
  input: string,
  entityType: ResolvableEntityType
): Promise<ResolutionResult> {
  console.log(`🔍 Resolving ${entityType} "${input}"...`);

  // Strategy 1: Try alias first (fast, local lookup)
  const aliasType = entityType === 'project-status' ? 'project-status' : 'workflow-state';
  const aliasResolved = resolveAlias(aliasType, input);

  if (aliasResolved !== input) {
    // Alias was found and resolved
    console.log(`   ✓ Resolved alias: ${input} → ${aliasResolved}`);
    return {
      success: true,
      id: aliasResolved
    };
  }

  // Strategy 2 & 3: Try direct ID or name lookup
  // Currently only implemented for project-status
  if (entityType === 'project-status') {
    const resolved = await resolveProjectStatusId(input);

    if (resolved) {
      if (resolved === input) {
        // Input was already a valid ID
        console.log(`   ✓ Using status ID: ${input}`);
      } else {
        // Resolved by name
        console.log(`   ✓ Found status by name: "${input}"`);
      }

      return {
        success: true,
        id: resolved
      };
    }

    // Not found
    console.error(`❌ Status not found: "${input}"`);
    console.error('   Use "agent2linear project-status list" to see available statuses');

    return {
      success: false,
      error: `Status not found: "${input}"`
    };
  }

  // Workflow state resolution
  if (entityType === 'workflow-state') {
    const resolved = await resolveWorkflowStateId(input);

    if (resolved) {
      if (resolved === input) {
        // Input was already a valid ID
        console.log(`   ✓ Using workflow state ID: ${input}`);
      } else {
        // Resolved by name
        console.log(`   ✓ Found workflow state by name: "${input}"`);
      }

      return {
        success: true,
        id: resolved
      };
    }

    // Not found
    console.error(`❌ Workflow state not found: "${input}"`);
    console.error('   Use "agent2linear workflow-states list" to see available states');

    return {
      success: false,
      error: `Workflow state not found: "${input}"`
    };
  }

  // Should not reach here, but TypeScript needs this
  return {
    success: false,
    error: `Unknown entity type: ${entityType}`
  };
}

/**
 * Resolve status with error handling (throws on failure)
 *
 * Convenience wrapper that throws an error instead of returning a result object.
 * Useful when you want the program to exit on resolution failure.
 *
 * @param input - User input (alias, ID, or name)
 * @param entityType - Type of entity to resolve
 * @returns Resolved ID
 * @throws Error if resolution fails
 *
 * @example
 * ```typescript
 * try {
 *   const statusId = await resolveStatusOrThrow("in-progress", "project-status");
 *   // Use statusId...
 * } catch (error) {
 *   console.error(error.message);
 *   process.exit(1);
 * }
 * ```
 */
export async function resolveStatusOrThrow(
  input: string,
  entityType: ResolvableEntityType
): Promise<string> {
  const result = await resolveStatus(input, entityType);

  if (!result.success) {
    throw new Error(result.error || `Failed to resolve ${entityType}: ${input}`);
  }

  return result.id!;
}
