/**
 * Shared parsing utilities for linear-create CLI
 *
 * These utilities provide consistent parsing of common input formats
 * like comma-separated values and pipe-delimited key-value pairs.
 */

/**
 * Parse comma-separated values into an array
 *
 * Splits by comma, trims whitespace, and filters out empty strings.
 * Handles edge cases like trailing commas, multiple commas, and spaces.
 *
 * @param value - Comma-separated string
 * @returns Array of trimmed, non-empty strings
 *
 * @example
 * ```typescript
 * parseCommaSeparated("a,b,c")           // ["a", "b", "c"]
 * parseCommaSeparated("a, b , c")        // ["a", "b", "c"]
 * parseCommaSeparated("a,,c")            // ["a", "c"]
 * parseCommaSeparated("a,")              // ["a"]
 * parseCommaSeparated("")                // []
 * parseCommaSeparated("user_1,john@example.com,alias") // ["user_1", "john@example.com", "alias"]
 * ```
 */
export function parseCommaSeparated(value: string): string[] {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

/**
 * Pipe-delimited value result
 */
export interface PipeDelimitedValue {
  key: string;
  value: string;
}

/**
 * Parse pipe-delimited key-value pair
 *
 * Splits a string by pipe character (|) into key and value.
 * Commonly used for "URL|Label" format in link arguments.
 * If no pipe is present, returns the entire string as key with empty value.
 *
 * @param input - Pipe-delimited string (e.g., "URL|Label")
 * @returns Object with key and value properties
 *
 * @example
 * ```typescript
 * parsePipeDelimited("https://example.com|Example Site")
 * // { key: "https://example.com", value: "Example Site" }
 *
 * parsePipeDelimited("https://example.com")
 * // { key: "https://example.com", value: "" }
 *
 * parsePipeDelimited("key|value|extra")
 * // { key: "key", value: "value|extra" } (only first pipe splits)
 * ```
 */
export function parsePipeDelimited(input: string): PipeDelimitedValue {
  const pipeIndex = input.indexOf('|');

  if (pipeIndex === -1) {
    // No pipe found, entire string is the key
    return {
      key: input.trim(),
      value: ''
    };
  }

  // Split on first pipe only
  const key = input.substring(0, pipeIndex).trim();
  const value = input.substring(pipeIndex + 1).trim();

  return {
    key,
    value
  };
}

/**
 * Parse lifecycle date value
 *
 * Converts special keywords or ISO dates to ISO DateTime format.
 * Supports:
 * - "now" → current ISO DateTime
 * - "YYYY-MM-DD" → ISO DateTime at midnight UTC
 *
 * @param value - Date string ("now" or "YYYY-MM-DD")
 * @returns ISO DateTime string
 * @throws Error if date format is invalid
 *
 * @example
 * ```typescript
 * parseLifecycleDate("now")           // "2025-01-26T10:30:00.000Z" (current time)
 * parseLifecycleDate("2025-01-15")    // "2025-01-15T00:00:00.000Z"
 * parseLifecycleDate("2025-13-45")    // throws Error
 * parseLifecycleDate("01/15/2025")    // throws Error
 * ```
 */
export function parseLifecycleDate(value: string): string {
  const trimmed = value.trim().toLowerCase();

  // Handle "now" keyword
  if (trimmed === 'now') {
    return new Date().toISOString();
  }

  // Validate ISO date format (YYYY-MM-DD)
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(value)) {
    throw new Error(
      `Invalid date format: ${value}\n` +
      'Date must be "now" or ISO 8601 format: YYYY-MM-DD (e.g., 2025-01-15)'
    );
  }

  // Parse and validate it's a real date
  const date = new Date(value + 'T00:00:00.000Z'); // Midnight UTC
  if (isNaN(date.getTime())) {
    throw new Error(
      `Invalid date: ${value}\n` +
      'Date must be a valid calendar date'
    );
  }

  return date.toISOString();
}

/**
 * Parse multiple pipe-delimited values
 *
 * Parses an array of pipe-delimited strings. Useful for processing
 * multiple --link arguments from CLI.
 *
 * @param inputs - Array of pipe-delimited strings
 * @returns Array of parsed key-value pairs
 *
 * @example
 * ```typescript
 * parsePipeDelimitedArray([
 *   "https://github.com/repo|GitHub",
 *   "https://docs.site.com"
 * ])
 * // [
 * //   { key: "https://github.com/repo", value: "GitHub" },
 * //   { key: "https://docs.site.com", value: "" }
 * // ]
 * ```
 */
export function parsePipeDelimitedArray(inputs: string[]): PipeDelimitedValue[] {
  return inputs.map(input => parsePipeDelimited(input));
}

/**
 * Parse comma-separated values with deduplication
 *
 * Like parseCommaSeparated but removes duplicate values.
 * Case-sensitive comparison.
 *
 * @param value - Comma-separated string
 * @returns Array of unique trimmed, non-empty strings
 *
 * @example
 * ```typescript
 * parseCommaSeparatedUnique("a,b,a,c")  // ["a", "b", "c"]
 * parseCommaSeparatedUnique("a,A,a")     // ["a", "A"] (case-sensitive)
 * ```
 */
