# Project Dependency Management Implementation Plan (M23)

## Executive Summary

Add comprehensive project dependency management to linear-create CLI, supporting directional dependencies between projects with anchor semantics. Implementation follows a **hybrid approach**: dependency flags on create/update commands + dedicated dependency management subcommands.

**Key Principle**: Uses Linear's actual `ProjectRelation` API with `type: "dependency"` and anchor-based semantics (`start`, `end`).

---

## User Requirements (from clarifying questions)

✅ **Command Pattern**: Both approaches combined (flags + dedicated subcommands)
✅ **Removal Pattern**: Add/Remove flags (like links pattern)
✅ **List Display**: Show in default output + filter by dependency status
✅ **Milestone Support**: **NOT SUPPORTED** - Project-level dependencies only
✅ **Display Format**: Use ⬅️ (Depends On) and ➡️ (Blocks) emoji with text labels
✅ **Naming Convention**: CLI flags use kebab-case (`--depends-on`), API uses camelCase

---

## ✅ VERIFIED: API Behavior (Issue #1 Resolution)

**CONFIRMED via testing (test-api-bidirectional-simple.js):**

### API Schema Reality
```typescript
// CORRECT API Schema (verified):
type: "dependency"              // ONLY valid value (NOT "blocks" or "blockedBy")
anchorType: "start" | "end"     // Which part of source project (NOT "project" or "milestone")
relatedAnchorType: "start" | "end"  // Which part of target project
```

### Bi-directional Behavior
- ❌ **NOT automatic**: Creating A→B dependency does NOT create B→A inverse
- Each direction requires separate `ProjectRelation` entry
- No risk of duplicate automatic relations

### Anchor Semantics
- `end → start`: Project A's end date depends on Project B's start (most common)
- `start → end`: Project A's start depends on Project B's end
- `start → start`: Both starts are linked
- `end → end`: Both ends are linked

---

## Linear GraphQL API Foundation

### ProjectRelation Type
```graphql
type ProjectRelation {
  id: ID!
  type: String!                   # Always "dependency" (ONLY valid value)
  project: Project!               # Source project
  relatedProject: Project!        # Target project
  anchorType: String!             # "start" or "end" (source anchor)
  relatedAnchorType: String!      # "start" or "end" (target anchor)
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

### Available Mutations
- `projectRelationCreate(input: ProjectRelationCreateInput!): ProjectRelationPayload!`
- `projectRelationUpdate(id: String!, input: ProjectRelationUpdateInput!): ProjectRelationPayload!`
- `projectRelationDelete(id: String!): DeletePayload!`

### Available Queries
- `project.relations(): ProjectRelationConnection!`
- `projectRelation(id: String!): ProjectRelation!`

---

## CLI Design

### Simple Mode (Recommended for 80% of use cases)

Users specify dependency direction with sensible anchor defaults:

```bash
# "I depend on X" - My end waits for X's start (end→start)
--depends-on <projects>

# "I block X" - X's end waits for my start (start→end)
--blocks <projects>
```

**Default Anchor Mappings:**
- `--depends-on` → `anchorType: "end"`, `relatedAnchorType: "start"`
- `--blocks` → `anchorType: "start"`, `relatedAnchorType: "end"`

### Advanced Mode (Full anchor control)

Power users can specify exact anchor points:

```bash
--dependency "<project>:<my-anchor>:<their-anchor>"

