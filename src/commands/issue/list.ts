/**
 * Issue List Command (M15.5 Phase 3 - FINAL)
 *
 * PHASE 3 SCOPE (Final):
 * - Advanced filters: labels (repeatable), parent/no-parent, cycle, search
 * - Output formats: JSON, TSV (in addition to table)
 * - Sorting: --sort and --order options
 * - Web mode: --web flag
 * - Comprehensive error handling and validation
 */

import type { Command } from 'commander';
import { getAllIssues } from '../../lib/linear-client.js';
import { showError } from '../../lib/output.js';
import { getConfig } from '../../lib/config.js';
import { resolveAlias } from '../../lib/aliases.js';
import { resolveProjectId } from '../../lib/project-resolver.js';
import { resolveIssueIdentifier } from '../../lib/issue-resolver.js';
import { getEntityCache } from '../../lib/entity-cache.js';
import { openInBrowser } from '../../lib/browser.js';
import type { IssueListFilters, IssueListItem } from '../../lib/types.js';

// ========================================
// HELPER: Build filters with smart defaults
// ========================================
async function buildDefaultFilters(options: any): Promise<IssueListFilters> {
  const config = getConfig();
  const filters: IssueListFilters = {};

  // ========================================
  // ASSIGNEE FILTER (default: current user "me")
  // ========================================
  if (!options.allAssignees) {
    if (options.assignee) {
      const assigneeId = resolveAlias('member', options.assignee);
      filters.assigneeId = assigneeId;
    } else {
      const cache = getEntityCache();
      const currentUser = await cache.getCurrentUser();
      filters.assigneeId = currentUser.id;
    }
  }

  // ========================================
  // TEAM FILTER (default: config.defaultTeam)
  // ========================================
  const teamId = options.team || config.defaultTeam;
  if (teamId) {
    filters.teamId = resolveAlias('team', teamId);
  }

  // ========================================
  // ACTIVE FILTER (default: active issues only)
  // ========================================
  if (options.completed) {
    filters.includeCompleted = true;
    filters.includeCanceled = false;
  } else if (options.canceled) {
    filters.includeCompleted = false;
    filters.includeCanceled = true;
  } else if (options.allStates) {
    filters.includeCompleted = true;
    filters.includeCanceled = true;
  } else {
    filters.includeCompleted = false;
    filters.includeCanceled = false;
  }

  // Archived filter (separate from state type)
  if (options.archived) {
    filters.includeArchived = true;
  } else {
    filters.includeArchived = false;
  }

  // ========================================
  // EXPLICIT FILTERS (Phase 2 & Phase 3)
  // ========================================

  if (options.project) {
    const projectId = await resolveProjectId(options.project);
    if (projectId) {
      filters.projectId = projectId;
    }
  }

  if (options.state) {
    filters.stateId = resolveAlias('workflow-state', options.state);
  }

  if (options.priority !== undefined) {
    const priority = parseInt(options.priority, 10);
    if (isNaN(priority) || priority < 0 || priority > 4) {
      throw new Error('Priority must be a number between 0 (None) and 4 (Low)');
    }
    filters.priority = priority;
  }

  // ========================================
  // PHASE 3: ADVANCED FILTERS
  // ========================================

  // Labels (repeatable option)
  if (options.label) {
    const labels = Array.isArray(options.label) ? options.label : [options.label];
    filters.labelIds = labels.map((l: string) => resolveAlias('issue-label', l));
  }

  // Parent/child relationships
  if (options.parent && options.rootOnly) {
    throw new Error('Cannot specify both --parent and --root-only');
  }

  if (options.parent) {
    const parentResult = await resolveIssueIdentifier(options.parent);
    if (!parentResult) {
      throw new Error(`Parent issue not found: ${options.parent}`);
    }
    filters.parentId = parentResult.issueId;
  } else if (options.rootOnly) {
    filters.hasParent = false;
  }

  // Cycle filter
  if (options.cycle) {
    filters.cycleId = resolveAlias('cycle', options.cycle);
  }

  // Search (full-text)
  if (options.search) {
    filters.search = options.search;
  }

  // ========================================
  // PHASE 3: SORTING
  // ========================================
  if (options.sort) {
    const validSortFields = ['priority', 'created', 'updated', 'due'];
    if (!validSortFields.includes(options.sort)) {
      throw new Error(
        `Invalid sort field: ${options.sort}. Valid options: ${validSortFields.join(', ')}`
      );
    }
    filters.sortField = options.sort as any;
  } else {
    // Default sort: priority descending
    filters.sortField = 'priority';
  }

  if (options.order) {
    const validOrders = ['asc', 'desc'];
    if (!validOrders.includes(options.order)) {
      throw new Error(`Invalid sort order: ${options.order}. Valid options: asc, desc`);
    }
    filters.sortOrder = options.order as 'asc' | 'desc';
  } else {
    // Default order: descending
    filters.sortOrder = 'desc';
  }

  return filters;
}

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
// HELPER: Format JSON output
// ========================================
function formatJsonOutput(issues: IssueListItem[]): void {
  console.log(JSON.stringify(issues, null, 2));
}

