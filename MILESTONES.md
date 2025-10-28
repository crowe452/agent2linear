# linear-create Milestones

**Note**: For completed milestones, see archive files:
- M01-M11: [archive/MILESTONES_01.md](archive/MILESTONES_01.md)
- M12-M15: [archive/MILESTONES_02.md](archive/MILESTONES_02.md)

**Legend:**
- `[x]` Completed
- `[-]` In Progress
- `[ ]` Not Started
- `[~]` Won't fix / Invalid / False positive

---

## Backlog (Future Milestones)

### [ ] Milestone M15.5: Issue Interactive Enhancements (v0.15.x)
**Goal**: Ship Ink-powered interactive experiences for all issue commands after the core non-interactive release

#### Requirements
- Add `-I/--interactive` Ink UI for `issue create`, `issue update`, `issue view`, and `issue list`
- Reuse shared resolver/cache logic between interactive and non-interactive flows
- Ensure web/JSON/table modes remain available in non-interactive runs
- Update help text, README, and ISSUE.md to document interactive usage

#### Tasks
- [ ] [M15.5-T01] Create shared interactive form primitives for issues
- [ ] [M15.5-T02] Implement interactive wrapper for `issue create`
- [ ] [M15.5-T03] Implement interactive wrapper for `issue update`
- [ ] [M15.5-T04] Implement interactive wrapper for `issue view`
- [ ] [M15.5-T05] Implement interactive wrapper for `issue list`
- [ ] [M15.5-TS01] Add dedicated interactive test scenarios per command
- [ ] [M15.5-TS02] Update documentation and help output with interactive instructions

#### Verification
- `npm run build` succeeds
- `npm run typecheck` passes
- `npm run lint` passes
- Manual walkthrough confirms interactive parity with non-interactive flows

### [x] Milestone M20: Project List & Search (v0.19.0)
**Goal**: Add comprehensive project listing with intelligent defaults, extensive filtering matching all create/update fields, multiple output formats, and refactor project command structure for consistency

#### Key Design Decisions
- ✅ Single `project list` command with `--search` flag (no separate search command)
- ✅ Smart defaults: auto-filter by config defaults (team, initiative) + projects where current user is **lead**
- ✅ Override flags: `--all-teams`, `--all-initiatives`, `--all-leads` to bypass defaults
- ✅ Comprehensive filters matching all create/update fields (team, initiative, status, priority, lead, member, label, dates)
- ✅ Refactor project commands to match workflow-states/labels pattern
- ❌ `project delete` & `project sync-aliases` - Deferred to M21

#### Field Comparison: Create/Update vs List Filters

| Create/Update Field | List Filter | Notes |
|---------------------|-------------|-------|
| `--team` | `--team` | Filter by team (default from config) |
| `--initiative` | `--initiative` | Filter by initiative (default from config) |
| `--status` | `--status` | Filter by status |
| `--priority` | `--priority` | Filter by priority level |
| `--lead` | `--lead` | Filter by project lead (default: current user) |
| `--members` | `--member` | Filter projects containing this member |
| `--labels` | `--label` | Filter by label |
| `--startDate` | `--start-after`, `--start-before` | Date range filters |
| `--targetDate` | `--target-after`, `--target-before` | Date range filters |
| `--icon` | ❌ (display only) | Show in output, not filterable |
| `--color` | ❌ (display only) | Show in output, not filterable |
| N/A | `--search` | Search title/description/content |
| N/A | `--all-teams` | Override default team filter |
| N/A | `--all-initiatives` | Override default initiative filter |
| N/A | `--all-leads` | Override "lead=me" filter, show all leads |

#### Default Behavior Logic
```bash
# Default: Show projects I LEAD in DEFAULT team/initiative (if configured)
linear-create project list
# → Filters: lead=me + team=defaultTeam + initiative=defaultInitiative

# Override to see ALL projects (any lead) in default team/initiative
linear-create project list --all-leads

# Override to see my led projects across ALL teams
linear-create project list --all-teams

# Filter by specific lead (overrides default)
linear-create project list --lead alice@company.com

# Filter by member (projects where someone is assigned, not necessarily lead)
linear-create project list --member bob

# Complex filter: all projects led by Bob in backend team, started status
linear-create project list --team backend --lead bob --status started

# Override everything - all projects everywhere
linear-create project list --all-teams --all-initiatives --all-leads
```

#### Requirements

