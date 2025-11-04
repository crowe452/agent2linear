# Issue Commands Implementation Plan (v0.15.0)

> **Note**: This document provides detailed specifications for issue command implementation. For task tracking, progress status, and milestone details, see **MILESTONES.md M15** and sub-milestones M15.1 through M15.6.

## Overview
Implement 4 core issue commands following project command patterns. Commands are **non-interactive by default**. Interactive UIs (via `-I`) will be introduced in the final release phase (M15.6 / v0.15.0).

### Implementation Approach
This feature is delivered through a **phased alpha release strategy** (see MILESTONES.md M15 for complete details):
- **v0.15.0-alpha.1** (M15.1): Infrastructure & Foundation
- **v0.15.0-alpha.2** (M15.2): Issue View Command
- **v0.15.0-alpha.3** (M15.3): Issue Create Command
- **v0.15.0-alpha.4** (M15.4): Issue Update Command
- **v0.15.0-alpha.5** (M15.5): Issue List Command
- **v0.15.0** (M15.6): Interactive Enhancements + Final Release

---

## Commands to Implement

### 1. `issue create`
**File:** `src/commands/issue/create.ts`
**Default:** Non-interactive command-line execution

#### Required Options
- `--title <string>` - Issue title
- `--team <id|alias>` - Team ID/alias (required unless `defaultTeam` is configured)

#### Content Options
- `--description <string>` - Issue description (markdown)
- `--description-file <path>` - Read description from file (mutually exclusive with --description)

#### Priority & Estimation
- `--priority <0-4>` - 0=None, 1=Urgent, 2=High, 3=Normal, 4=Low
- `--estimate <number>` - Complexity estimate

#### Workflow
- `--state <id|alias>` - Workflow state ID/alias (team-specific)

#### Dates
- `--due-date <YYYY-MM-DD>` - Due date in ISO format

#### Assignment Options
- `--assignee <id|alias|email>` - Assign to user (default: auto-assign to creator)
- `--no-assignee` - Create unassigned (override auto-assignment)
- `--subscribers <id|alias|email,...>` - Comma-separated subscribers

#### Organization
- `--project <id|alias|name>` - Associate with project (uses `defaultProject` if set in config)
- `--cycle <id>` - Associate with cycle
- `--parent <identifier>` - Parent issue (for sub-issues) - ENG-123 or UUID
- `--labels <id|alias,...>` - Comma-separated issue label IDs/aliases

#### Template
- `--template <id|alias>` - Apply issue template

#### Modes
- `-w, --web` - Open created issue in browser after creation
- *(Future phase)* `-I, --interactive` - Launch interactive creation UI (Ink component)

#### Examples
```bash
# Minimal (uses defaultTeam from config)
issue create --title "Fix login bug"

# Standard non-interactive
issue create --title "Add OAuth" --team backend --priority 2

# With description file
issue create --title "API Redesign" --team eng --description-file ./spec.md --priority 1

# Full featured
issue create \
  --title "Implement auth" \
  --team backend \
  --description "Add OAuth2 support" \
  --priority 2 \
  --estimate 8 \
  --state in-progress \
  --assignee john@acme.com \
  --labels "feature,security" \
  --project "Q1 Goals" \
  --due-date 2025-02-15

# Sub-issue
issue create --title "Update tests" --team eng --parent ENG-123
```

_Interactive creation mode (`-I`) will be added in M15.6 (v0.15.0 final release)._

**→ See MILESTONES.md M15.3 for detailed implementation tasks**

---

### 2. `issue update`
**File:** `src/commands/issue/update.ts`
**Default:** Non-interactive command-line execution

#### Arguments
- `<identifier>` - Issue identifier (ENG-123 format or UUID, no aliases)

#### All Update Options (explicit list)

##### Basic Fields
- `--title <string>` - Update title
- `--description <string>` - Update description
- `--description-file <path>` - Read description from file

##### Priority & Estimation
- `--priority <0-4>` - Update priority (0=None, 1=Urgent, 2=High, 3=Normal, 4=Low)
- `--estimate <number>` - Update estimate
- `--no-estimate` - Clear estimate

##### Workflow
- `--state <id|alias>` - Update workflow state

##### Dates
- `--due-date <YYYY-MM-DD>` - Update due date
- `--no-due-date` - Clear due date

##### Assignment
- `--assignee <id|alias|email>` - Change assignee
- `--no-assignee` - Remove assignee (make unassigned)

