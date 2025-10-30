/**
 * Issue List Command (M15.5 Phase 1)
 *
 * PHASE 1 SCOPE:
 * - Basic list with --limit and --all flags
 * - Table output format only
 * - No smart defaults (Phase 2)
 * - No filters (Phase 2)
 * - Focus: Performance foundation and pagination
 */

import type { Command } from 'commander';
import { getAllIssues } from '../../lib/linear-client.js';
import { showError } from '../../lib/output.js';
import type { IssueListFilters, IssueListItem } from '../../lib/types.js';

// ========================================
// HELPER: Format table output
// ========================================
function formatTableOutput(issues: IssueListItem[]): void {
  if (issues.length === 0) {
    console.log('No issues found.');
    return;
  }

  // Header - tab-separated
  console.log('Identifier\tTitle\tState\tPriority\tAssignee\tTeam');

  // Rows - tab-separated
  for (const issue of issues) {
    const identifier = issue.identifier;
    const title = issue.title.substring(0, 50); // Truncate long titles
    const state = issue.state?.name || '';
    const priority = formatPriority(issue.priority);
    const assignee = issue.assignee?.name || 'Unassigned';
    const team = issue.team?.key || '';

    console.log(
      `${identifier}\t${title}\t${state}\t${priority}\t${assignee}\t${team}`
    );
  }
}

// ========================================
// HELPER: Format priority
// ========================================
function formatPriority(priority?: number): string {
  if (priority === undefined) return 'None';
  switch (priority) {
    case 0: return 'None';
    case 1: return 'Urgent';
    case 2: return 'High';
    case 3: return 'Normal';
    case 4: return 'Low';
    default: return 'Unknown';
  }
}

// ========================================
// COMMAND HANDLER
// ========================================
async function listIssues(options: {
  limit?: string;
  all?: boolean;
}): Promise<void> {
  try {
    // Build filters for Phase 1 (minimal)
    const filters: IssueListFilters = {};

    // Pagination options
    if (options.all) {
      filters.fetchAll = true;
      filters.limit = 250; // Use max page size for --all
    } else if (options.limit) {
      const limit = parseInt(options.limit, 10);
      if (isNaN(limit) || limit < 1) {
        throw new Error('Limit must be a positive number');
      }
      if (limit > 250) {
        throw new Error('Limit cannot exceed 250 (Linear API maximum)');
      }
      filters.limit = limit;
    } else {
      filters.limit = 50; // Default
    }

    // Fetch issues
    const issues = await getAllIssues(filters);

    // Output
    formatTableOutput(issues);

    // Summary
    console.log(`\nTotal: ${issues.length} issue(s)`);

  } catch (error) {
    showError(error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// ========================================
// COMMAND REGISTRATION
// ========================================
export function registerIssueListCommand(program: Command): void {
  program
    .command('list')
    .description('List issues')
    .option('-l, --limit <number>', 'Maximum number of issues to return (default: 50, max: 250)')
    .option('-a, --all', 'Fetch all issues using pagination (may take longer)')
    .action(listIssues);
}