# Examples:
--dependency "api-v2:end:start"    # My end → their start (same as --depends-on)
--dependency "api-v2:start:end"    # My start → their end
--dependency "api-v2:end:end"      # My end → their end
--dependency "api-v2:start:start"  # My start → their start
```

**Validation:**
- `<my-anchor>` and `<their-anchor>` must be `start` or `end`
- Format: exactly 3 colon-separated parts

---

## Implementation Plan

### Phase 1: Core Library Extensions

#### 1.1 Update Type Definitions (`src/lib/types.ts`)

**Add ProjectRelation interface:**
```typescript
export interface ProjectRelation {
  id: string;
  type: 'dependency';  // Only valid value
  project: { id: string; name: string; };
  relatedProject: { id: string; name: string; };
  anchorType: 'start' | 'end';
  relatedAnchorType: 'start' | 'end';
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRelationCreateInput {
  id?: string;
  type: 'dependency';  // Always this value
  projectId: string;
  relatedProjectId: string;
  anchorType: 'start' | 'end';
  relatedAnchorType: 'start' | 'end';
}

export interface DependencyDirection {
  // Parsed dependency with direction
  relatedProjectId: string;
  anchorType: 'start' | 'end';
  relatedAnchorType: 'start' | 'end';
}
```

**Update ProjectListItem interface** (add dependency counts):
```typescript
export interface ProjectListItem {
  // ... existing fields ...
  dependsOnCount?: number;    // Count of "depends on" relations
  blocksCount?: number;       // Count of "blocks" relations
}
```

#### 1.2 Add GraphQL Fragments (`src/lib/linear-client.ts`)

**Add inline GraphQL fragments to query strings in linear-client.ts functions:**
```graphql
fragment ProjectRelationFields on ProjectRelation {
  id
  type
  anchorType
  relatedAnchorType
  createdAt
  updatedAt
  project {
    id
    name
  }
  relatedProject {
    id
    name
  }
}
```

**Note:** This fragment should be included inline within GraphQL query strings, not as a separate exported constant.

#### 1.3 Create Linear API Client Functions (`src/lib/linear-client.ts`)

**New functions:**
```typescript
// Create a project relation
export async function createProjectRelation(
  client: LinearClient,
  input: ProjectRelationCreateInput
): Promise<ProjectRelation>

// Delete a project relation
export async function deleteProjectRelation(
  client: LinearClient,
  relationId: string
): Promise<boolean>

// Fetch project relations for a project
export async function getProjectRelations(
  client: LinearClient,
  projectId: string
): Promise<ProjectRelation[]>
```

**Implementation Notes:**
- Use `.relations()` method on Project object (verified via testing)
- Always set `type: "dependency"` (only valid value)
- Validate anchor types are `"start"` or `"end"`

#### 1.4 Add Dependency Parsing Helper (`src/lib/parsers.ts`)

**New functions:**
```typescript
/**
 * Parse comma-separated project IDs/aliases for dependencies
 * Accepts: "proj1,proj2" OR "proj1, proj2" (whitespace trimmed)
 * Returns resolved project IDs
 * Throws error if resolution fails
 */
export function resolveDependencyProjects(input: string): string[]

/**
 * Parse advanced dependency syntax: "project:anchor:relatedAnchor"
 * Example: "api-v2:end:start"
 * Returns: { relatedProjectId, anchorType, relatedAnchorType }
 * Throws error if invalid format or invalid anchors
 */
export function parseAdvancedDependency(input: string): DependencyDirection

/**
 * Validate anchor type is "start" or "end"
 * Throws error if invalid
 */
export function validateAnchorType(anchor: string): 'start' | 'end'
```

**Implementation:**
- `resolveDependencyProjects()`: Use `resolveAlias('project', ...)` for each comma-separated value
- Trim whitespace around commas: `input.split(',').map(s => s.trim())`
- `parseAdvancedDependency()`: Split by `:`, validate 3 parts, resolve project, validate anchors

#### 1.5 Add Dependency Direction Helper (`src/lib/parsers.ts`)

**New function:**
```typescript
/**
 * Determine if a relation represents "depends on" vs "blocks"
 * from the perspective of a given project
 *
 * "Depends on" = My end waits for their start (standard dependency)
 * "Blocks" = Their end waits for my start (reverse dependency)
 */
export function getRelationDirection(
  relation: ProjectRelation,
  fromProjectId: string
): 'depends-on' | 'blocks'
```

**Logic:**
```typescript
// If I am the source project with end→start anchor = "depends on"
if (relation.project.id === fromProjectId &&
    relation.anchorType === 'end' &&
    relation.relatedAnchorType === 'start') {
  return 'depends-on';
}
// If I am the target project and they have start anchor = "blocks" (they block me)
// This actually shows as "depends on" from my perspective
// ... implement full logic based on anchor semantics
```

---

### Phase 2: Extend Existing Commands

#### 2.1 Update `project create` (`src/commands/project/create.tsx`)

**Add new CLI options:**
```typescript
.option('--depends-on <projects>', 'Projects this depends on (comma-separated IDs/aliases)')
.option('--blocks <projects>', 'Projects this blocks (comma-separated IDs/aliases)')
.option('--dependency <spec>', 'Advanced: "project:myAnchor:theirAnchor" (repeatable)', collect, [])
```

**Implementation steps:**
1. Parse `--depends-on`, `--blocks`, and `--dependency` options
2. Resolve project IDs/aliases using `resolveDependencyProjects()` and `parseAdvancedDependency()`
3. After successful project creation, create ProjectRelations:
   - For `--depends-on`: `{ type: 'dependency', anchorType: 'end', relatedAnchorType: 'start' }`
   - For `--blocks`: Create reverse relation on target project
   - For `--dependency`: Use parsed anchor values
4. Display confirmation with dependency counts

**Error Handling:**
- If dependency creation fails after project creation succeeds:
  - Continue attempting remaining dependencies (don't stop on first failure)
  - Collect all failures with error messages
  - Display summary:
    ```
    Project created successfully: <name> (<id>)
    ✅ Added X of Y dependencies
    ❌ Failed dependencies:
       • <project-name>: <error-reason>
       • <project-name>: <error-reason>
    Fix with: linear-create project dependencies add <project> --depends-on <failed-projects>
    ```
  - Exit code: 1 (partial failure)

**Self-Referential Validation:**
- Check in command handler BEFORE calling `createProjectRelation()`
- Error message: "Cannot create self-referential dependency: project cannot depend on itself"
- Validation: `if (sourceProjectId === targetProjectId) throw error`

**Example usage:**
```bash
# Simple mode
linear-create project create \
  --title "API v2" \
  --team backend \
  --depends-on "infrastructure,database-migration" \
  --blocks "frontend-redesign"

# Advanced mode
linear-create project create \
  --title "API v2" \
  --team backend \
  --dependency "infra:end:end" \
  --dependency "frontend:start:start"
```

#### 2.2 Update `project update` (`src/commands/project/update.ts`)

**Add new CLI options:**
```typescript
.option('--depends-on <projects>', 'Add "depends on" relations (comma-separated)')
.option('--blocks <projects>', 'Add "blocks" relations (comma-separated)')
.option('--dependency <spec>', 'Advanced: "project:myAnchor:theirAnchor" (repeatable)', collect, [])
.option('--remove-depends-on <projects>', 'Remove "depends on" relations (comma-separated)')
.option('--remove-blocks <projects>', 'Remove "blocks" relations (comma-separated)')
.option('--remove-dependency <project>', 'Remove all dependencies with project (repeatable)', collect, [])
```

**Implementation pattern (matches link management in current update.ts:365-391):**

1. **Add dependencies** (if `--depends-on`, `--blocks`, or `--dependency` provided):
   - Resolve project IDs with `resolveDependencyProjects()` or `parseAdvancedDependency()`
   - Create new ProjectRelation entries
   - Track changes for output

2. **Remove dependencies** (if remove flags provided):
   - Parse inputs with `resolveDependencyProjects()` to get target project IDs
   - Fetch existing ProjectRelations for the project with `getProjectRelations()`
   - Filter by direction and target project IDs
   - Delete matching relations
   - Track changes for output

**Example usage:**
```bash
# Add dependencies
linear-create project update api-v2 --depends-on new-service

# Remove dependencies
linear-create project update api-v2 --remove-depends-on old-service

# Add and remove simultaneously
linear-create project update api-v2 \
  --depends-on new-service \
  --remove-depends-on old-service
```

#### 2.3 Update `project view` (`src/commands/project/view.ts`)

**Add dependency section to output:**

```
Dependencies:
  ⬅️  Depends On (2):
    • Infrastructure Upgrade (proj_ghi789)
      [end → start] My end waits for their start
    • Database Migration (proj_abc123)
      [end → end] My end waits for their end