export function parseCommaSeparatedUnique(value: string): string[] {
  const values = parseCommaSeparated(value);
  return Array.from(new Set(values));
}

/**
 * M23: Project Dependency Management - Parsing Utilities
 */

import { resolveAlias } from './aliases.js';
import type { DependencyDirection, ProjectRelation } from './types.js';

/**
 * Parse comma-separated project IDs/aliases for dependencies
 *
 * Resolves each value as a project ID or alias.
 * Whitespace around commas is trimmed.
 *
 * @param input - Comma-separated project IDs/aliases
 * @returns Array of resolved project IDs
 * @throws Error if any project ID/alias cannot be resolved
 *
 * @example
 * ```typescript
 * resolveDependencyProjects("proj_abc123,backend-infra")
 * // ["proj_abc123", "proj_xyz789"] (after resolving alias)
 *
 * resolveDependencyProjects("proj1, proj2, proj3")
 * // ["proj_abc", "proj_def", "proj_ghi"] (whitespace trimmed)
 * ```
 */
export function resolveDependencyProjects(input: string): string[] {
  const values = parseCommaSeparated(input);
  return values.map(value => resolveAlias('project', value));
}

/**
 * Validate anchor type is "start" or "end"
 *
 * @param anchor - Anchor value to validate
 * @returns Validated anchor type
 * @throws Error if anchor is not "start" or "end"
 *
 * @example
 * ```typescript
 * validateAnchorType("start")  // "start"
 * validateAnchorType("end")    // "end"
 * validateAnchorType("middle") // throws Error
 * ```
 */
export function validateAnchorType(anchor: string): 'start' | 'end' {
  const trimmed = anchor.trim().toLowerCase();
  if (trimmed !== 'start' && trimmed !== 'end') {
    throw new Error(
      `Invalid anchor type: ${anchor}\n` +
      'Anchor must be "start" or "end"'
    );
  }
  return trimmed as 'start' | 'end';
}

/**
 * Parse advanced dependency syntax: "project:myAnchor:theirAnchor"
 *
 * @param input - Advanced dependency spec
 * @returns Parsed dependency direction with resolved project ID
 * @throws Error if format is invalid or anchors are invalid
 *
 * @example
 * ```typescript
 * parseAdvancedDependency("api-v2:end:start")
 * // {
 * //   relatedProjectId: "proj_abc123",
 * //   anchorType: "end",
 * //   relatedAnchorType: "start"
 * // }
 *
 * parseAdvancedDependency("backend-infra:start:end")
 * // {
 * //   relatedProjectId: "proj_xyz789",
 * //   anchorType: "start",
 * //   relatedAnchorType: "end"
 * // }
 *
 * parseAdvancedDependency("invalid:syntax")  // throws Error
 * parseAdvancedDependency("proj:bad:anchor") // throws Error
 * ```
 */
export function parseAdvancedDependency(input: string): DependencyDirection {
  const parts = input.split(':');

  if (parts.length !== 3) {
    throw new Error(
      `Invalid dependency format: ${input}\n` +
      'Expected format: "project:myAnchor:theirAnchor"\n' +
      'Example: "api-v2:end:start"'
    );
  }

  const [projectIdOrAlias, myAnchor, theirAnchor] = parts;

  // Resolve project ID/alias
  const relatedProjectId = resolveAlias('project', projectIdOrAlias.trim());

  // Validate anchor types
  const anchorType = validateAnchorType(myAnchor);
  const relatedAnchorType = validateAnchorType(theirAnchor);

  return {
    relatedProjectId,
    anchorType,
    relatedAnchorType,
  };
}

/**
 * Determine if a relation represents "depends on" vs "blocks"
 * from the perspective of a given project
 *
 * "Depends on" = My end waits for their start (standard dependency)
 * "Blocks" = Their end waits for my start (reverse dependency)
 *
 * @param relation - ProjectRelation to analyze
 * @param fromProjectId - Perspective project ID
 * @returns Direction: "depends-on" or "blocks"
 *
 * @example
 * ```typescript
 * // Relation: Project A (end) → Project B (start)
 * // From A's perspective: A depends on B
 * getRelationDirection(relation, projectA.id) // "depends-on"
 *
 * // From B's perspective: A blocks B (B waits for A)
 * getRelationDirection(relation, projectB.id) // "blocks"
 * ```
 */
export function getRelationDirection(
  relation: ProjectRelation,
  fromProjectId: string
): 'depends-on' | 'blocks' {
  // If I am the source project
  if (relation.project.id === fromProjectId) {
    // My end → their start = I depend on them
    if (relation.anchorType === 'end' && relation.relatedAnchorType === 'start') {
      return 'depends-on';
    }
    // Any other anchor combination from my perspective = I block them
    return 'blocks';
  }

  // If I am the target project
  if (relation.relatedProject.id === fromProjectId) {
    // Their end → my start = they depend on me (I block them)
    if (relation.anchorType === 'end' && relation.relatedAnchorType === 'start') {
      return 'blocks';
    }
    // Any other anchor combination = they block me (I depend on them)
    return 'depends-on';
  }

  // This shouldn't happen if called correctly
  throw new Error('Invalid relation: project is neither source nor target');
}