##### Team & Organization
- `--team <id|alias>` - Move to different team
- `--project <id|alias|name>` - Change project
- `--no-project` - Remove from project
- `--cycle <id>` - Change cycle
- `--no-cycle` - Remove from cycle

##### Parent Relationship
- `--parent <identifier>` - Change parent (make sub-issue or change parent)
- `--no-parent` - Remove parent (make root issue)

##### Labels (three modes)
- `--labels <id|alias,...>` - Replace all labels with specified list
- `--add-labels <id|alias,...>` - Add labels to existing
- `--remove-labels <id|alias,...>` - Remove specific labels

##### Subscribers
- `--subscribers <id|alias|email,...>` - Replace all subscribers
- `--add-subscribers <id|alias|email,...>` - Add subscribers
- `--remove-subscribers <id|alias|email,...>` - Remove subscribers

##### Lifecycle
- `--trash` - Move to trash
- `--untrash` - Restore from trash

##### Modes
- `-w, --web` - Open in browser after update
- *(Future phase)* `-I, --interactive` - Launch interactive update UI

#### Examples
```bash
# Update single field
issue update ENG-123 --state done

# Multiple fields
issue update ENG-123 --priority 1 --assignee jane@acme.com --due-date 2025-02-01

# Label management
issue update ENG-123 --add-labels "urgent,bug"
issue update ENG-123 --remove-labels "feature"
issue update ENG-123 --labels "bug,urgent"  # Replace all

# Clear fields
issue update ENG-123 --no-assignee --no-due-date --no-estimate

# Move between teams/projects
issue update ENG-123 --team frontend --project "Mobile App"

# Sub-issue management
issue update ENG-123 --parent ENG-100  # Make sub-issue
issue update ENG-123 --no-parent        # Make root issue

# Trash/restore
issue update ENG-123 --trash
issue update ENG-123 --untrash

# Update and open
issue update ENG-123 --priority 1 --web
```

**→ See MILESTONES.md M15.4 for detailed implementation tasks**

---

### 3. `issue view`
**File:** `src/commands/issue/view.ts`
**Default:** Non-interactive terminal output

#### Arguments
- `<identifier>` - Issue identifier (ENG-123 format or UUID)

#### Options
- `-w, --web` - Open in browser instead of terminal view
- *(Future phase)* `-I, --interactive` - Launch interactive viewer UI
- `--show-comments` - Include comments in terminal output
- `--show-history` - Include change history in terminal output
- `--json` - Output raw JSON format

#### Examples
```bash
# View in terminal (default)
issue view ENG-123

# Open in browser
issue view ENG-123 --web
issue view ENG-123 -w

# With additional data
issue view ENG-123 --show-comments --show-history

# JSON output for scripting
issue view ENG-123 --json | jq '.title'
```

**→ See MILESTONES.md M15.2 for detailed implementation tasks**

---

### 4. `issue list`
**File:** `src/commands/issue/list.ts`
**Default:** Non-interactive table output to terminal

#### Default Behavior (when no filters specified)
1. Filter to issues assigned to current user (`assignee: me`)
2. If `defaultTeam` is set in config → filter to that team
3. If `defaultInitiative` is set in config → filter to projects in that initiative
4. Show only active issues (exclude completed/canceled)
5. Limit to 50 results
6. Sort by priority descending

#### Filter Options

##### Primary Filters
- `--team <id|alias>` - Filter by team (overrides defaultTeam)
- `--assignee <id|alias|email>` - Filter by assignee (default: "me", use --all-assignees to override)
- `--all-assignees` - Show issues for all assignees (removes "me" default)
- `--project <id|alias|name>` - Filter by project
- `--initiative <id|alias>` - Filter by initiative (via project membership)

##### Workflow Filters
- `--state <id|alias>` - Filter by specific workflow state
- `--priority <0-4>` - Filter by priority level
- `--label <id|alias>` - Filter by label (repeatable: `--label bug --label urgent`)

##### Relationship Filters
- `--parent <identifier>` - Show sub-issues of parent (ENG-123)
- `--no-parent` - Only show root issues (exclude sub-issues)
- `--cycle <id>` - Filter by cycle

##### Status Filters
- Default: Active issues only
- `--active` - Explicitly show only active issues
- `--completed` - Only completed issues
- `--canceled` - Only canceled issues
- `--all-states` - Include all states (active + completed + canceled)
- `--archived` - Include archived issues