**Core Functionality:**
- List all projects with smart defaults (lead=currentUser + config defaults)
- Filter by: team, initiative, status, priority, lead, member, label, search query
- Date range filters: start-after/before, target-after/before
- Override flags to bypass defaults: --all-teams, --all-initiatives, --all-leads
- Display columns: ID | Title | Status | Team | Lead | Description/Content Preview
- Content preview: show description if exists, else truncated content (~60 chars, single line)

**Output Formats:**
- Default: Formatted table with aligned columns
- JSON: Machine-readable format (--format json)
- TSV: Tab-separated values for scripting (--format tsv)
- Interactive mode with Ink UI (-I, --interactive)
- Web browser mode (--web)

**Command Refactoring:**
- Extract all project commands to function exports matching workflow-states/labels pattern
- Update cli.ts to use function-based registration
- Maintain backward compatibility

**Out of Scope:**
- `project delete` command - Deferred to M21
- `project sync-aliases` command - Deferred to M21
- Filtering by icon or color (display-only fields)

### Tests & Tasks

**Refactoring:**
- [x] [M20-T01] Extract `createProjectCommand()` function in create.tsx (Already complete)
- [x] [M20-T02] Extract `viewProjectCommand()`, `updateProjectCommand()`, `addMilestonesCommand()` functions (Already complete)
- [x] [M20-T03] Refactor cli.ts project registration to use function pattern (Already complete)

**API & Logic:**
- [x] [M20-T04] Add `getAllProjects(filters)` to linear-client.ts with comprehensive filter support
- [x] [M20-T05] Verify `getCurrentUser()` exists and add if needed
- [x] [M20-T06] Implement default filter builder: lead=currentUser + config defaults (team, initiative)
- [x] [M20-T07] Implement override flag logic: `--all-leads`, `--all-teams`, `--all-initiatives` bypass defaults

**List Command:**
- [x] [M20-T08] Create list.tsx with Ink UI component
- [x] [M20-T09] Implement filter flags: team, initiative, status, priority, lead, member, label, search
- [x] [M20-T10] Implement date range filters: start-after/before, target-after/before
- [x] [M20-T11] Implement formatted table output (default) with truncated preview
- [x] [M20-T12] Implement JSON/TSV output formats
- [x] [M20-T13] Implement description/content preview truncation logic (60 chars, single line)

**Testing:**
- [ ] [M20-TS01] Create test-project-list.sh script (~40 test cases) - Deferred for future implementation
- [ ] [M20-TS02] Test default behavior: projects I lead (with/without config) - Manual testing complete
- [ ] [M20-TS03] Test all filter combinations and edge cases - Manual testing complete
- [x] [M20-TS04] Update README.md with list command documentation

### Deliverables
```bash
# Smart defaults: projects I LEAD in default team/initiative
linear-create project list

# Search projects I lead
linear-create project list --search "API"

# Filter by specific lead (overrides default "me")
linear-create project list --lead alice@company.com

# Filter by member (projects where someone is assigned)
linear-create project list --member bob

# Override: see ALL projects (any lead) in default team
linear-create project list --all-leads

# Override: see projects I lead across ALL teams
linear-create project list --all-teams

# Complex filters
linear-create project list --team backend --status started --priority 1
linear-create project list --lead bob --label urgent --all-teams
linear-create project list --start-after 2025-01-01 --target-before 2025-06-30

# Override everything - all projects everywhere
linear-create project list --all-teams --all-initiatives --all-leads

# JSON output for scripting
linear-create project list --format json --all-teams --all-leads

# Interactive mode
linear-create project list -I

# Open in browser
linear-create project list --web
```

### Automated Verification
- `npm run build` succeeds
- `npm run typecheck` passes
- `npm run lint` passes
- `tests/scripts/test-project-list.sh` passes all ~40 test cases

### Manual Verification
- Smart defaults work: filter by lead=currentUser + config defaults
- Override flags work: `--all-leads`, `--all-teams`, `--all-initiatives`
- All filters work (team, initiative, status, priority, lead, member, label, dates)
- Date range filters work correctly
- All output formats work correctly (table, JSON, TSV, interactive)
- Search filters work across title/description/content
- Content preview truncation displays correctly (description first, then content)
- Command refactoring maintains backward compatibility

---

### [ ] Milestone M19: Issue Creation & Management (v0.18.0)
**Goal**: Add full issue creation and management capabilities with label and workflow state support