  ➡️  Blocks (1):
    • Frontend Redesign (proj_def456)
      [start → end] Their end waits for my start
```

**Empty state:**
```
Dependencies: None
```

**Implementation:**
- Fetch `project.relations()` in the existing GraphQL query
- Parse each relation to determine direction using `getRelationDirection()`
- Group by direction ("depends-on" vs "blocks")
- Display in formatted sections with emoji indicators
- Show anchor semantics for clarity

---

### Phase 3: New Dependency Management Commands

Create new command group: `project dependencies` with subcommands.

#### 3.1 Command Structure

```
project dependencies (alias: deps)
├── add        - Add dependency relations
├── remove     - Remove dependency relations
├── list       - List all dependencies
└── clear      - Remove all dependencies (with confirmation)
```

**File structure:**
```
src/commands/project/dependencies/
├── add.ts      - Add depends-on/blocks relations
├── remove.ts   - Remove specific relations
├── list.ts     - Display all dependencies
└── clear.ts    - Clear all dependencies (with --yes confirmation)
```

#### 3.2 `project dependencies add`

**File:** `src/commands/project/dependencies/add.ts`

**Signature:**
```typescript
export function addProjectDependencies(program: Command)
```

**CLI options:**
```bash
linear-create project dependencies add <project> \
  [--depends-on <projects>] \
  [--blocks <projects>] \
  [--dependency <spec>]
```

**Required:** At least one of `--depends-on`, `--blocks`, or `--dependency`

**Implementation:**
1. Resolve source project ID/alias
2. Parse and resolve target project IDs/aliases with `resolveDependencyProjects()` or `parseAdvancedDependency()`
3. Validate no self-referential dependencies
4. Create ProjectRelation entries
5. Display summary with created relations

**Self-Referential Validation:**
- Check: `if (sourceProjectId === targetProjectId)` for each target
- Error: "Cannot create self-referential dependency: project cannot depend on itself"

**Duplicate Handling:**
- Do NOT check for duplicates client-side
- Pass request to Linear API
- If API returns duplicate error: Display "Dependency already exists: <source> → <target>"
- If API accepts (idempotent): Display success

#### 3.3 `project dependencies remove`

**File:** `src/commands/project/dependencies/remove.ts`

**CLI options:**
```bash
# Remove by project and direction
linear-create project dependencies remove <project> \
  [--depends-on <projects>] \
  [--blocks <projects>]

# Remove by relation ID
linear-create project dependencies remove <project> \
  --relation-id <id>

# Remove all with specific project
linear-create project dependencies remove <project> \
  --with <project>
```

**Implementation:**
1. Resolve source project ID/alias
2. Fetch all ProjectRelations for the project
3. Filter based on flags:
   - `--depends-on`: Filter "depends on" direction + target projects
   - `--blocks`: Filter "blocks" direction + target projects
   - `--relation-id`: Filter by relation ID
   - `--with`: Filter any relation involving target project
4. Delete matching relations
5. Display summary

#### 3.4 `project dependencies list`

**File:** `src/commands/project/dependencies/list.ts`

**CLI options:**
```bash
# List all dependencies for a project
linear-create project dependencies list <project>

# List with direction filter
linear-create project dependencies list <project> --direction depends-on
linear-create project dependencies list <project> --direction blocks
```

**Output format:**
```
Dependencies for API v2 (proj_123abc):

⬅️  Depends On (2 projects):
  • Infrastructure Upgrade (proj_ghi789) [rel_003]
    [end → start] My end waits for their start
  • Database Migration (proj_abc123) [rel_004]
    [end → end] My end waits for their end

➡️  Blocks (1 project):
  • Frontend Redesign (proj_def456) [rel_002]
    [start → end] Their end waits for my start
```

**Empty state:**
```
Dependencies for API v2 (proj_123abc): None
```

**Note:** Relation IDs are displayed in list command (for management) but not in `project view` (for readability).

#### 3.5 `project dependencies clear`

**File:** `src/commands/project/dependencies/clear.ts`

**CLI options:**
```bash
# Clear all dependencies (requires confirmation)
linear-create project dependencies clear <project>

# With auto-confirmation
linear-create project dependencies clear <project> --yes

# Clear only specific direction
linear-create project dependencies clear <project> --direction depends-on
linear-create project dependencies clear <project> --direction blocks
```

**Implementation:**
1. Fetch all ProjectRelations
2. Filter by `--direction` if specified
3. Prompt for confirmation (unless `--yes`):
   ```
   ⚠️  Warning: This will delete X dependencies for project <name>
   Are you sure? (y/N)
   ```
4. Delete all (or filtered)
5. Display summary:
   ```
   ✅ Deleted X dependencies from <project-name>
   ```

---

### Phase 4: Enhance `project list` Command

**File:** `src/commands/project/list.tsx`

#### 4.1 Update GraphQL Query

Add dependency data to the query:
```graphql
fragment ProjectListFields on Project {
  # ... existing fields ...
  relations {
    nodes {
      id
      type
      anchorType
      relatedAnchorType
      project {
        id
      }
      relatedProject {
        id
      }
    }
  }
}
```

#### 4.2 Calculate Dependency Counts

In processing logic:
```typescript
const dependsOnCount = project.relations.nodes.filter(rel => {
  // Count relations where I am source with end→start OR target where they block me
  return getRelationDirection(rel, project.id) === 'depends-on';
}).length;

const blocksCount = project.relations.nodes.filter(rel => {
  return getRelationDirection(rel, project.id) === 'blocks';
}).length;
```

#### 4.3 Add Dependency Column to Table Output

**Update table columns:**
```
| Name | Status | Priority | Lead | Dates | Dependencies    | Labels |
|------|--------|----------|------|-------|-----------------|--------|
| API  | In Pr. | High     | John | ...   | ⬅️  Depends 2   | backend|
|      |        |          |      |       | ➡️  Blocks 1    |        |
```

**Format:**
- ⬅️ = Depends On (this project depends on N others)
- ➡️ = Blocks (this project blocks N others)
- Display format: `⬅️ Depends X` and/or `➡️ Blocks Y` on separate lines
- If no dependencies: `-`

#### 4.4 Add Filter Options

**New flags:**
```typescript
.option('--has-dependencies', 'Show only projects with any dependencies')
.option('--no-dependencies', 'Show only projects without dependencies')
.option('--depends-on-others', 'Show only projects that depend on other projects')
.option('--blocks-others', 'Show only projects that block other projects')
```

**Filtering logic** (applied after fetching):
```typescript
// Validate mutually exclusive flags
if (options.hasDependencies && options.noDependencies) {
  throw new Error('Conflicting filters: cannot use --has-dependencies and --no-dependencies together');
}
if (options.dependsOnOthers && options.blocksOthers) {
  // Note: NOT mutually exclusive - a project can both depend on AND block others
}

// Apply filters
if (options.hasDependencies) {
  projects = projects.filter(p => p.dependsOnCount + p.blocksCount > 0);
}
if (options.noDependencies) {
  projects = projects.filter(p => p.dependsOnCount + p.blocksCount === 0);
}
if (options.dependsOnOthers) {
  projects = projects.filter(p => p.dependsOnCount > 0);
}
if (options.blocksOthers) {
  projects = projects.filter(p => p.blocksCount > 0);
}
```

---

### Phase 5: Alias Support

**Update:** `src/lib/aliases.ts`

**Verify alias entity type support:**
```typescript
export type AliasEntityType =
  | 'initiative'
  | 'team'
  | 'project'  // ← Already supported for dependencies
  | 'project-status'
  // ... other types
```

**Usage in dependency commands:**
```typescript
// In all dependency functions
const resolvedProjectId = resolveAlias('project', projectIdOrAlias);
const targetIds = resolveDependencyProjects(dependsOnInput);  // Handles comma-separated with aliases
```

**Note:** Project aliases are already supported in the codebase, no changes needed to aliases.ts.

---

### Phase 6: CLI Registration

**File:** `src/cli.ts`

**Registration structure:**
```typescript
const project = cli.command('project')...;

// ... existing subcommands ...

// New dependencies subcommand group
const projectDeps = project.command('dependencies')
  .alias('deps')  // Allows "project deps add" shorthand
  .description('Manage project dependencies (depends-on/blocks relations)');

addProjectDependencies(projectDeps);
removeProjectDependencies(projectDeps);
listProjectDependencies(projectDeps);
clearProjectDependencies(projectDeps);
```

---

## Testing Strategy

### Integration Tests

**New test file:** `tests/scripts/test-project-dependencies.sh`

**Test coverage (30+ test cases):**

1. **Create with dependencies:**
   - Create project with `--depends-on`
   - Create project with `--blocks`
   - Create project with both
   - Create with `--dependency` advanced syntax
   - Create with aliases vs IDs

2. **Update add dependencies:**
   - Add depends-on via `--depends-on`
   - Add blocks via `--blocks`
   - Add both simultaneously
   - Add to project with existing dependencies
   - Add with advanced syntax

3. **Update remove dependencies:**
   - Remove depends-on via `--remove-depends-on`
   - Remove blocks via `--remove-blocks`
   - Remove specific vs all
   - Remove non-existent (error handling)

4. **Dedicated commands:**
   - `dependencies add` with both directions
   - `dependencies remove` by project ID
   - `dependencies remove` by relation ID
   - `dependencies remove --with` to remove all with project
   - `dependencies list` output format
   - `dependencies list --direction` filter
   - `dependencies clear` with confirmation
   - `dependencies clear` with `--yes`
   - `dependencies clear --direction` filter

5. **View command:**
   - View project with dependencies
   - View project without dependencies
   - View shows correct anchor semantics

6. **List command:**
   - List with dependency counts in table
   - Filter `--has-dependencies`
   - Filter `--no-dependencies`
   - Filter `--depends-on-others`
   - Filter `--blocks-others`

7. **Error cases:**
   - Invalid project ID
   - Self-referential dependency (project depending on itself)
   - Duplicate dependency creation (graceful handling)
   - Delete non-existent relation
   - Invalid anchor types in advanced syntax
   - Conflicting filter flags (--has-dependencies + --no-dependencies)

8. **Advanced syntax:**
   - Parse "project:end:start"
   - Parse "project:start:end"
   - Parse "project:end:end"
   - Parse "project:start:start"
   - Invalid format errors
   - Invalid anchor values

---

## Milestone Tasks

### [ ] Milestone M23: Project Dependency Management (v0.22.0)

**Note:** Version number may be adjusted based on actual release sequence (current version is v0.19.x).

**Goal:** Add comprehensive project dependency tracking with directional semantics.

**Requirements:**
- Support adding/removing "depends on" and "blocks" relations
- Integrate with existing create/update commands (flags)
- Provide dedicated dependency management subcommands
- Display dependencies in view and list commands
- Filter projects by dependency status
- Project-level only (no milestone support)

**Out of Scope:**
- Milestone-to-milestone dependencies (**NOT SUPPORTED** - removed from roadmap)
- Dependency validation/cycle detection (Linear API responsibility)
- Gantt chart visualization
- Dependency automation/triggers

### Tests & Tasks

**Phase 1: Core Library**
- [ ] [M23-T01] Add ProjectRelation interface to types.ts with correct schema
- [ ] [M23-T02] Add DependencyDirection interface to types.ts
- [ ] [M23-T03] Add ProjectRelation GraphQL fragment to linear-client.ts
- [ ] [M23-T04] Implement createProjectRelation() in linear-client.ts
- [ ] [M23-T05] Implement deleteProjectRelation() in linear-client.ts
- [ ] [M23-T06] Implement getProjectRelations() in linear-client.ts
- [ ] [M23-T07] Add resolveDependencyProjects() to parsers.ts
- [ ] [M23-T08] Add parseAdvancedDependency() to parsers.ts
- [ ] [M23-T09] Add validateAnchorType() to parsers.ts
- [ ] [M23-T10] Add getRelationDirection() to parsers.ts
- [ ] [M23-TS01] Test library functions with real API

**Phase 2: Extend Existing Commands**
- [ ] [M23-T11] Add --depends-on, --blocks, --dependency flags to project create
- [ ] [M23-T12] Implement dependency creation in create command with error handling
- [ ] [M23-T13] Add self-referential validation to create command
- [ ] [M23-T14] Add dependency flags to project update (add & remove)
- [ ] [M23-T15] Implement dependency add/remove in update command
- [ ] [M23-T16] Add dependency display to project view command
- [ ] [M23-T17] Handle empty state in view command
- [ ] [M23-TS02] Test create command with dependencies
- [ ] [M23-TS03] Test create command error handling (partial failures)
- [ ] [M23-TS04] Test create self-referential validation
- [ ] [M23-TS05] Test update command add dependencies
- [ ] [M23-TS06] Test update command remove dependencies
- [ ] [M23-TS07] Test view command displays dependencies
- [ ] [M23-TS08] Test advanced dependency syntax

**Phase 3: New Dependency Commands**
- [ ] [M23-T18] Create project/dependencies/ directory structure
- [ ] [M23-T19] Implement dependencies add command
- [ ] [M23-T20] Add self-referential validation to add command
- [ ] [M23-T21] Implement dependencies remove command with --with flag
- [ ] [M23-T22] Implement dependencies list command
- [ ] [M23-T23] Implement dependencies clear command with confirmation
- [ ] [M23-T24] Register dependencies subcommands in cli.ts with 'deps' alias
- [ ] [M23-TS09] Test dependencies add command
- [ ] [M23-TS10] Test dependencies add self-referential validation
- [ ] [M23-TS11] Test dependencies add duplicate handling
- [ ] [M23-TS12] Test dependencies remove command
- [ ] [M23-TS13] Test dependencies list command
- [ ] [M23-TS14] Test dependencies clear command

**Phase 4: Enhance Project List**
- [ ] [M23-T25] Update project list GraphQL query for dependency data
- [ ] [M23-T26] Add dependency column to table output with ⬅️/➡️ emoji
- [ ] [M23-T27] Implement --has-dependencies filter
- [ ] [M23-T28] Implement --no-dependencies filter
- [ ] [M23-T29] Implement --depends-on-others filter
- [ ] [M23-T30] Implement --blocks-others filter
- [ ] [M23-T31] Add conflicting filter validation
- [ ] [M23-TS15] Test list command with dependency display
- [ ] [M23-TS16] Test list command filters (all 4 filter flags)
- [ ] [M23-TS17] Test conflicting filter validation

**Phase 5: Alias Support & CLI Registration**
- [ ] [M23-T32] Verify project alias support in aliases.ts
- [ ] [M23-T33] Register dependencies subcommand group in cli.ts

**Phase 6: Integration Testing**
- [ ] [M23-TS18] Create test-project-dependencies.sh script
- [ ] [M23-TS19] Test all 30+ test cases
- [ ] [M23-TS20] Test error handling and edge cases
- [ ] [M23-TS21] Test advanced syntax parsing
- [ ] [M23-TS22] Generate cleanup script for test projects

**Phase 7: Documentation & Release**
- [ ] [M23-T34] Update README.md with dependency examples
- [ ] [M23-T35] Update CLAUDE.md with dependency patterns
- [ ] [M23-T36] Add inline code documentation
- [ ] [M23-T37] Update package.json version
- [ ] [M23-T38] Update cli.ts version

### Deliverable

```bash
# Create project with dependencies (simple mode)
linear-create project create \
  --title "API Redesign" \
  --team backend \
  --depends-on "infrastructure,database-migration" \
  --blocks "frontend-redesign"

# Create with advanced syntax
linear-create project create \
  --title "API Redesign" \
  --team backend \
  --dependency "infra:end:end" \
  --dependency "frontend:start:start"

# Update dependencies
linear-create project update api-redesign \
  --depends-on "new-service" \
  --remove-depends-on "old-service"

# Manage dependencies with dedicated commands
linear-create project dependencies add api-redesign \
  --depends-on "project-a,project-b"

linear-create project dependencies list api-redesign
# Output:
# Dependencies for API Redesign (proj_123abc):
#
# ⬅️  Depends On (2 projects):
#   • Infrastructure Upgrade (proj_ghi789) [rel_003]
#     [end → start] My end waits for their start
#   • Database Migration (proj_abc123) [rel_004]
#     [end → end] My end waits for their end
#
# ➡️  Blocks (1 project):
#   • Frontend Redesign (proj_def456) [rel_002]
#     [start → end] Their end waits for my start

linear-create project dependencies remove api-redesign \
  --depends-on "project-a"

linear-create project dependencies clear api-redesign --yes

# View with dependencies
linear-create project view api-redesign
# Shows dependencies section with emoji indicators

# List with dependency info (4 filter flags)
linear-create project list --has-dependencies
linear-create project list --no-dependencies
linear-create project list --depends-on-others
linear-create project list --blocks-others
```

### Automated Verification
- `npm run build` succeeds
- `npm run typecheck` passes with no errors
- `npm run lint` passes with no new errors
- `tests/scripts/test-project-dependencies.sh` passes all test cases
- Existing test suites still pass (regression check)

### Manual Verification
- Create project with dependencies via flags
- Update project to add/remove dependencies
- Use dedicated dependency subcommands
- View project shows dependency info with correct anchors
- List projects shows dependency counts
- Filter projects by dependency status
- Aliases work for project references
- Error handling for invalid projects
- Self-referential validation works
- Duplicate handling is graceful
- Advanced syntax parsing works
- Conflicting filter validation works

---

## Command Reference Summary

### Flags on Existing Commands

**project create:**
- `--depends-on <projects>` - Projects this depends on (end→start)
- `--blocks <projects>` - Projects this blocks (creates reverse)
- `--dependency <spec>` - Advanced: "project:myAnchor:theirAnchor"

**project update:**
- `--depends-on <projects>` - Add "depends on" relations
- `--blocks <projects>` - Add "blocks" relations
- `--dependency <spec>` - Advanced syntax
- `--remove-depends-on <projects>` - Remove "depends on" relations
- `--remove-blocks <projects>` - Remove "blocks" relations
- `--remove-dependency <project>` - Remove all with project

**project list:**
- `--has-dependencies` - Filter: has any dependencies
- `--no-dependencies` - Filter: no dependencies
- `--depends-on-others` - Filter: has "depends on" relations
- `--blocks-others` - Filter: has "blocks" relations

### New Dedicated Commands

**project dependencies add** (alias: `project deps add`):
```bash
linear-create project dependencies add <project> \
  [--depends-on <projects>] \
  [--blocks <projects>] \
  [--dependency <spec>]

# Using alias shorthand:
linear-create project deps add <project> --depends-on proj1,proj2
```

**project dependencies remove** (alias: `project deps remove`):
```bash
linear-create project dependencies remove <project> \
  [--depends-on <projects>] \
  [--blocks <projects>] \
  [--relation-id <id>] \
  [--with <project>]

# Using alias shorthand:
linear-create project deps remove <project> --depends-on proj1
```

**project dependencies list** (alias: `project deps list`):
```bash
linear-create project dependencies list <project> \
  [--direction depends-on|blocks]

# Using alias shorthand:
linear-create project deps list <project>
```

**project dependencies clear** (alias: `project deps clear`):
```bash
linear-create project dependencies clear <project> \
  [--direction depends-on|blocks] \
  [--yes]

# Using alias shorthand:
linear-create project deps clear <project> --yes
```

**Note:** All commands support the `deps` alias for brevity.

---

## Consistency with Existing Patterns

✅ **Multi-value relationships**: Comma-separated IDs (like labels, members)
✅ **Whitespace handling**: Trim spaces around commas (`"proj1, proj2"` accepted)
✅ **Alias resolution**: Uses `resolveAlias('project', ...)` pattern
✅ **Add/Remove pattern**: Matches link management (`--link` / `--remove-link`)
✅ **Dedicated subcommands**: Similar to `project add-milestones`
✅ **CLI registration**: Function-based registration pattern
✅ **List filtering**: Similar to existing filter patterns
✅ **Testing strategy**: Integration tests with cleanup scripts
✅ **Error handling**: Validation before API calls, helpful messages
✅ **Type definitions**: Extends existing types.ts structure

---

## Risk Assessment

**Low Risk:**
- Linear API fully supports ProjectRelation (create/update/delete)
- API behavior verified via testing (no automatic inverse relations)
- Pattern matches existing relationship management (links, labels)
- No schema changes needed

**Medium Risk:**
- Anchor semantics may confuse users
- More complex than simple "blocks/blocked-by" mental model
- Dependency direction calculation requires careful logic

**Mitigation:**
- Simple mode hides anchor complexity for 80% of users
- Advanced mode for power users who need full control
- Clear documentation with examples
- Comprehensive testing with integration test suite
- Follow existing patterns strictly

---

## Estimated Effort

**Phase 1 (Core Library):** 3-4 hours
**Phase 2 (Extend Commands):** 4-5 hours
**Phase 3 (New Commands):** 4-5 hours
**Phase 4 (List Enhancement):** 2-3 hours
**Phase 5 (Testing):** 5-7 hours
**Phase 6 (Documentation):** 1-2 hours

**Total:** 19-26 hours of development + testing

---

## Notes for AI Assistants

When implementing this feature:

1. **API Schema (VERIFIED):**
   - Use `type: "dependency"` (ONLY valid value, NOT "blocks" or "blockedBy")
   - Use `anchorType` and `relatedAnchorType`: `"start"` or `"end"` (NOT "project")
   - No milestone support (completely removed from scope)

2. **Bi-directional Relations (VERIFIED):**
   - Creating A→B does NOT automatically create B→A
   - Each direction requires separate ProjectRelation entry
   - No risk of duplicate automatic relations

3. **Anchor Semantics:**
   - `end → start`: Most common (finish-to-start dependency)
   - `start → end`: Start-to-finish dependency
   - `start → start`: Both starts linked
   - `end → end`: Both ends linked

4. **CLI Flags:**
   - Use kebab-case: `--depends-on`, `--blocks`
   - Direction values: `"depends-on"`, `"blocks"` (kebab-case for consistency)
   - API uses camelCase internally (map in code)

5. **Dependency Direction Logic:**
   - "Depends on" = I wait for them (standard dependency)
   - "Blocks" = They wait for me (reverse dependency)
   - Implement `getRelationDirection()` carefully based on anchor semantics

6. **Error Handling:**
   - Validate projects exist before creating relations
   - Check for self-referential dependencies (project cannot depend on itself) in command handlers
   - Handle duplicate relations gracefully (let API reject, display friendly message)
   - Provide helpful error messages with project names, not just IDs

7. **Whitespace Handling:**
   - Accept both `"proj1,proj2"` and `"proj1, proj2"`
   - Trim whitespace: `input.split(',').map(s => s.trim())`

8. **Filter Validation:**
   - Prevent conflicting filters: `--has-dependencies` vs `--no-dependencies`
   - Error message: "Conflicting filters: cannot use X and Y together"
   - Note: `--depends-on-others` and `--blocks-others` are NOT mutually exclusive

9. **GraphQL Query Pattern:**
   ```graphql
   query GetProjectDependencies($projectId: String!) {
     project(id: $projectId) {
       id
       name
       relations {
         nodes {
           id
           type
           anchorType
           relatedAnchorType
           relatedProject {
             id
             name
           }
           project {
             id
             name
           }
         }
       }
     }
   }
   ```

10. **Testing Checklist:**
    - Test with real Linear API (not mocks)
    - Create test projects with `TEST_<timestamp>_` prefix
    - Generate cleanup script
    - Test both success and error paths
    - Verify alias resolution works
    - Test advanced syntax parsing
    - Test combination of flags (add + remove simultaneously)
    - Test self-referential validation
    - Test duplicate handling
    - Test conflicting filter validation

11. **Code Location Reference:**
    - Types: `src/lib/types.ts`
    - API client: `src/lib/linear-client.ts`
    - Parsers: `src/lib/parsers.ts`
    - Aliases: `src/lib/aliases.ts`
    - Create command: `src/commands/project/create.tsx`
    - Update command: `src/commands/project/update.ts`
    - View command: `src/commands/project/view.ts`
    - List command: `src/commands/project/list.tsx`
    - New commands: `src/commands/project/dependencies/*.ts`
    - CLI registration: `src/cli.ts`

---

**END OF PLAN**