##### Search
- `--search <query>` - Full-text search in title and description

##### Output Options
- `-f, --format <type>` - Output format: `table` (default), `tsv`, `json`
- `--limit <number>` - Max results (default: 50)
- `--sort <field>` - Sort by: `priority` (default), `created`, `updated`, `due`
- `--order <direction>` - Sort order: `desc` (default), `asc`

##### Modes
- `-w, --web` - Open Linear in browser with applied filters
- *(Future phase)* `-I, --interactive` - Launch interactive browser/selector UI

#### Examples
```bash
# Default: My issues in default team/initiative, active only
issue list

# Override defaults
issue list --all-assignees  # All users
issue list --team backend   # Different team (overrides defaultTeam)

# Specific filters
issue list --team eng --state in-progress
issue list --assignee john@acme.com --priority 1
issue list --project "Q1 Goals" --active

# Search
issue list --search "authentication"

# Label filtering (multiple)
issue list --label bug --label urgent

# Sub-issues
issue list --parent ENG-123       # All children of ENG-123
issue list --no-parent            # Only root issues

# Status filtering
issue list --completed            # Only completed
issue list --all-states           # All statuses

# Output formats
issue list --format json | jq '.[] | {id, title}'
issue list --format tsv | cut -f1,2

# Sorting
issue list --sort due --order asc
issue list --sort updated --order desc --limit 100

# Open in Linear web
issue list --team backend --web
```

_Interactive listing mode (`-I`) will be added in M15.6 (v0.15.0 final release)._

**→ See MILESTONES.md M15.5 for detailed implementation tasks**

---

## Configuration Changes

### Add to `config.ts` and config commands

#### New Config Keys
- `defaultTeam` - Default team ID/alias for issue creation and listing (reuse if exists)
- `defaultProject` - Default project for new issues (optional)

#### Usage
```bash
# Set defaults
config set defaultTeam backend
config set defaultProject "Q1 Goals"

# Now these work:
issue create --title "Fix bug"  # Uses defaultTeam
issue list                       # Filters to defaultTeam + assignee=me
```

**→ See MILESTONES.md M15.1 for config implementation tasks**

---

## Key Design Decisions

1. **Non-Interactive by Default:** All commands execute immediately; interactive UIs are deferred to later phases for every command
2. **No Issue Aliases:** Only support Linear identifiers (ENG-123) and UUIDs
3. **Auto-Assignment:** Issues auto-assign to creator unless `--no-assignee` specified
4. **List Defaults:**
   - Assigned to me
   - Default team (if `defaultTeam` in config)
   - Projects in default initiative (if `defaultInitiative` in config)
   - Active only (not completed/canceled)
5. **All Options Explicit:** Every option documented and implemented
6. **Consistent Patterns:** Follow project command conventions

---

## Implementation Structure

### New Files
- `src/lib/issue-resolver.ts` - Resolve ENG-123 → UUID (M15.1)
- `src/commands/issue/view.ts` - View command (M15.2)
- `src/commands/issue/create.ts` - Create command non-interactive (M15.3)
- `src/commands/issue/update.ts` - Update command (M15.4)
- `src/commands/issue/list.ts` - List command non-interactive (M15.5)
- Interactive `.tsx` wrappers for create/update/view/list (M15.6)

### Modified Files
- `src/cli.ts` - Register issue commands
- `src/lib/config.ts` - Add defaultTeam, defaultProject (if not exists)
- `src/lib/types.ts` - Add issue-related types

### Test Files
- `tests/scripts/test-issue-view.sh` - 10 test cases (M15.2)
- `tests/scripts/test-issue-create.sh` - 40 test cases (M15.3)
- `tests/scripts/test-issue-update.sh` - 44 test cases (M15.4)
- `tests/scripts/test-issue-list.sh` - 29 test cases (M15.5)
- **Total: 123 test cases**

---

## Milestone Entry (MILESTONES.md)

> **Note**: The M15 milestone uses a **two-level structure** for better tracking:
> - **M15 (v0.15.0)**: Meta-milestone with high-level tasks (M15-T01 through M15-T08)
> - **M15.1-M15.6**: Detailed implementation phases with granular tasks

The high-level tasks defined in this document map to detailed sub-milestone tasks:

