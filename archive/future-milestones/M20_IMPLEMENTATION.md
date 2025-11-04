# M20 Implementation Plan: Project List & Search (v0.19.0)

## Executive Summary

**Goal:** Add comprehensive project listing with intelligent defaults, extensive filtering matching all create/update fields, multiple output formats, and refactor project command structure for consistency.

**Status:** Ready for implementation (all prerequisites analyzed)

**Estimated Time:** 6-9 hours

**Key Finding:** ✅ All project commands already use function exports - no refactoring needed for M20-T01, M20-T02, M20-T03

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Current State Analysis](#current-state-analysis)
3. [Implementation Phases](#implementation-phases)
4. [Detailed Task Breakdown](#detailed-task-breakdown)
5. [API Design](#api-design)
6. [Smart Defaults Logic](#smart-defaults-logic)
7. [Output Format Specifications](#output-format-specifications)
8. [Testing Strategy](#testing-strategy)
9. [Verification Checklist](#verification-checklist)

---

## Architecture Overview

### Component Structure

```
src/
├── lib/
│   ├── types.ts                    [MODIFY] Add ProjectListFilters, ProjectListItem
│   ├── linear-client.ts            [MODIFY] Enhance getAllProjects()
│   └── format-utils.ts             [NEW] Table formatting utilities
└── commands/
    └── project/
        ├── create.tsx              [NO CHANGE] Already exports function
        ├── update.ts               [NO CHANGE] Already exports function
        ├── view.ts                 [NO CHANGE] Already exports function
        ├── add-milestones.ts       [NO CHANGE] Already exports function
        └── list.tsx                [NEW] List command with Ink UI

tests/
└── scripts/
    └── test-project-list.sh        [NEW] ~40 test cases
```

### Data Flow

```
User CLI Input
    ↓
list.tsx (command handler)
    ↓
buildDefaultFilters() → Apply smart defaults + overrides
    ↓
resolveAlias() for all entity references
    ↓
getAllProjects(filters) → Linear GraphQL API
    ↓
Format Output (table/JSON/TSV/interactive)
    ↓
Display to User
```

---

## Current State Analysis

### Existing Capabilities ✅

**Project Commands (src/commands/project/):**
- ✅ `create.tsx` - Already exports `createProjectCommand(options)`
- ✅ `update.ts` - Already exports `updateProjectCommand(nameOrId, options)`
- ✅ `view.ts` - Already exports `viewProject(nameOrId, options)`
- ✅ `add-milestones.ts` - Already exports `addMilestones(projectNameOrId, options)`

**Linear Client (src/lib/linear-client.ts):**
- ✅ `getAllProjects(teamId?: string)` exists but needs enhancement
- ✅ `getCurrentUser()` exists (line 70)
- ✅ `findProjectByName()`, `getProjectById()` exist

**Utilities:**
- ✅ Alias resolution: `resolveAlias(entityType, idOrAlias)` (src/lib/aliases.ts)
- ✅ Config system: `getConfig()` with defaultTeam, defaultInitiative (src/lib/config.ts)
- ✅ Output utilities: `formatListJSON()`, `formatListTSV()` (src/lib/output.ts)
- ✅ Parsers: `parseCommaSeparated()`, date validators (src/lib/parsers.ts)

### Missing Components ⚠️

- ⚠️ Table formatter utility (no existing implementation)
- ⚠️ Comprehensive project filtering in `getAllProjects()`
- ⚠️ `ProjectListFilters` and `ProjectListItem` type definitions
- ⚠️ Default filter builder with override logic
- ⚠️ list.tsx command implementation

---

## Implementation Phases

### Phase 1: API & Type Foundation (~2-3 hours)

**Goal:** Enhance Linear client to support comprehensive project filtering

**Tasks:**
- M20-T04: Expand type definitions
- M20-T05: Enhance `getAllProjects()` with comprehensive filters
- M20-T06: Verify `getCurrentUser()` (already exists ✅)
- M20-T07: Implement default filter builder
- M20-T08: Implement override flag logic

**Deliverables:**
```typescript
// src/lib/types.ts
export interface ProjectListFilters { ... }
export interface ProjectListItem { ... }

// src/lib/linear-client.ts
import type { ProjectListFilters, ProjectListItem } from './types';
export async function getAllProjects(
  filters?: ProjectListFilters
): Promise<ProjectListItem[]>

// Helper function
async function buildDefaultFilters(options, config): Promise<ProjectListFilters>
```

### Phase 2: List Command Implementation (~3-4 hours)

**Goal:** Create list.tsx with all output formats

**Tasks:**
- M20-T09: Create list.tsx structure
- M20-T10: Implement filter flags
- M20-T11: Implement date range filters
- M20-T12: Implement table formatter
- M20-T13: Implement content preview truncation logic
- M20-T14: Implement Ink UI component
- M20-T15: Implement JSON/TSV output formats

**Deliverables:**
```bash
# Working command with all features
linear-create project list --help
linear-create project list  # Smart defaults
linear-create project list --team backend --status started
linear-create project list --format json
linear-create project list -I  # Interactive mode
```

### Phase 3: Testing & Documentation (~2-3 hours)

**Goal:** Comprehensive test coverage and documentation

**Tasks:**
- M20-TS01: Create test-project-list.sh (~40 test cases)
- M20-TS02: Test default behavior
- M20-TS03: Test all filter combinations
- M20-TS04: Update README.md

**Deliverables:**
- Passing test suite with ~40 test cases
- Updated README.md with list command documentation
- All automated checks passing (build, typecheck, lint)

---

## Detailed Task Breakdown

### M20-T05: Add `getAllProjects()` to linear-client.ts with comprehensive filter support

**Location:** `src/lib/linear-client.ts`

**Current Implementation (line 610):**
```typescript
export async function getAllProjects(teamId?: string): Promise<Project[]> {
  const client = getLinearClient();

  if (teamId) {
    const team = await client.team(teamId);
    if (!team) throw new Error(`Team not found: ${teamId}`);
    const projects = await team.projects();
    return projects.nodes;
  }

  const projects = await client.projects();
  return projects.nodes;
}
```

**New Implementation:**

```typescript
import type { ProjectListFilters, ProjectListItem } from './types';

export async function getAllProjects(filters?: ProjectListFilters): Promise<ProjectListItem[]> {
  const client = getLinearClient();

  // Build GraphQL filter object
  const graphqlFilter: any = {};

  if (filters?.teamId) {
    graphqlFilter.team = { id: { eq: filters.teamId } };
  }

  if (filters?.initiativeId) {
    graphqlFilter.initiative = { id: { eq: filters.initiativeId } };
  }

  if (filters?.statusId) {
    graphqlFilter.projectStatus = { id: { eq: filters.statusId } };
  }

  if (filters?.priority !== undefined) {
    graphqlFilter.priority = { eq: filters.priority };
  }

  if (filters?.leadId) {
    graphqlFilter.lead = { id: { eq: filters.leadId } };
  }

  if (filters?.memberIds && filters.memberIds.length > 0) {
    graphqlFilter.members = { some: { id: { in: filters.memberIds } } };
  }

  if (filters?.labelIds && filters.labelIds.length > 0) {
    graphqlFilter.labels = { some: { id: { in: filters.labelIds } } };
  }

  // Date range filters
  if (filters?.startDateAfter) {
    graphqlFilter.startDate = { gte: filters.startDateAfter };
  }
  if (filters?.startDateBefore) {
    if (!graphqlFilter.startDate) graphqlFilter.startDate = {};
    graphqlFilter.startDate.lte = filters.startDateBefore;
  }

  if (filters?.targetDateAfter) {
    graphqlFilter.targetDate = { gte: filters.targetDateAfter };
  }
  if (filters?.targetDateBefore) {
    if (!graphqlFilter.targetDate) graphqlFilter.targetDate = {};
    graphqlFilter.targetDate.lte = filters.targetDateBefore;
  }

  // Text search (search in name, description, content)
  if (filters?.search) {
    graphqlFilter.or = [
      { name: { containsIgnoreCase: filters.search } },
      { description: { containsIgnoreCase: filters.search } },
      { content: { containsIgnoreCase: filters.search } }
    ];
  }

  // Fetch projects with all relations
  const projects = await client.projects({
    filter: Object.keys(graphqlFilter).length > 0 ? graphqlFilter : undefined,
    includeArchived: false,
    orderBy: { updatedAt: 'desc' }  // Most recently updated first
  });

  // Map to ProjectListItem format
  const projectList: ProjectListItem[] = [];

  for (const project of projects.nodes) {
    const team = await project.team;
    const lead = await project.lead;
    const initiative = await project.initiative;
    const status = await project.projectStatus;
    const labels = await project.labels();
    const members = await project.members();

    projectList.push({
      id: project.id,
      name: project.name,
      description: project.description || undefined,
      content: project.content || undefined,
      icon: project.icon || undefined,
      color: project.color || undefined,
      state: project.state,
      priority: project.priority !== undefined ? project.priority : undefined,

      status: status ? {
        id: status.id,
        name: status.name,
        type: status.type
      } : undefined,

      lead: lead ? {
        id: lead.id,
        name: lead.name,
        email: lead.email
      } : undefined,

      team: team ? {
        id: team.id,
        name: team.name,
        key: team.key
      } : undefined,

      initiative: initiative ? {
        id: initiative.id,
        name: initiative.name
      } : undefined,

      labels: labels.nodes.map(label => ({
        id: label.id,
        name: label.name,
        color: label.color || undefined
      })),

      members: members.nodes.map(member => ({
        id: member.id,
        name: member.name,
        email: member.email
      })),

      startDate: project.startDate || undefined,
      targetDate: project.targetDate || undefined,
      completedAt: project.completedAt || undefined,

      url: project.url,
      createdAt: project.createdAt.toString(),
      updatedAt: project.updatedAt.toString()
    });
  }

  return projectList;
}
```

**Testing:**
```bash
# Test in node REPL
node dist/index.js
> const { getAllProjects } = require('./dist/lib/linear-client.js');
> getAllProjects({ teamId: 'team_xxx' }).then(console.log);
```

---

### M20-T06: Verify `getCurrentUser()` exists

**Status:** ✅ Already exists in `src/lib/linear-client.ts:70`

```typescript
export async function getCurrentUser(): Promise<{
  id: string;
  name: string;
  email: string;
}> {
  const client = getLinearClient();
  const user = await client.viewer;
  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}
```

**Action:** No changes needed.

---

### M20-T07: Implement default filter builder

**Location:** `src/commands/project/list.tsx` (helper function)

**Implementation:**

```typescript
import { getConfig } from '../../lib/config.js';
import { getCurrentUser } from '../../lib/linear-client.js';
import { resolveAlias } from '../../lib/aliases.js';
import type { ProjectListFilters } from '../../lib/types.js';

async function buildDefaultFilters(options: any): Promise<ProjectListFilters> {
  const config = getConfig();
  const filters: ProjectListFilters = {};

  // ========================================
  // LEAD FILTER (default: current user)
  // ========================================
  if (!options.allLeads) {
    if (options.lead) {
      // Explicit lead specified - resolve it
      const leadId = resolveAlias('member', options.lead);
      filters.leadId = leadId;
    } else {
      // Default: current user is the lead
      const currentUser = await getCurrentUser();
      filters.leadId = currentUser.id;
    }
  }
  // If --all-leads: don't set leadId filter (show all leads)

  // ========================================
  // TEAM FILTER (default: config.defaultTeam)
  // ========================================
  if (!options.allTeams) {
    const teamId = options.team || config.defaultTeam;
    if (teamId) {
      filters.teamId = resolveAlias('team', teamId);
    }
  }
  // If --all-teams: don't set teamId filter (show all teams)

  // ========================================
  // INITIATIVE FILTER (default: config.defaultInitiative)
  // ========================================
  if (!options.allInitiatives) {
    const initiativeId = options.initiative || config.defaultInitiative;
    if (initiativeId) {
      filters.initiativeId = resolveAlias('initiative', initiativeId);
    }
  }
  // If --all-initiatives: don't set initiativeId filter (show all initiatives)

  // ========================================
  // EXPLICIT FILTERS (no defaults, only if specified)
  // ========================================

  if (options.status) {
    filters.statusId = resolveAlias('project-status', options.status);
  }

  if (options.priority !== undefined) {
    filters.priority = parseInt(options.priority, 10);
  }

  if (options.member) {
    // Can be comma-separated list
    const members = options.member.split(',').map((m: string) => m.trim());
    filters.memberIds = members.map((m: string) => resolveAlias('member', m));
  }

  if (options.label) {
    // Can be comma-separated list
    const labels = options.label.split(',').map((l: string) => l.trim());
    filters.labelIds = labels.map((l: string) => resolveAlias('project-label', l));
  }

  // Date range filters
  if (options.startAfter) {
    filters.startDateAfter = options.startAfter;
  }
  if (options.startBefore) {
    filters.startDateBefore = options.startBefore;
  }
  if (options.targetAfter) {
    filters.targetDateAfter = options.targetAfter;
  }
  if (options.targetBefore) {
    filters.targetDateBefore = options.targetBefore;
  }

  // Search query
  if (options.search) {
    filters.search = options.search;
  }

  return filters;
}
```

**Testing Logic:**

```bash
# Test 1: Default behavior (no flags)
# Expected: lead=currentUser + team=configDefaultTeam + initiative=configDefaultInitiative
linear-create project list

# Test 2: Override lead default
# Expected: lead=alice (not currentUser)
linear-create project list --lead alice

# Test 3: Override all defaults
# Expected: No lead/team/initiative filters applied
linear-create project list --all-leads --all-teams --all-initiatives

# Test 4: Override only lead
# Expected: Show all leads, but still filter by default team/initiative
linear-create project list --all-leads
```

---

### M20-T08: Implement override flag logic

**Implementation:** Already included in `buildDefaultFilters()` above.

**Override Flags:**
- `--all-leads`: Don't filter by lead (show projects with any lead)
- `--all-teams`: Don't filter by team (show projects from all teams)
- `--all-initiatives`: Don't filter by initiative (show projects from all initiatives)

**Logic:**
```typescript
// Pseudocode
if (!options.allLeads) {
  // Apply lead filter (default: currentUser or explicit --lead)
} else {
  // Skip lead filter entirely
}
```

---

### M20-T09: Create list.tsx structure

**Location:** `src/commands/project/list.tsx`

**Implementation:**

```typescript
import React from 'react';
import { render, Box, Text } from 'ink';
import type { Command } from 'commander';
import { getAllProjects } from '../../lib/linear-client.js';
import { showError } from '../../lib/output.js';
import type { ProjectListItem } from '../../lib/types.js';

// ========================================
// HELPER: Build filters from options
// ========================================
async function buildDefaultFilters(options: any): Promise<any> {
  // [Implementation from M20-T07 above]
}

// ========================================
// HELPER: Format content preview
// ========================================
function formatContentPreview(project: ProjectListItem): string {
  // Prefer description over content
  const text = project.description || project.content || '';

  if (!text) return '';

  // Remove markdown formatting, newlines
  const cleaned = text
    .replace(/[#*_~`]/g, '')  // Remove markdown syntax
    .replace(/\n+/g, ' ')      // Replace newlines with spaces
    .replace(/\s+/g, ' ')      // Collapse whitespace
    .trim();

  // Truncate to 60 chars
  return cleaned.length > 60
    ? cleaned.substring(0, 57) + '...'
    : cleaned;
}

// ========================================
// HELPER: Format table output
// ========================================
function formatTableOutput(projects: ProjectListItem[]): void {
  if (projects.length === 0) {
    console.log('No projects found.');
    return;
  }

  // Calculate column widths
  const idWidth = 12;
  const titleWidth = 30;
  const statusWidth = 12;
  const teamWidth = 15;
  const leadWidth = 20;
  const previewWidth = 60;

  // Header
  console.log(
    'ID'.padEnd(idWidth) +
    'Title'.padEnd(titleWidth) +
    'Status'.padEnd(statusWidth) +
    'Team'.padEnd(teamWidth) +
    'Lead'.padEnd(leadWidth) +
    'Preview'
  );
  console.log('-'.repeat(idWidth + titleWidth + statusWidth + teamWidth + leadWidth + previewWidth));

  // Rows
  for (const project of projects) {
    const id = project.id.substring(0, 11);
    const title = project.name.length > 28
      ? project.name.substring(0, 27) + '…'
      : project.name;
    const status = (project.status?.name || project.state || '').substring(0, 11);
    const team = (project.team?.name || '').substring(0, 14);
    const lead = (project.lead?.name || '').substring(0, 19);
    const preview = formatContentPreview(project);

    console.log(
      id.padEnd(idWidth) +
      title.padEnd(titleWidth) +
      status.padEnd(statusWidth) +
      team.padEnd(teamWidth) +
      lead.padEnd(leadWidth) +
      preview
    );
  }

  console.log(`\nTotal: ${projects.length} project${projects.length !== 1 ? 's' : ''}`);
}

// ========================================
// HELPER: Format JSON output
// ========================================
function formatJSONOutput(projects: ProjectListItem[]): void {
  console.log(JSON.stringify(projects, null, 2));
}

// ========================================
// HELPER: Format TSV output
// ========================================
function formatTSVOutput(projects: ProjectListItem[]): void {
  // Headers
  console.log('ID\tTitle\tStatus\tTeam\tLead\tPreview');

  // Rows
  for (const project of projects) {
    const status = project.status?.name || project.state || '';
    const team = project.team?.name || '';
    const lead = project.lead?.name || '';
    const preview = formatContentPreview(project);

    console.log(
      `${project.id}\t${project.name}\t${status}\t${team}\t${lead}\t${preview}`
    );
  }
}

// ========================================
// INK COMPONENT: Interactive list
// ========================================
interface ProjectListProps {
  filters: any;
  format?: string;
}

function ProjectList({ filters, format }: ProjectListProps): React.ReactElement {
  const [projects, setProjects] = React.useState<ProjectListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        const projectList = await getAllProjects(filters);
        setProjects(projectList);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  if (loading) {
    return <Text>Loading projects...</Text>;
  }

  if (error) {
    return <Text color="red">Error: {error}</Text>;
  }

  if (projects.length === 0) {
    return <Text color="yellow">No projects found matching your filters.</Text>;
  }

  return (
    <Box flexDirection="column">
      <Text bold underline>Projects ({projects.length})</Text>
      <Text> </Text>

      {projects.map((project) => (
        <Box key={project.id} flexDirection="column" marginBottom={1}>
          <Text>
            <Text bold color="cyan">{project.name}</Text>
            {' '}
            <Text dimColor>({project.id.substring(0, 8)}...)</Text>
          </Text>

          <Text>
            Status: <Text color="green">{project.status?.name || project.state}</Text>
            {' | '}
            Team: <Text color="blue">{project.team?.name || 'N/A'}</Text>
            {' | '}
            Lead: <Text color="magenta">{project.lead?.name || 'N/A'}</Text>
          </Text>

          {(project.description || project.content) && (
            <Text dimColor>{formatContentPreview(project)}</Text>
          )}
        </Box>
      ))}
    </Box>
  );
}

// ========================================
// COMMAND REGISTRATION
// ========================================
export function listProjectsCommand(program: Command): void {
  program
    .command('list')
    .alias('ls')
    .description('List projects with smart defaults and filtering')

    // Filter options
    .option('-t, --team <id>', 'Filter by team (default: config.defaultTeam)')
    .option('-i, --initiative <id>', 'Filter by initiative (default: config.defaultInitiative)')
    .option('-s, --status <id>', 'Filter by project status')
    .option('-p, --priority <number>', 'Filter by priority (0-4)')
    .option('-l, --lead <id>', 'Filter by project lead (default: current user)')
    .option('-m, --member <id>', 'Filter by member (comma-separated for multiple)')
    .option('--label <id>', 'Filter by label (comma-separated for multiple)')
    .option('--search <query>', 'Search in project name, description, or content')

    // Date range filters
    .option('--start-after <date>', 'Filter projects starting after date (YYYY-MM-DD)')
    .option('--start-before <date>', 'Filter projects starting before date (YYYY-MM-DD)')
    .option('--target-after <date>', 'Filter projects targeting after date (YYYY-MM-DD)')
    .option('--target-before <date>', 'Filter projects targeting before date (YYYY-MM-DD)')

    // Override flags
    .option('--all-leads', 'Show projects with any lead (overrides default: current user)')
    .option('--all-teams', 'Show projects from all teams (overrides default team)')
    .option('--all-initiatives', 'Show projects from all initiatives (overrides default initiative)')

    // Output format
    .option('-f, --format <type>', 'Output format: table (default), json, tsv', 'table')
    .option('-I, --interactive', 'Interactive mode with Ink UI')
    .option('-w, --web', 'Open in web browser')

    .action(async (options) => {
      try {
        // Build filters with smart defaults
        const filters = await buildDefaultFilters(options);

        // Web mode - open in browser
        if (options.web) {
          // TODO: Implement web browser opening
          // For now, just show error
          showError('Web mode not yet implemented');
          process.exit(1);
        }

        // Non-interactive formats - handle synchronously before Ink
        if (options.format !== 'table' || !options.interactive) {
          const projects = await getAllProjects(filters);

          if (options.format === 'json') {
            formatJSONOutput(projects);
          } else if (options.format === 'tsv') {
            formatTSVOutput(projects);
          } else {
            // Default: table
            formatTableOutput(projects);
          }

          process.exit(0);
        }

        // Interactive mode with Ink UI
        render(<ProjectList filters={filters} format={options.format} />);

      } catch (error: any) {
        showError(error.message);
        process.exit(1);
      }
    });
}
```

---

### M20-T10: Implement filter flags

The Commander options block handles team, initiative, status, priority, lead, member, label, and search filters. Each flag maps directly to fields in `ProjectListFilters` and feeds into `buildDefaultFilters()`.

### M20-T11: Implement date range filters

The `--start-after`, `--start-before`, `--target-after`, and `--target-before` options wire into the default filter builder, enabling the Linear query date bounds described earlier.

### M20-T12: Implement table formatter

`formatTableOutput()` calculates column widths, truncates values safely, and prints a footer count, providing the default CLI table view.

### M20-T13: Implement content preview truncation logic

`formatContentPreview()` strips markdown artifacts, normalizes whitespace, and truncates the text to 60 characters with an ellipsis when needed.

### M20-T14: Implement Ink UI component

`ProjectList` encapsulates async fetching, loading/error states, and the formatted Ink output for interactive mode.

### M20-T15: Implement JSON/TSV output formats

`formatJSONOutput()`, `formatTSVOutput()`, and the non-interactive branch in the command handler emit serialized results before falling back to Ink rendering.

---

## Smart Defaults Logic

### Default Behavior (No Flags)

```bash
linear-create project list
```

**Applied Filters:**
1. `lead = currentUser` (from `getCurrentUser()`)
2. `team = config.defaultTeam` (if configured)
3. `initiative = config.defaultInitiative` (if configured)

**Result:** Shows projects where **I am the lead**, in my default team/initiative.

---

### Override Examples

```bash
# Override lead to show specific person's projects
linear-create project list --lead alice@company.com
# Filters: lead=alice, team=defaultTeam, initiative=defaultInitiative

# Override to show ALL leads (but still default team/initiative)
linear-create project list --all-leads
# Filters: team=defaultTeam, initiative=defaultInitiative (no lead filter)

# Override to show all teams (but still current user as lead)
linear-create project list --all-teams
# Filters: lead=currentUser, initiative=defaultInitiative (no team filter)

# Override everything - show ALL projects everywhere
linear-create project list --all-leads --all-teams --all-initiatives
# Filters: (none - all projects)
```

---

### Filter Combinations

```bash
# Complex filter: backend team, started status, priority 1
linear-create project list --team backend --status started --priority 1
# Filters: lead=currentUser, team=backend, status=started, priority=1

# Filter by member (projects where Bob is assigned)
linear-create project list --member bob
# Filters: lead=currentUser, member=bob, team=defaultTeam, initiative=defaultInitiative

# Date range: projects starting in Q1 2025
linear-create project list --start-after 2025-01-01 --start-before 2025-03-31
# Filters: lead=currentUser, startDate >= 2025-01-01, startDate <= 2025-03-31

# Search + filters
linear-create project list --search "API" --team backend --all-leads
# Filters: search="API", team=backend (no lead filter)
```

---

## Output Format Specifications

### Table Format (Default)

```
ID           Title                          Status      Team           Lead                 Preview
-----------------------------------------------------------------------------------------------------------------------
bf2e1a8a9b   Mobile App Redesign            Started     Mobile         Alice Johnson        Complete redesign of iOS and Android apps with...
a9c3d4e5f6   API v2 Migration               Planned     Backend        Bob Smith            Migrate all endpoints to v2 spec with improved...
c1d2e3f4g5   Customer Dashboard             Completed   Frontend       Carol Davis          New dashboard for customer analytics and repor...

Total: 3 projects
```

**Columns:**
- ID (12 chars, truncated)
- Title (30 chars, truncated with ellipsis)
- Status (12 chars)
- Team (15 chars)
- Lead (20 chars)
- Preview (60 chars, description preferred over content)

**Preview Logic:**
1. Use `description` if it exists
2. Fallback to `content` if no description
3. Strip markdown syntax (`#`, `*`, `_`, `` ` ``, `~`)
4. Replace newlines with spaces
5. Collapse multiple spaces
6. Truncate to 60 chars with `...` suffix

---

### JSON Format

```bash
linear-create project list --format json
```

```json
[
  {
    "id": "bf2e1a8a9b",
    "name": "Mobile App Redesign",
    "description": "Complete redesign of iOS and Android apps",
    "content": "# Mobile App Redesign\n\n...",
    "icon": "Smartphone",
    "color": "#4ECDC4",
    "state": "started",
    "priority": 1,
    "status": {
      "id": "status_xxx",
      "name": "In Progress",
      "type": "started"
    },
    "lead": {
      "id": "user_xxx",
      "name": "Alice Johnson",
      "email": "alice@company.com"
    },
    "team": {
      "id": "team_xxx",
      "name": "Mobile",
      "key": "MOB"
    },
    "initiative": {
      "id": "initiative_xxx",
      "name": "Q1 2025 Goals"
    },
    "labels": [
      { "id": "label_xxx", "name": "urgent", "color": "#FF0000" }
    ],
    "members": [
      { "id": "user_xxx", "name": "Alice Johnson", "email": "alice@company.com" },
      { "id": "user_yyy", "name": "Bob Smith", "email": "bob@company.com" }
    ],
    "startDate": "2025-01-15",
    "targetDate": "2025-03-31",
    "url": "https://linear.app/company/project/mobile-app-redesign",
    "createdAt": "2025-01-10T08:00:00.000Z",
    "updatedAt": "2025-01-20T14:30:00.000Z"
  }
]
```

---

### TSV Format

```bash
linear-create project list --format tsv
```

```tsv
ID	Title	Status	Team	Lead	Preview
bf2e1a8a9b	Mobile App Redesign	In Progress	Mobile	Alice Johnson	Complete redesign of iOS and Android apps with...
a9c3d4e5f6	API v2 Migration	Planned	Backend	Bob Smith	Migrate all endpoints to v2 spec with improved...
c1d2e3f4g5	Customer Dashboard	Completed	Frontend	Carol Davis	New dashboard for customer analytics and repor...
```

---

### Interactive Mode (Ink UI)

```bash
linear-create project list --interactive
# or
linear-create project list -I
```

**Display:**
```
Projects (3)

Mobile App Redesign (bf2e1a8a...)
Status: In Progress | Team: Mobile | Lead: Alice Johnson
Complete redesign of iOS and Android apps with...

API v2 Migration (a9c3d4e5...)
Status: Planned | Team: Backend | Lead: Bob Smith
Migrate all endpoints to v2 spec with improved...

Customer Dashboard (c1d2e3f4...)
Status: Completed | Team: Frontend | Lead: Carol Davis
New dashboard for customer analytics and repor...
```

---

## Testing Strategy

### Test Script Structure

**Location:** `tests/scripts/test-project-list.sh`

**Test Categories:**

1. **Default Behavior (5 tests)**
   - List with no flags (default filters)
   - List with no config defaults
   - List with config defaults set
   - List when current user has no projects
   - List when current user has many projects

2. **Override Flags (6 tests)**
   - `--all-leads` (show all leads)
   - `--all-teams` (show all teams)
   - `--all-initiatives` (show all initiatives)
   - `--all-leads --all-teams` (combination)
   - `--all-leads --all-teams --all-initiatives` (all overrides)
   - Explicit `--lead` override (not current user)

3. **Individual Filters (10 tests)**
   - `--team <id>`
   - `--initiative <id>`
   - `--status <id>`
   - `--priority <number>`
   - `--lead <id>`
   - `--member <id>` (single)
   - `--member <id1>,<id2>` (multiple)
   - `--label <id>` (single)
   - `--label <id1>,<id2>` (multiple)
   - `--search <query>`

4. **Date Range Filters (4 tests)**
   - `--start-after <date>`
   - `--start-before <date>`
   - `--target-after <date>`
   - `--target-before <date>`

5. **Filter Combinations (8 tests)**
   - Team + status + priority
   - Lead + member + label
   - Search + team + status
   - Date ranges + team
   - Complex: all filters combined
   - Override + explicit filters
   - Alias resolution for all entities
   - Multiple aliases in single command

6. **Output Formats (4 tests)**
   - Default (table)
   - `--format json`
   - `--format tsv`
   - `--interactive` (manual only)

7. **Edge Cases (3 tests)**
   - No projects found
   - Invalid filter values
   - Empty result with filters

**Total:** ~40 test cases

---

### Sample Test Cases

```bash
#!/bin/bash
# tests/scripts/test-project-list.sh

set -e

CLI="node dist/index.js"
TIMESTAMP=$(date +%s)

# ========================================
# Test 1: Default behavior (no flags)
# ========================================
echo "Test 1: List projects with default filters (lead=me, default team/initiative)"
$CLI project list
echo "✅ Test 1 passed"

# ========================================
# Test 2: Override all defaults
# ========================================
echo "Test 2: List ALL projects (no filters)"
$CLI project list --all-leads --all-teams --all-initiatives
echo "✅ Test 2 passed"

# ========================================
# Test 3: Explicit lead filter
# ========================================
echo "Test 3: List projects led by specific user"
$CLI project list --lead alice@company.com
echo "✅ Test 3 passed"

# ========================================
# Test 4: Team + status filter
# ========================================
echo "Test 4: Filter by team and status"
$CLI project list --team backend --status started
echo "✅ Test 4 passed"

# ========================================
# Test 5: JSON output
# ========================================
echo "Test 5: JSON output format"
OUTPUT=$($CLI project list --format json --all-leads --all-teams)
# Validate JSON structure
echo "$OUTPUT" | jq '.[0].id' > /dev/null
echo "✅ Test 5 passed"

# ========================================
# Test 6: TSV output
# ========================================
echo "Test 6: TSV output format"
$CLI project list --format tsv --all-teams | grep -q "^ID"
echo "✅ Test 6 passed"

# ========================================
# Test 7: Date range filters
# ========================================
echo "Test 7: Date range filters"
$CLI project list --start-after 2025-01-01 --target-before 2025-12-31
echo "✅ Test 7 passed"

# ========================================
# Test 8: Search filter
# ========================================
echo "Test 8: Search filter"
$CLI project list --search "API" --all-teams --all-leads
echo "✅ Test 8 passed"

# ... [Continue with remaining 32 tests]

echo ""
echo "========================================="
echo "All 40 tests passed! ✅"
echo "========================================="
```

---

## Verification Checklist

### Automated Verification

- [ ] `npm run build` succeeds
- [ ] `npm run typecheck` passes with no errors
- [ ] `npm run lint` passes with no new errors
- [ ] `tests/scripts/test-project-list.sh` passes all ~40 test cases

### Manual Verification

- [ ] **Default behavior works correctly**
  - [ ] With no flags, shows projects I lead in default team/initiative
  - [ ] With no config, shows projects I lead (no team/initiative filter)
  - [ ] With config defaults set, applies them correctly

- [ ] **Override flags work correctly**
  - [ ] `--all-leads` shows projects with any lead
  - [ ] `--all-teams` shows projects from all teams
  - [ ] `--all-initiatives` shows projects from all initiatives
  - [ ] Combinations work (e.g., `--all-leads --all-teams`)

- [ ] **Explicit filters work correctly**
  - [ ] `--team` filters by team
  - [ ] `--initiative` filters by initiative
  - [ ] `--status` filters by status
  - [ ] `--priority` filters by priority
  - [ ] `--lead` filters by lead (overrides default)
  - [ ] `--member` filters by member (single and multiple)
  - [ ] `--label` filters by label (single and multiple)
  - [ ] `--search` searches in name/description/content

- [ ] **Date range filters work correctly**
  - [ ] `--start-after` filters correctly
  - [ ] `--start-before` filters correctly
  - [ ] `--target-after` filters correctly
  - [ ] `--target-before` filters correctly
  - [ ] Combinations work (e.g., `--start-after` + `--start-before`)

- [ ] **Output formats work correctly**
  - [ ] Table format displays aligned columns
  - [ ] JSON format produces valid JSON
  - [ ] TSV format produces tab-separated values
  - [ ] Interactive mode displays correctly with Ink UI

- [ ] **Content preview works correctly**
  - [ ] Description is preferred over content
  - [ ] Markdown syntax is stripped
  - [ ] Newlines are replaced with spaces
  - [ ] Truncation at 60 chars works
  - [ ] Empty descriptions/content handled gracefully

- [ ] **Alias resolution works**
  - [ ] Team aliases resolve correctly
  - [ ] Initiative aliases resolve correctly
  - [ ] Status aliases resolve correctly
  - [ ] Member aliases resolve correctly
  - [ ] Label aliases resolve correctly

- [ ] **Error handling works**
  - [ ] Invalid filter values show helpful errors
  - [ ] No results shows appropriate message
  - [ ] API errors are handled gracefully

---

## CLI Registration

**Location:** `src/cli.ts`

**Add to project command group:**

```typescript
import { listProjectsCommand } from './commands/project/list.js';

// ... existing imports ...

// Project commands
const projectCommand = program.command('project').description('Manage projects');
createProjectCommand(projectCommand);
updateProjectCommand(projectCommand);
viewProjectCommand(projectCommand);
addMilestonesCommand(projectCommand);
listProjectsCommand(projectCommand);  // <-- ADD THIS
```

---

## Documentation Updates

**Location:** `README.md`

**Add section: "Project List & Search"**

```markdown
### Project List & Search

List and search projects with smart defaults and extensive filtering.

#### Basic Usage

```bash
# Smart defaults: projects I lead in my default team/initiative
linear-create project list

# Search projects
linear-create project list --search "API"

# Filter by team and status
linear-create project list --team backend --status started
```

#### Smart Defaults

By default, `project list` filters by:
- **Lead:** Current user (you)
- **Team:** `config.defaultTeam` (if configured)
- **Initiative:** `config.defaultInitiative` (if configured)

**Result:** Shows projects where **you are the lead**, in your default team/initiative.

#### Override Flags

Use these flags to bypass smart defaults:

- `--all-leads`: Show projects with any lead (not just you)
- `--all-teams`: Show projects from all teams
- `--all-initiatives`: Show projects from all initiatives

```bash
# Show ALL projects (no filters)
linear-create project list --all-leads --all-teams --all-initiatives

# Show all projects in my default team (any lead)
linear-create project list --all-leads
```

#### Filter Options

**Core Filters:**
- `-t, --team <id>`: Filter by team
- `-i, --initiative <id>`: Filter by initiative
- `-s, --status <id>`: Filter by project status
- `-p, --priority <number>`: Filter by priority (0-4)
- `-l, --lead <id>`: Filter by project lead
- `-m, --member <id>`: Filter by member (comma-separated for multiple)
- `--label <id>`: Filter by label (comma-separated for multiple)
- `--search <query>`: Search in name, description, or content

**Date Range Filters:**
- `--start-after <date>`: Projects starting after date (YYYY-MM-DD)
- `--start-before <date>`: Projects starting before date (YYYY-MM-DD)
- `--target-after <date>`: Projects targeting after date (YYYY-MM-DD)
- `--target-before <date>`: Projects targeting before date (YYYY-MM-DD)

**Output Formats:**
- `-f, --format <type>`: Output format (table, json, tsv) - default: table
- `-I, --interactive`: Interactive mode with Ink UI
- `-w, --web`: Open in web browser (TODO: not yet implemented)

#### Examples

```bash
# Projects I lead in backend team, started status
linear-create project list --team backend --status started

# Projects led by Alice in any team
linear-create project list --lead alice@company.com --all-teams

# Projects with Bob as a member
linear-create project list --member bob

# Projects starting in Q1 2025
linear-create project list --start-after 2025-01-01 --start-before 2025-03-31

# Search for "API" projects in backend team (any lead)
linear-create project list --search "API" --team backend --all-leads

# JSON output for scripting
linear-create project list --format json --all-teams --all-leads

# TSV output for data processing
linear-create project list --format tsv > projects.tsv

# Interactive mode
linear-create project list -I
```

#### Output Formats

**Table (default):**
```
ID           Title                          Status      Team           Lead                 Preview
-----------------------------------------------------------------------------------------------------------------------
bf2e1a8a9b   Mobile App Redesign            Started     Mobile         Alice Johnson        Complete redesign of iOS...
```

**JSON:**
```json
[
  {
    "id": "bf2e1a8a9b",
    "name": "Mobile App Redesign",
    "status": { "name": "In Progress" },
    "team": { "name": "Mobile" },
    "lead": { "name": "Alice Johnson" }
  }
]
```

**TSV:**
```
ID	Title	Status	Team	Lead	Preview
bf2e1a8a9b	Mobile App Redesign	In Progress	Mobile	Alice Johnson	Complete redesign...
```
```

---

## Risk Assessment

### Low Risk ✅
- Type definitions (new interfaces, no breaking changes)
- Helper functions (buildDefaultFilters, formatContentPreview)
- Test script creation

### Medium Risk ⚠️
- Enhancing `getAllProjects()` - changes existing function signature
  - **Mitigation:** Keep backward compatibility by making `filters` parameter optional
  - **Testing:** Test both old and new usage patterns

- Complex GraphQL filters - may not work with Linear API as expected
  - **Mitigation:** Test incrementally, start with simple filters
  - **Fallback:** Client-side filtering if API doesn't support certain filters

### High Risk 🚨
- None identified

---

## Dependencies

### External Dependencies
- ✅ Linear SDK: `@linear/sdk` (already installed)
- ✅ Ink: `ink` (already installed)
- ✅ Commander: `commander` (already installed)

### Internal Dependencies
- ✅ `src/lib/aliases.ts` - alias resolution
- ✅ `src/lib/config.ts` - config defaults
- ✅ `src/lib/linear-client.ts` - API client
- ✅ `src/lib/output.ts` - output utilities
- ✅ `src/lib/types.ts` - type definitions

---

## Estimated Timeline

### Phase 1: API & Type Foundation (~2-3 hours)
- [ ] M20-T04: Expand types (30 min)
- [ ] M20-T05: Enhance `getAllProjects()` (1 hour)
- [ ] M20-T06: Verify `getCurrentUser()` (15 min)
- [ ] M20-T07: Build default filter builder (30 min)
- [ ] M20-T08: Implement override logic (30 min)
- [ ] Testing and debugging (30 min)

### Phase 2: List Command Implementation (~3-4 hours)
- [ ] M20-T09: Create list.tsx structure (30 min)
- [ ] M20-T10: Implement filter flags (30 min)
- [ ] M20-T11: Implement date range filters (30 min)
- [ ] M20-T12: Implement table formatter (1 hour)
- [ ] M20-T13: Implement content preview truncation (30 min)
- [ ] M20-T14: Implement Ink UI component (30 min)
- [ ] M20-T15: Implement JSON/TSV output (30 min)
- [ ] Testing and debugging (1 hour)

### Phase 3: Testing & Documentation (~2-3 hours)
- [ ] M20-TS01: Create test script (1 hour)
- [ ] M20-TS02-TS03: Test all scenarios (1 hour)
- [ ] M20-TS04: Update README.md (30 min)
- [ ] Manual verification (30 min)

**Total:** 7-10 hours

---

## Success Criteria

### Functional Requirements ✅
- [ ] Command `project list` exists and runs without errors
- [ ] Smart defaults work (lead=me, config team/initiative)
- [ ] Override flags work (`--all-leads`, `--all-teams`, `--all-initiatives`)
- [ ] All filter options work (team, initiative, status, priority, lead, member, label, search)
- [ ] Date range filters work (start/target after/before)
- [ ] All output formats work (table, JSON, TSV, interactive)
- [ ] Content preview displays correctly (description > content, 60 chars, stripped markdown)
- [ ] Alias resolution works for all entity types

### Technical Requirements ✅
- [ ] TypeScript compiles with no errors (`npm run typecheck`)
- [ ] Linter passes with no new errors (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Test script passes all ~40 test cases
- [ ] No breaking changes to existing code

### Documentation Requirements ✅
- [ ] README.md updated with list command documentation
- [ ] All examples work as documented
- [ ] MILESTONES.md updated with task completion status

---

## Rollback Plan

If critical issues arise during implementation:

1. **Phase 1 Issues (API/Types):**
   - Revert changes to `linear-client.ts` and `types.ts`
   - Keep using simple `getAllProjects(teamId)` signature

2. **Phase 2 Issues (List Command):**
   - Remove `list.tsx` file
   - Remove registration from `cli.ts`
   - No impact on existing commands

3. **Phase 3 Issues (Testing):**
   - Fix tests or mark as known issues
   - Document limitations

**Recovery Time:** < 30 minutes (isolated changes, no breaking changes)

---

## Post-Implementation Tasks

### Immediate (M20 Release)
- [ ] Update MILESTONES.md - mark M20 tasks as [x] completed
- [ ] Update package.json version to 0.19.0
- [ ] Update src/cli.ts version to 0.19.0
- [ ] Commit changes: `git commit -m "feat: M20 - Project list & search (v0.19.0)"`
- [ ] Tag release: `git tag v0.19.0`
- [ ] Push: `git push && git push --tags`
- [ ] Move M20 to archive/MILESTONES_02.md (if needed)

### Future Enhancements (M21+)
- [ ] M21: `project delete` command
- [ ] M21: `project sync-aliases` command
- [ ] Web browser mode (`--web` flag implementation)
- [ ] Export to CSV format
- [ ] Pagination for large result sets
- [ ] Sorting options (by name, date, priority, etc.)

---

## Appendix A: Reference Commands

### workflow-states list command
**File:** `src/commands/workflow-states/list.tsx`

Key patterns to copy:
- Function registration: `export function listWorkflowStates(program: Command)`
- JSON/TSV handling before Ink rendering
- Filter options with config defaults
- Ink component structure

### issue-labels list command
**File:** `src/commands/issue-labels/list.tsx`

Key patterns to copy:
- Similar structure to workflow-states
- Color handling utilities
- Output formatting

---

## Appendix B: Linear GraphQL Filter Syntax

Based on Linear SDK documentation and existing code:

```typescript
// Example: Complex filter
const filter = {
  and: [
    { team: { id: { eq: 'team_xxx' } } },
    { lead: { id: { eq: 'user_xxx' } } },
    { priority: { eq: 1 } },
    { or: [
      { name: { containsIgnoreCase: 'API' } },
      { description: { containsIgnoreCase: 'API' } }
    ]}
  ]
};

// Supported operators:
// - eq: equals
// - neq: not equals
// - in: in array
// - nin: not in array
// - contains: contains substring
// - containsIgnoreCase: case-insensitive contains
// - startsWith: starts with
// - endsWith: ends with
// - gt, gte, lt, lte: comparison operators
// - null: is null
// - and, or: logical operators
```

---

## Appendix C: Common Pitfalls & Solutions

### Pitfall 1: GraphQL Filter Not Working
**Symptom:** Filter doesn't reduce results as expected

**Solution:**
1. Test filter in Linear GraphQL playground first
2. Check Linear SDK documentation for filter syntax
3. Fallback to client-side filtering if needed

### Pitfall 2: Async Data Fetching in Ink
**Symptom:** Component renders before data loads

**Solution:**
- Use `React.useEffect()` with empty dependency array
- Show loading state while fetching
- Handle errors gracefully

### Pitfall 3: Alias Resolution Fails
**Symptom:** Alias not found or incorrect entity type

**Solution:**
- Verify entity type matches alias type
- Check alias file exists and is valid JSON
- Add error handling for missing aliases

### Pitfall 4: Date Filter Format Issues
**Symptom:** Date filters don't work or throw errors

**Solution:**
- Validate date format (YYYY-MM-DD) before sending to API
- Convert to ISO string if needed
- Add user-friendly error messages

---

## Questions for Clarification

None at this time. All requirements are clear from M20 milestone definition.

---

## Approval & Sign-off

**Implementation Plan Version:** 1.0
**Date:** 2025-10-27
**Status:** Ready for implementation

**Approved by:** [Pending]

---

**End of M20 Implementation Plan**