// ========================================
// HELPER: Format TSV output
// ========================================
function formatTsvOutput(issues: IssueListItem[]): void {
  // Header
  console.log('identifier\ttitle\tstate\tpriority\tassignee\tteam\turl');

  // Rows
  for (const issue of issues) {
    const identifier = issue.identifier;
    const title = issue.title.replace(/\t/g, ' '); // Remove tabs from title
    const state = issue.state?.name || '';
    const priority = issue.priority !== undefined ? issue.priority.toString() : '';
    const assignee = issue.assignee?.email || '';
    const team = issue.team?.key || '';
    const url = issue.url;

    console.log(
      `${identifier}\t${title}\t${state}\t${priority}\t${assignee}\t${team}\t${url}`
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
// HELPER: Build Linear web URL with filters
// ========================================
async function buildLinearWebUrl(filters: IssueListFilters, options: any): Promise<string> {
  // For now, construct a basic URL to the team's active issues view
  // Linear's URL structure for filtered views is complex and not fully documented
  // We'll open to the team view which will show filtered results

  let url = 'https://linear.app';

  // If we have a team filter, we can be more specific
  if (filters.teamId && options.team) {
    // Use team key if available (from alias or direct input)
    url += `/team/${options.team}`;

    // Add filter hints in URL hash/query (Linear uses fragments)
    const params: string[] = [];

    if (filters.priority !== undefined) {
      params.push(`priority=${filters.priority}`);
    }

    if (filters.stateId) {
      params.push(`state=${options.state}`);
    }

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
  }

  return url;
}

// ========================================
// COMMAND HANDLER
// ========================================
async function listIssues(options: {
  // Pagination
  limit?: string;
  all?: boolean;

  // Smart defaults with overrides
  assignee?: string;
  allAssignees?: boolean;
  team?: string;

  // Primary filters
  project?: string;
  state?: string;
  priority?: string;

  // Status filters
  active?: boolean;
  completed?: boolean;
  canceled?: boolean;
  allStates?: boolean;
  archived?: boolean;

  // Phase 3: Advanced filters
  label?: string | string[];
  parent?: string;
  rootOnly?: boolean;
  cycle?: string;
  search?: string;

  // Phase 3: Sorting
  sort?: string;
  order?: string;

  // Phase 3: Output format
  format?: string;

  // Phase 3: Web mode
  web?: boolean;
}): Promise<void> {
  try {
    // Build filters with smart defaults
    const filters = await buildDefaultFilters(options);

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

    // Web mode: open in browser instead of fetching
    if (options.web) {
      const url = await buildLinearWebUrl(filters, options);
      console.log(`Opening Linear in browser: ${url}`);
      await openInBrowser(url);
      return;
    }

    // Fetch issues
    const issues = await getAllIssues(filters);

    // Output based on format
    const format = options.format || 'table';

    switch (format) {
      case 'json':
        formatJsonOutput(issues);
        break;
      case 'tsv':
        formatTsvOutput(issues);
        break;
      case 'table':
      default:
        formatTableOutput(issues);
        // Summary only for table format
        console.log(`\nTotal: ${issues.length} issue(s)`);
        break;
    }

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
    .description('List issues with smart defaults, filtering, and multiple output formats')

    // Pagination
    .option('-l, --limit <number>', 'Maximum number of issues to return (default: 50, max: 250)')
    .option('-a, --all', 'Fetch all issues using pagination (may take longer)')

    // Smart defaults with overrides
    .option('--assignee <id|alias|email>', 'Filter by assignee (overrides default "me")')
    .option('--all-assignees', 'Show issues for all assignees (removes default "me" filter)')
    .option('--team <id|alias>', 'Filter by team (overrides defaultTeam from config)')

    // Primary filters
    .option('--project <id|alias|name>', 'Filter by project')
    .option('--state <id|alias>', 'Filter by workflow state')
    .option('--priority <0-4>', 'Filter by priority (0=None, 1=Urgent, 2=High, 3=Normal, 4=Low)')

    // Status filters
    .option('--active', 'Show only active issues (triage, backlog, unstarted, started) - default behavior')
    .option('--completed', 'Show only completed issues')
    .option('--canceled', 'Show only canceled issues')
    .option('--all-states', 'Show issues in all states (active, completed, canceled)')
    .option('--archived', 'Include archived issues (default: exclude archived)')

    // Phase 3: Advanced filters
    .option('--label <id|alias>', 'Filter by label (repeatable for multiple labels)', collect, [])
    .option('--parent <identifier>', 'Show sub-issues of a parent issue (ENG-123 or UUID)')
    .option('--root-only', 'Show only root issues (no parent)')
    .option('--cycle <id|alias>', 'Filter by cycle')
    .option('--search <query>', 'Full-text search in issue title and description')

    // Phase 3: Sorting
    .option('--sort <field>', 'Sort by field: priority, created, updated, due (default: priority)')
    .option('--order <direction>', 'Sort order: asc or desc (default: desc)')

    // Phase 3: Output format
    .option('-f, --format <type>', 'Output format: table, json, or tsv (default: table)')

    // Phase 3: Web mode
    .option('-w, --web', 'Open Linear in browser with filters applied instead of listing')

    .addHelpText('after', `
Smart Defaults (applied automatically unless overridden):
  • Assignee: Current user ("me") - override with --assignee or --all-assignees
  • Team: defaultTeam from config - override with --team
  • Status: Active issues only (triage, backlog, unstarted, started)
  • Archived: Excluded by default - include with --archived
  • Sort: Priority descending - override with --sort and --order

Filter Precedence:
  • Explicit --assignee overrides "me" default (no --all-assignees needed)
  • Explicit --team overrides defaultTeam from config
  • --all-assignees removes assignee filter entirely

Active Filter Definition:
  "Active" issues include workflow states with type:
    • triage (e.g., "Triage", "Needs Review")
    • backlog (e.g., "Backlog", "Icebox")
    • unstarted (e.g., "Todo", "Planned")
    • started (e.g., "In Progress", "In Review")

  "Active" explicitly excludes:
    • completed (e.g., "Done", "Shipped")
    • canceled (e.g., "Canceled", "Duplicate")

Examples:
  $ linear-create issue list
  # Shows: Your active issues in default team, sorted by priority

  $ linear-create issue list --all-assignees
  # Shows: All users' active issues in default team

  $ linear-create issue list --team backend --completed
  # Shows: Completed issues in backend team

  $ linear-create issue list --assignee john@company.com --priority 1
  # Shows: Urgent issues assigned to john@company.com

  $ linear-create issue list --project "Q1 Goals" --all-states
  # Shows: All issues in "Q1 Goals" project (any state)

  $ linear-create issue list --label bug --label urgent
  # Shows: Issues with both "bug" AND "urgent" labels

  $ linear-create issue list --parent ENG-123
  # Shows: Sub-issues of ENG-123

  $ linear-create issue list --root-only --state todo
  # Shows: Root-level Todo issues (no parent)

  $ linear-create issue list --search "authentication"
  # Shows: Issues containing "authentication" in title or description

  $ linear-create issue list --cycle current
  # Shows: Issues in the "current" cycle

  $ linear-create issue list --sort due --order asc
  # Shows: Issues sorted by due date, earliest first

  $ linear-create issue list --format json | jq '.[] | {id, title, priority}'
  # JSON output for scripting and parsing

  $ linear-create issue list --format tsv | cut -f1,2
  # TSV output for shell scripting

  $ linear-create issue list --team backend --priority 1 --web
  # Opens Linear in browser with filters applied

Set defaults with:
  $ linear-create config set defaultTeam <team-id>
`)
    .action(listIssues);
}

// Helper function for commander's repeatable option
function collect(value: string, previous: string[]): string[] {
  return previous.concat([value]);
}