```markdown
## [ ] Milestone M15: Issue Commands - Core CRUD (v0.15.0)
**Goal**: Implement comprehensive issue management with create, update, view, and list commands

### Overview
Delivered through six phased alpha releases (M15.1-M15.6)

### High-Level Task Mapping
- M15-T01 (Issue resolver) → M15.1-T05 through M15.1-T09
- M15-T02 (Config updates) → M15.1-T10 through M15.1-T11
- M15-TS02 (Config tests) → M15.1-TS05
- M15-T03 (Create command) → M15.3-T01 through M15.3-T25
- M15-TS03 (Create tests) → M15.3-TS01 through M15.3-TS40
- M15-T04 (Update command) → M15.4-T01 through M15.4-T39
- M15-TS04 (Update tests) → M15.4-TS01 through M15.4-TS44
- M15-T05 (View command) → M15.2-T01 through M15.2-T14
- M15-TS05 (View tests) → M15.2-TS01 through M15.2-TS10
- M15-T06 (List command) → M15.5-T01 through M15.5-T36
- M15-TS06 (List tests) → M15.5-TS01 through M15.5-TS29
- M15-T07 (CLI registration) → M15.2-T02, M15.3-T02, M15.4-T02, M15.5-T02
- M15-T08 (Verification) → Verification steps in each phase

### Deliverable
```bash
# Create with defaults
$ issue create --title "Fix auth bug"
✅ Created issue ENG-456: Fix auth bug (assigned to you)

# Update multiple fields
$ issue update ENG-456 --priority 1 --state in-progress --add-labels urgent

# View
$ issue view ENG-456

# List with defaults (me + defaultTeam + active)
$ issue list
ENG-456  Fix auth bug       Urgent  In Progress
ENG-123  API redesign       High    Backlog
```

### Verification
- [ ] All alpha releases (v0.15.0-alpha.1 through v0.15.0-alpha.5) completed
- [ ] All 123 test cases pass
- [ ] `npm run build` succeeds
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Interactive modes work in v0.15.0 final (M15.6)
- [ ] Web modes work (-w flag)
- [ ] Config defaults apply correctly (defaultTeam, defaultProject)
```

**For complete implementation details, see MILESTONES.md M15 and sub-milestones M15.1-M15.6**

---

## Issue Schema Reference (from linear_schema.md)

### Required Fields (for creation)
- **teamId** (String!) - The team the issue belongs to
- **title** (String) - The issue title (required in practice)

### Optional Simple Fields

#### Text Fields
- `description` (String) - Issue description in markdown
- `descriptionData` (JSON) - [Internal] Prosemirror document format

#### Numeric Fields
- `priority` (Int) - 0=None, 1=Urgent, 2=High, 3=Normal, 4=Low
- `estimate` (Int) - Complexity estimate
- `sortOrder` (Float) - Position relative to other issues
- `prioritySortOrder` (Float) - Position when ordered by priority
- `subIssueSortOrder` (Float) - Position in parent's sub-issue list

#### Date Fields
- `dueDate` (TimelessDate) - When the issue is due
- `createdAt` (DateTime) - Creation date (for imports)
- `snoozedUntilAt` (DateTime) - Time until issue is snoozed in Triage

#### Boolean Fields
- `trashed` (Boolean) - Whether issue is in trash
- `preserveSortOrderOnCreate` (Boolean) - Preserve custom sort order

### Optional Relationship Fields

#### User References
- `assigneeId` (String) - User assigned to the issue
- `delegateId` (String) - Agent user delegated to work on issue
- `subscriberIds` ([String!]) - Users subscribing to the issue
- `snoozedById` (String) - User who snoozed the issue
- `createAsUser` (String) - OAuth: Create as specific user

#### Entity References
- `parentId` (String) - Parent issue for sub-issues
- `cycleId` (String) - Associated cycle
- `projectId` (String) - Associated project
- `projectMilestoneId` (String) - Associated project milestone
- `stateId` (String) - Workflow state (status)
- `lastAppliedTemplateId` (String) - Last template applied
- `labelIds` ([String!]) - Issue labels
- `addedLabelIds` ([String!]) - Labels to add (update only)
- `removedLabelIds` ([String!]) - Labels to remove (update only)

#### Comment References
- `referenceCommentId` (String) - Referenced comment
- `sourceCommentId` (String) - Comment issue was created from
- `sourcePullRequestCommentId` (String) - [Internal] PR comment source

#### SLA Fields (Internal/Advanced)
- `slaBreachesAt` (DateTime) - When SLA will breach
- `slaStartedAt` (DateTime) - When SLA began
- `slaType` (SLADayCountType) - Calendar vs business days

### Read-Only/Computed Fields
- `id` (ID!) - Unique identifier
- `number` (Float!) - Issue number
- `identifier` (String!) - Human-readable (e.g., ENG-123)
- `url` (String!) - Issue URL
- `branchName` (String!) - Suggested branch name
- `createdAt`, `updatedAt`, `archivedAt` (DateTime) - Timestamps
- `startedAt`, `completedAt`, `canceledAt` (DateTime) - State transitions
- `team`, `cycle`, `project`, `projectMilestone` (Objects) - Full entities
- `creator`, `assignee`, `state` (Objects) - User/state objects
- `labels`, `children`, `parent`, `comments`, `history` - Collections
- `previousIdentifiers` - Array of old identifiers
- `customerTicketCount` - Count of customer attachments
- `reactionData`, `activitySummary` - Engagement data

---

## Project Command Patterns Analysis

### Argument vs Options Structure

**Pattern:**
- **Arguments**: Used for required identifiers when updating/viewing (e.g., `<name-or-id>`)
- **Options**: All creation fields and optional update fields use flags

**Examples:**
```bash
# Create: All as options
project create --title "X" --team Y

# Update: Identifier as argument, changes as options
project update <name-or-id> --status X --priority 2

# View: Identifier as argument
project view <name-or-id>
```

### Alias Resolution Pattern

**Supported Entity Types:**
- `team` - Team aliases
- `initiative` - Initiative aliases
- `project-status` - Project status aliases
- `member` / `user` - Member aliases (with email/name lookup)
- `project-label` - Project label aliases
- `issue-label` - Issue label aliases
- `workflow-state` - Workflow state aliases (for issues)
- `project` - Project aliases
- `project-template` - Template aliases

**Resolution Implementation:**
```typescript
// Always resolve before API calls
const resolvedId = resolveAlias(entityType, idOrAlias);
if (resolvedId !== idOrAlias) {
  console.log(`📎 Resolved alias "${idOrAlias}" to ${resolvedId}`);
}
```

**Member Resolution (Special Case):**
- Supports ID, alias, or email lookup
- Uses `resolveMemberIdentifier()` function
- Smart resolution: tries alias → ID → email lookup

### Multi-Value Field Handling

**Pattern:**
- Comma-separated strings in CLI
- Parsed with `parseCommaSeparated()` helper
- Each value resolved individually through aliases
- Collected into array for API call

**Example:**
```typescript
// Input: --labels "bug,feature,urgent"
const rawLabels = parseCommaSeparated(options.labels);
const labelIds = rawLabels.map(id => resolveAlias('issue-label', id));
```

### Content vs Content-File Pattern

**Mutual Exclusivity:**
- `--content` for inline markdown
- `--content-file` for file path
- Cannot use both (validation error)

**Implementation:**
```typescript
if (options.content && options.contentFile) {
  console.error('❌ Error: Cannot use both --content and --content-file');
  process.exit(1);
}

let content = options.content;
if (options.contentFile) {
  content = readFileSync(options.contentFile, 'utf-8');
  console.log(`📄 Read content from: ${options.contentFile}`);
}
```

### Interactive Mode Pattern

_When interactive modes are introduced in a later phase, follow the existing project command approach:_

**Structure:**
1. Check for `--interactive` or `-I` flag
2. If true: Render Ink component (`.tsx` file)
3. If false: Execute non-interactive logic

**File Naming:**
- Interactive commands: `.tsx` extension
- Non-interactive commands: `.ts` extension

**Example:**
```typescript
export async function createCommand(options: CreateOptions) {
  const isInteractive = options.interactive === true;

  if (isInteractive) {
    render(<App options={options} />);
  } else {
    await createNonInteractive(options);
  }
}
```

### Date Handling Pattern

**Format:** ISO 8601 (YYYY-MM-DD)

**Validation:**
```typescript
function validateDateFormat(date: string, fieldName: string): void {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(date)) {
    showError(`Invalid ${fieldName} format`,
               `Date must be in ISO format (YYYY-MM-DD)`);
    process.exit(1);
  }
}
```

---

## Issue-Specific Features to Handle

### 1. Sub-Issues (Parent-Child Relationships)
- Create: `--parent <issue-id>`
- Update: `--parent <issue-id>` (change parent) or `--no-parent` (make root)
- List: `--parent <issue-id>` (list children) or `--no-parent` (only roots)
- View: Show parent and children in output

### 2. Issue Relations (blocked-by, related-to, duplicate-of)
- Phase 3 commands: `issue add-relation`, `issue remove-relation`
- Types: blocks, blocked-by, related-to, duplicate-of

### 3. Issue Labels (vs Project Labels)
- Use `issue-label` alias type
- Support comma-separated multi-value
- `--labels` (replace), `--add-labels`, `--remove-labels` patterns

### 4. Workflow States (Team-Specific)
- Each team has own workflow states
- Resolve via `workflow-state` aliases
- Consider state type in validation (triage, backlog, started, completed, canceled)

### 5. Issue Identifier Resolution
- Support multiple formats:
  - Linear identifier: `ENG-123`, `DESIGN-45`
  - UUID: `issue_abc123...`
  - No custom aliases (per design decision)
- Smart resolver similar to project resolver

---

## Consistency Recommendations

### Argument/Option Naming Conventions

**Follow These Patterns:**

1. **Entity References:** `--<entity>` for singular, `--<entities>` for plural
   ```bash
   --team, --project, --assignee
   --labels, --subscribers  # Plural for arrays
   ```

2. **Dates:** `--<field>-date` format
   ```bash
   --due-date, --start-date, --target-date
   ```

3. **Boolean Flags:** `--<flag>` for true, `--no-<flag>` for false
   ```bash
   --assignee user_123   # Set assignee
   --no-assignee         # Clear assignee
   --trash               # Move to trash
   --untrash             # Restore
   ```

4. **File Input:** `--<field>-file` for file paths
   ```bash
   --description-file ./desc.md
   --content-file ./content.md
   ```

5. **Multi-Value Modifiers:**
   ```bash
   --labels "a,b,c"        # Replace all
   --add-labels "x,y"      # Add to existing
   --remove-labels "z"     # Remove specific
   ```

### Alias Types to Support

**For Issue Commands:**
```typescript
// Primary aliases
'team'           // --team backend
'workflow-state' // --state in-progress
'issue-label'    // --labels bug,urgent
'member'         // --assignee john
'project'        // --project q1-goals
'initiative'     // For list filtering via projects

// Secondary (if implemented)
'cycle'          // --cycle sprint-23
'project-milestone' // --project-milestone m1
'issue-template' // --template bug-report
```

### Project Command Patterns to Adapt

**✅ Keep These Patterns:**

1. **Smart Resolution:** Try alias → ID → name/email
2. **Batch Validation:** Prewarm cache before expensive operations
3. **Member Resolution:** Support ID, alias, and email
4. **Multi-Value Parsing:** `parseCommaSeparated()` helper
5. **Content Handling:** Mutual exclusivity of inline vs file
6. **Error Messages:** Helpful, actionable feedback with examples
7. **Web Mode:** `--web` flag to open in browser
8. **Interactive Mode:** Separate `-I` flag and `.tsx` components
9. **Progress Feedback:** Console logs for resolution steps
10. **Cleanup Scripts:** Generate scripts for test data

**⚠️ Adapt These Patterns:**

1. **Auto-Assignment:** Issues auto-assign to creator (different from projects)
2. **Default Config:** Add `defaultTeam` and `defaultProject` for issues
3. **Resolution Messages:** Adjust language ("project" → "issue")
4. **Validation Order:** Validate team first (required), then related entities
5. **Field Availability:** Some project fields don't exist on issues (e.g., initiative direct association)

**❌ Don't Apply:**

1. **Color/Icon Fields:** Issues don't have visual customization
2. **Milestones:** Issues use `projectMilestone` (different from project milestones array)
3. **Status vs State:** Projects use "status", issues use "state" (workflow states)
4. **Date Resolutions:** Issues don't have `startDateResolution`/`targetDateResolution`

---

## Testing Strategy

### Follow Project Test Patterns

```bash
# tests/scripts/test-issue-create.sh
# Similar structure to test-project-create.sh

TEST_PREFIX="ISSUE_TEST_$(date +%Y%m%d_%H%M%S)"

# Test categories:
1. Basic Creation (title + team)
2. Alias Resolution (team, state, labels, assignee, project)
3. Description Handling (inline vs file)
4. Assignment (assignee, subscribers, auto-assign, no-assignee)
5. Dates & Priority (dueDate, priority, estimate)
6. Organization (project, parent, labels, cycle)
7. Multi-Value Fields (labels, subscribers)
8. Complex Combinations (kitchen sink test)
9. Error Validation (missing required, invalid IDs, mutual exclusivity)
10. Config defaults (defaultTeam, defaultProject)

# Generate cleanup script for test issues
./cleanup-issue-tests.sh
```

### Testing Checklist

- [ ] All alias types resolve correctly
- [ ] Multi-value fields (labels, subscribers) parse properly
- [ ] Description inline vs file mutual exclusivity
- [ ] Date validation (ISO format)
- [ ] Priority validation (0-4 range)
- [ ] Team validation (required field)
- [ ] Member resolution (ID, alias, email)
- [ ] Auto-assignment to creator works
- [ ] --no-assignee prevents auto-assignment
- [ ] defaultTeam from config applies
- [ ] defaultProject from config applies
- [ ] List defaults filter correctly (me + defaultTeam + defaultInitiative + active)
- [ ] Error messages are helpful
- [ ] Interactive modes deferred (no `-I` testing required this milestone)
- [ ] Web mode opens correct URL (-w flag)
- [ ] Generated cleanup scripts work

---

## Implementation Phases

> **Note**: This section describes the phased alpha release strategy. See MILESTONES.md for detailed task breakdowns.

### Meta-Milestone: M15 (v0.15.0)
High-level tracking for all issue command functionality across all phases below.

**→ See MILESTONES.md M15 for high-level task mapping**

### Phase 1.1: Infrastructure (v0.15.0-alpha.1 / M15.1)
- Issue types and interfaces
- Issue identifier resolver (ENG-123 → UUID)
- Config updates (defaultTeam, defaultProject)
- Linear API functions for CRUD operations
- Shared validators and utilities

**→ See MILESTONES.md M15.1 for detailed tasks (9 implementation tasks + 9 test tasks)**

### Phase 1.2: View Command (v0.15.0-alpha.2 / M15.2)
- Terminal display formatting
- JSON output support
- Web browser mode
- Comments and history display
- Identifier resolution integration

**→ See MILESTONES.md M15.2 for detailed tasks (14 implementation tasks + 10 test cases)**

### Phase 1.3: Create Command (v0.15.0-alpha.3 / M15.3)
- Full-featured creation (23+ options)
- Auto-assignment support
- All alias type resolution
- Description file support
- Template application

**→ See MILESTONES.md M15.3 for detailed tasks (25 implementation tasks + 40 test cases)**

### Phase 1.4: Update Command (v0.15.0-alpha.4 / M15.4)
- Comprehensive updates (33+ options)
- Add/remove patterns for labels/subscribers
- Field clearing with --no-* flags
- Parent relationship management
- Team migration with state validation

**→ See MILESTONES.md M15.4 for detailed tasks (39 implementation tasks + 44 test cases)**

### Phase 1.5: List Command (v0.15.0-alpha.5 / M15.5)
- Smart defaults (assignee=me + config defaults)
- Extensive filtering (15+ filter options)
- Multiple output formats (table, JSON, TSV)
- Status filters (active, completed, archived)
- Sorting and limiting

**→ See MILESTONES.md M15.5 for detailed tasks (36 implementation tasks + 29 test cases)**

### Phase 1.6: Interactive Enhancements (v0.15.0 / M15.6) - Final Release
- Add interactive `-I` mode to `issue create`
- Add interactive `-I` mode to `issue update`
- Add interactive `-I` mode to `issue view`
- Add interactive `-I` mode to `issue list`
- Reuse shared resolver/cache logic
- Documentation updates

**→ See MILESTONES.md M15.6 for detailed tasks**

---

### Future Phases (Post-v0.15.0)

### Phase 2: Organization (v0.16.0) - Priority 2
- `issue move` - Move between teams/projects
- `issue archive` - Archive issues
- `issue delete` - Delete issues (with confirmation)

### Phase 3: Relations & Comments (v0.17.0) - Priority 3
- `issue add-relation` - Create issue relations (blocks, related-to, etc.)
- `issue remove-relation` - Remove issue relations
- `issue add-comment` - Add comments to issues
- `issue list-comments` - View issue comments
