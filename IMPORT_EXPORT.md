# Import/Export Design Specification

**Status**: Planning
**Version**: 0.1.0
**Last Updated**: 2025-11-09

## Overview

This document describes the design and implementation plan for top-level `export` and `import` commands in agent2linear. These commands enable users to export Linear issues and projects to markdown files and import them back, supporting backup, migration, and bulk editing workflows.

## Goals

1. **Backup & Restore**: Enable complete backup of issues and projects to version-controllable markdown files
2. **Bulk Editing**: Allow users to edit multiple issues/projects in their editor and re-import
3. **Migration**: Support moving issues/projects between workspaces or teams
4. **Documentation**: Generate human-readable documentation of projects and issues
5. **AI-Friendly**: Provide markdown format that AI assistants can easily read and generate

## Command Structure

### Top-Level Commands

```bash
# Primary commands
a2l export issues [options]
a2l export projects [options]
a2l import issues <input-dir> [options]
a2l import projects <input-dir> [options]

# Aliases (for discoverability)
a2l issue export [options]          # Alias for: a2l export issues
a2l project export [options]         # Alias for: a2l export projects
a2l issue import <input-dir> [options]   # Alias for: a2l import issues
a2l project import <input-dir> [options] # Alias for: a2l import projects
```

**Help Documentation**: All help text should mention available aliases.

Example:
```
a2l export issues --help

Export Linear issues to markdown files

ALIASES
  This command can also be invoked as:
    a2l issue export

USAGE
  a2l export issues [options]
```

## Issue Export

### Default Behavior

```bash
# Uses defaultProject if configured
a2l export issues --output ./backup/

# Requires --project if defaultProject not set
a2l export issues --project "Q1 Goals" --output ./backup/
```

### Filter Options

Supports **all** filters from `issue list` command:

**Core Filters:**
- `--project <id>` - Filter by project (uses defaultProject if not specified)
- `--team <id>` - Filter by team (uses defaultTeam if not specified)
- `--assignee <id>` - Filter by assignee (default: current user if not --all)
- `--all` - Export all issues (removes default assignee filter)
- `--state <name>` - Filter by workflow state
- `--priority <0-4>` - Filter by priority
- `--labels <list>` - Filter by labels (comma-separated)

**Date Filters:**
- `--created-after <date>` - Issues created after date
- `--created-before <date>` - Issues created before date
- `--updated-after <date>` - Issues updated after date
- `--updated-before <date>` - Issues updated before date
- `--due-after <date>` - Issues due after date
- `--due-before <date>` - Issues due before date

**Relationship Filters:**
- `--has-parent` - Only sub-issues
- `--no-parent` - Only root issues
- `--parent <id>` - Filter by parent issue

**Output Options:**
- `--output <dir>` - Output directory (default: `./linear-export`)
- `--format <format>` - Output format: `markdown` (default), `json`

**Examples:**

```bash
# Export all your issues in default project
a2l export issues

# Export all issues in a specific project
a2l export issues --project "Q1 Goals" --all --output ./q1-backup/

# Export high-priority bugs assigned to you
a2l export issues --priority 1 --labels bug --output ./urgent/

# Export all issues for a team updated this week
a2l export issues --team backend --updated-after 2025-11-01 --all

# Using alias syntax
a2l issue export --project "Mobile App" --output ./mobile/
```

### Output Structure

```
./linear-export/
  ├── metadata.json         # Export metadata
  └── issues/
      ├── ENG-123.md
      ├── ENG-124.md
      └── ENG-125.md
```

**metadata.json:**
```json
{
  "type": "issues",
  "exportedAt": "2025-11-09T10:30:00Z",
  "version": "0.1.0",
  "filters": {
    "project": "Q1 Goals",
    "projectId": "proj_abc123",
    "team": "backend",
    "teamId": "team_xyz789",
    "assignee": "me"
  },
  "counts": {
    "total": 15,
    "byState": {
      "Todo": 5,
      "In Progress": 8,
      "Done": 2
    }
  }
}
```

## Issue Markdown Schema

### File Naming

- **With identifier**: `{identifier}.md` (e.g., `ENG-123.md`)
- **Without identifier** (for new issues): `issue-{uuid}.md` or generate temporary identifier

### Markdown Format

```markdown
---
# Linear identifiers
identifier: ENG-123
id: issue_abc123xyz
url: https://linear.app/company/issue/ENG-123

# Core fields
title: Add OAuth2 authentication
team: backend
teamId: team_xyz789
state: In Progress
stateId: state_inprogress123
priority: 1
estimate: 5

# Assignment
assignee: alice@company.com
assigneeId: user_alice123

# Categorization
labels:
  - bug
  - security
labelIds:
  - label_bug123
  - label_sec456
project: Q1 Goals
projectId: proj_q1goals

# Relationships
parent: ENG-100
parentId: issue_parent123
cycle: null
cycleId: null

# Dates
dueDate: 2025-12-31
createdAt: 2025-01-15T10:30:00Z
updatedAt: 2025-02-01T14:20:00Z
completedAt: null
canceledAt: null
archivedAt: null

# Additional
subscribers:
  - bob@company.com
  - carol@company.com
subscriberIds:
  - user_bob456
  - user_carol789
---

# Add OAuth2 authentication

## Description

Implement OAuth2 authentication for the API. This should support Google and GitHub providers initially.

### Acceptance Criteria

- [ ] Google OAuth integration
- [ ] GitHub OAuth integration
- [ ] Token refresh mechanism
- [ ] User profile sync

## Links

- [Design Doc](https://example.com/design)
- [GitHub PR](https://github.com/org/repo/pull/123)

## Comments

### Alice (2025-01-16 10:30)

Started implementation. Created the basic OAuth flow.

### Bob (2025-01-17 14:20)

Reviewed the approach. Looks good! One suggestion: let's add rate limiting.

### Alice (2025-01-18 09:15)

@Bob Good point. Added rate limiting with Redis.
```

**Key Design Decisions:**

1. **YAML Front Matter**: All structured metadata in parseable YAML
2. **Both IDs and Names**: Store both for portability (can recreate relationships)
3. **Human-Readable Body**: Markdown content after front matter
4. **URLs Included**: For reference back to Linear
5. **Comments Embedded**: Single file per issue (easier to review)
6. **Null Values**: Explicitly show null for clarity
7. **Timestamps**: ISO 8601 format with timezone

## Project Export

### Default Behavior

```bash
# Uses defaultInitiative if configured
a2l export projects --output ./backup/

# Requires --initiative if defaultInitiative not set
a2l export projects --initiative "Q1 2025" --output ./backup/
```

### Export Scope

**Projects export includes**:
- Project metadata (name, description, content, status, priority, dates)
- Project lead and members
- Project labels
- Milestones
- Links
- **Does NOT include**: Issues in the project (use `export issues` for that)

**CLARIFYING QUESTION 1**: Should project export filter by team?
- Option A: Export ALL projects in initiative (across all teams)
- Option B: Also filter by defaultTeam or --team flag
- Option C: Support both with --all-teams flag

**CLARIFYING QUESTION 2**: What about projects without an initiative?
- Option A: Error (must specify --initiative)
- Option B: Allow --no-initiative flag to export projects without initiative
- Option C: Allow --all to export ALL projects regardless of initiative

**CLARIFYING QUESTION 3**: Should project export support additional filters?
- `--status <status>` - Filter by project status
- `--lead <id>` - Filter by project lead
- `--priority <0-4>` - Filter by priority
- `--start-after <date>`, `--target-before <date>` - Date range filters
- Or keep it simple: just initiative-based?

### Filter Options (Proposed)

```bash
# Core filters
--initiative <id>      # Filter by initiative (uses defaultInitiative if not set)
--team <id>            # Filter by team (uses defaultTeam if not set)
--all-teams            # Export projects from all teams in initiative
--no-initiative        # Export projects without initiative
--status <status>      # Filter by project status
--lead <id>            # Filter by project lead
--priority <0-4>       # Filter by priority

# Date filters
--start-after <date>   # Projects starting after date
--start-before <date>  # Projects starting before date
--target-after <date>  # Projects targeting after date
--target-before <date> # Projects targeting before date

# Output
--output <dir>         # Output directory (default: ./linear-export)
--format <format>      # Output format: markdown (default), json
```

**Examples:**

```bash
# Export all projects in default initiative
a2l export projects

# Export all projects in Q1 2025 initiative
a2l export projects --initiative "Q1 2025" --output ./q1-projects/

# Export backend team projects in Q1
a2l export projects --initiative "Q1 2025" --team backend

# Export all projects for Q1 across all teams
a2l export projects --initiative "Q1 2025" --all-teams

# Export high-priority projects
a2l export projects --initiative "Q1 2025" --priority 1

# Using alias syntax
a2l project export --initiative "Q1 2025"
```

### Output Structure

```
./linear-export/
  ├── metadata.json         # Export metadata
  └── projects/
      ├── q1-goals.md
      ├── mobile-redesign.md
      └── api-v2-migration.md
```

## Project Markdown Schema

**CLARIFYING QUESTION 4**: File naming for projects?
- Option A: Slugified name (`q1-goals.md`, `mobile-app-redesign.md`)
- Option B: ID-based (`proj_abc123.md`)
- Option C: Both name and ID (`q1-goals-proj_abc123.md`)

**CLARIFYING QUESTION 5**: Milestone representation?
- Option A: Embedded in YAML front matter (array)
- Option B: Separate section in markdown body
- Option C: Separate files (`q1-goals-milestones.md`)

### Proposed Format

```markdown
---
# Linear identifiers
id: proj_abc123xyz
name: Q1 Goals
slug: q1-goals
url: https://linear.app/company/project/q1-goals

# Core fields
status: started
statusId: status_started123
priority: 1
state: started

# Organization
team: Backend
teamId: team_xyz789
initiative: Q1 2025
initiativeId: init_q12025

# Assignment
lead: alice@company.com
leadId: user_alice123
members:
  - alice@company.com
  - bob@company.com
memberIds:
  - user_alice123
  - user_bob456

# Categorization
labels:
  - critical
  - api
labelIds:
  - label_critical123
  - label_api456

# Dates
startDate: 2025-01-01
startDateResolution: quarter
targetDate: 2025-03-31
targetDateResolution: quarter
createdAt: 2024-12-15T10:00:00Z
updatedAt: 2025-01-20T14:30:00Z

# Visual
icon: Checklist
color: "#4ECDC4"

# Milestones
milestones:
  - name: Planning Complete
    description: Finalize requirements and architecture
    targetDate: 2025-01-15
    sortOrder: 1
  - name: Alpha Release
    description: Core features implemented
    targetDate: 2025-02-15
    sortOrder: 2
  - name: Beta Release
    description: All features complete, testing
    targetDate: 2025-03-15
    sortOrder: 3

# Links
links:
  - url: https://github.com/org/repo
    label: GitHub Repository
  - url: https://example.com/design
    label: Design Specification
---

# Q1 Goals

## Description

Strategic initiatives for Q1 2025 focused on API redesign and performance improvements.

## Content

### Objectives

1. **API Redesign**: Modernize REST API to GraphQL
2. **Performance**: Reduce average response time by 50%
3. **Documentation**: Complete API documentation

### Key Results

- GraphQL schema design complete
- Migration guide published
- Performance benchmarks achieved
- Developer documentation live

### Dependencies

- Infrastructure team: Database optimization
- DevOps team: CI/CD pipeline updates

### Risks

- Timeline: Aggressive schedule may require descoping
- Resources: Need 2 additional backend engineers
```

## Issue Import

### Default Behavior

```bash
# Import issues from directory
a2l import issues ./backup/ --project "Q1 Goals"

# Dry run (preview changes)
a2l import issues ./backup/ --dry-run

# Validate only (check files without importing)
a2l import issues ./backup/ --validate
```

### Import Modes

The `--mode` flag controls how issues are imported:

**Mode: `create` (default)**
- Always creates new issues
- Ignores `identifier` and `id` from front matter
- Generates new identifiers in target team

```bash
a2l import issues ./backup/ --mode create
```

**Mode: `update`**
- Updates existing issues only
- Matches by `identifier` field (e.g., ENG-123)
- Errors if issue not found
- Updates all fields from markdown

**CLARIFYING QUESTION 6**: Update matching logic?
- Option A: Match by identifier only (ENG-123)
  - Problem: What if importing to different team with different prefix?
- Option B: Match by `id` field (issue_abc123)
  - More robust, works across teams
- Option C: Support both (try ID first, fall back to identifier)
- Option D: Allow --match-by flag (identifier, id, or title)

```bash
a2l import issues ./backup/ --mode update
```

**Mode: `upsert`**
- Updates if exists, creates if not
- Matches using same logic as update mode
- Creates new issue if no match found

**CLARIFYING QUESTION 7**: Upsert behavior for partial updates?
- Should upsert only update fields present in markdown?
- Or replace entire issue with markdown content?
- Flag like --partial-update to control?

```bash
a2l import issues ./backup/ --mode upsert
```

### Import Options

```bash
# Core options
--mode <mode>                  # Import mode: create|update|upsert (default: create)
--project <id>                 # Target project (required for create mode)
--team <id>                    # Target team (required for create mode)

# Matching (for update/upsert modes)
--match-by <field>             # Match existing issues by: id|identifier|title (default: id)

# Dependency handling
--create-missing-labels        # Create labels if they don't exist
--create-missing-projects      # Create projects if they don't exist
--skip-missing-assignees       # Skip assignee if user not found (instead of error)
--skip-on-error                # Continue on errors (don't fail entire import)

# Field overrides
--target-project <id>          # Override project from markdown
--target-team <id>             # Override team from markdown
--target-assignee <id>         # Override assignee from markdown
--add-label <label>            # Add label to all imported issues

# Safety & validation
--dry-run                      # Preview changes without making them
--validate                     # Validate files only (don't import)
--force                        # Skip confirmation prompts

# Output
--format <format>              # Output format: table|json (default: table)
```

**CLARIFYING QUESTION 8**: Import target context priority?
- When markdown says `project: Q1 Goals` but --target-project is "New Project":
  - Option A: Flag takes precedence (override markdown)
  - Option B: Markdown takes precedence (ignore flag)
  - Option C: Error (conflicting values)

**Recommendation**: Option A (flag overrides markdown) - Most flexible

**CLARIFYING QUESTION 9**: Missing dependency behavior?
- If markdown references `project: Q1 Goals` that doesn't exist:
  - Option A: Error and skip issue (unless --skip-on-error)
  - Option B: Create project if --create-missing-projects flag
  - Option C: Import issue but leave project field empty
  - Option D: Prompt user interactively

**Recommendation**: Option A as default, with opt-in flags for B and C

### Validation

The `--validate` flag checks files without importing:

**Validation Checks:**

1. **File Format**:
   - Valid YAML front matter
   - Required fields present (title, team)
   - Valid markdown syntax

2. **Reference Validity** (optional with `--strict`):
   - Team exists
   - Project exists
   - Assignee exists
   - Labels exist
   - Parent issue exists
   - Workflow state exists in team

3. **Data Types**:
   - Priority is 0-4
   - Estimate is valid number
   - Dates are valid ISO 8601
   - URLs are valid format

4. **Relationships**:
   - No circular parent relationships
   - Parent issue exists (if specified)

**Examples:**

```bash
# Basic validation (file format only)
a2l import issues ./backup/ --validate

# Strict validation (checks all references)
a2l import issues ./backup/ --validate --strict

# Validate and show detailed report
a2l import issues ./backup/ --validate --verbose
```

**Validation Output:**

```
Validating 15 issue files...

✅ ENG-123.md - Valid
✅ ENG-124.md - Valid
⚠️  ENG-125.md - Warning: Label 'deprecated-label' not found
❌ ENG-126.md - Error: Missing required field 'title'
❌ ENG-127.md - Error: Invalid priority: 5 (must be 0-4)

Summary:
  Total: 15 files
  Valid: 13 files
  Warnings: 1 file
  Errors: 2 files

Validation failed. Fix errors before importing.
```

### Examples

```bash
# Import as new issues to specific project
a2l import issues ./backup/ --project "Q1 Goals" --team backend

# Update existing issues
a2l import issues ./backup/ --mode update

# Upsert (update or create)
a2l import issues ./backup/ --mode upsert --team backend

# Import with dependency creation
a2l import issues ./backup/ \
  --create-missing-labels \
  --create-missing-projects \
  --skip-missing-assignees

# Override project for all issues
a2l import issues ./backup/ --target-project "New Project"

# Add label to all imported issues
a2l import issues ./backup/ --add-label "imported"

# Dry run to preview changes
a2l import issues ./backup/ --mode upsert --dry-run

# Validate before importing
a2l import issues ./backup/ --validate --strict

# Using alias syntax
a2l issue import ./backup/ --project "Mobile App"
```

## Project Import

### Default Behavior

```bash
# Import projects from directory
a2l import projects ./backup/ --initiative "Q1 2025"

# Dry run (preview changes)
a2l import projects ./backup/ --dry-run

# Validate only
a2l import projects ./backup/ --validate
```

### Import Modes

Same three modes as issue import: `create`, `update`, `upsert`

**CLARIFYING QUESTION 10**: Project matching for update/upsert?
- Option A: Match by project `id` (proj_abc123)
- Option B: Match by project `name` (case-insensitive)
- Option C: Match by `slug`
- Option D: Support all with --match-by flag

### Import Options

```bash
# Core options
--mode <mode>                  # Import mode: create|update|upsert (default: create)
--initiative <id>              # Target initiative (required for create mode)
--team <id>                    # Target team (required for create mode)

# Matching (for update/upsert modes)
--match-by <field>             # Match existing projects by: id|name|slug (default: id)

# Dependency handling
--create-missing-labels        # Create labels if they don't exist
--create-missing-initiatives   # Create initiatives if they don't exist
--skip-missing-lead            # Skip lead if user not found
--skip-missing-members         # Skip members if users not found
--skip-on-error                # Continue on errors

# Field overrides
--target-initiative <id>       # Override initiative from markdown
--target-team <id>             # Override team from markdown
--target-lead <id>             # Override lead from markdown
--add-label <label>            # Add label to all imported projects

# Safety & validation
--dry-run                      # Preview changes without making them
--validate                     # Validate files only (don't import)
--force                        # Skip confirmation prompts

# Output
--format <format>              # Output format: table|json (default: table)
```

### Examples

```bash
# Import as new projects
a2l import projects ./backup/ --initiative "Q1 2025" --team backend

# Update existing projects
a2l import projects ./backup/ --mode update

# Upsert with dependency creation
a2l import projects ./backup/ \
  --mode upsert \
  --create-missing-labels \
  --create-missing-initiatives

# Override initiative for all projects
a2l import projects ./backup/ --target-initiative "Q2 2025"

# Using alias syntax
a2l project import ./backup/ --initiative "Q1 2025"
```

## Dry Run Behavior

Both export and import support `--dry-run` for preview without side effects.

### Export Dry Run

```bash
a2l export issues --project "Q1 Goals" --dry-run
```

**Output:**
```
Dry run mode: No files will be written

Export Plan:
  Filters:
    Project: Q1 Goals (proj_abc123)
    Assignee: me (user_alice123)
    Team: backend (team_xyz789)

  Estimated results: 15 issues

  Output structure:
    ./linear-export/
      ├── metadata.json
      └── issues/
          ├── ENG-123.md
          ├── ENG-124.md
          └── ... (13 more files)

Run without --dry-run to execute export.
```

### Import Dry Run

```bash
a2l import issues ./backup/ --mode upsert --dry-run
```

**Output:**
```
Dry run mode: No changes will be made

Import Plan:
  Mode: upsert
  Files: 15 issues

  Operations:
    Create: 10 issues
      - ENG-123.md → New issue (no match found)
      - ENG-124.md → New issue (no match found)
      ...

    Update: 5 issues
      - ENG-130.md → Update existing ENG-130
      - ENG-131.md → Update existing ENG-131
      ...

  Warnings:
    - ENG-125.md: Label 'deprecated' not found (will skip)
    - ENG-126.md: Assignee 'old-user@example.com' not found

Run without --dry-run to execute import.
```

## Incremental Export

**CLARIFYING QUESTION 11**: Should we support incremental export?

**Option A: No incremental support**
- Always full snapshot
- Simpler implementation
- Easier to understand

**Option B: Timestamp-based incremental**
- Track last export timestamp
- Use --updated-after to export only changed issues
- Store metadata in export directory

```bash
# First export (full)
a2l export issues --project "Q1 Goals" --output ./backup/

# Later exports (incremental)
a2l export issues --project "Q1 Goals" --output ./backup/ --incremental
# Automatically uses updated-after from last export
```

**Option C: Manual incremental**
- User specifies --updated-after flag manually
- No automatic tracking

```bash
a2l export issues --project "Q1 Goals" --updated-after 2025-11-01
```

**Recommendation**: Start with Option C (manual), add Option B later if needed.

## Implementation Plan

### Phase 1: Issue Export (M15-T01 through M15-T05)

1. **M15-T01**: Implement `export issues` command core
   - CLI argument parsing
   - Filter integration with `issue list`
   - Directory structure creation

2. **M15-T02**: Implement issue markdown generation
   - YAML front matter serialization
   - Markdown body formatting
   - Comment embedding
   - File writing

3. **M15-T03**: Implement metadata.json generation
   - Export metadata tracking
   - Filter information storage
   - Statistics collection

4. **M15-T04**: Add export validation and dry-run
   - Dry-run preview
   - Output validation
   - Error handling

5. **M15-T05**: Command aliases and help text
   - Register `issue export` alias
   - Update help documentation
   - Add usage examples

### Phase 2: Issue Import (M15-T06 through M15-T10)

6. **M15-T06**: Implement `import issues` command core
   - CLI argument parsing
   - Directory reading
   - File discovery

7. **M15-T07**: Implement markdown parsing
   - YAML front matter parsing
   - Validation logic
   - Error reporting

8. **M15-T08**: Implement import modes
   - Create mode
   - Update mode
   - Upsert mode
   - Matching logic

9. **M15-T09**: Implement dependency resolution
   - Team/project/label resolution
   - Assignee resolution
   - Missing dependency handling
   - Creation flags

10. **M15-T10**: Add import validation and dry-run
    - Validation-only mode
    - Dry-run preview
    - Detailed error reporting

### Phase 3: Project Export (M15-T11 through M15-T15)

11. **M15-T11**: Implement `export projects` command
    - CLI argument parsing
    - Initiative-based filtering
    - Additional filter support

12. **M15-T12**: Implement project markdown generation
    - YAML front matter for projects
    - Milestone embedding
    - Content formatting

13. **M15-T13**: Add project export validation
    - Dry-run support
    - Error handling

14. **M15-T14**: Command aliases for projects
    - Register `project export` alias
    - Help documentation

### Phase 4: Project Import (M15-T16 through M15-T20)

15. **M15-T16**: Implement `import projects` command
    - CLI argument parsing
    - Project markdown parsing

16. **M15-T17**: Implement project import modes
    - Create mode
    - Update mode (with matching)
    - Upsert mode

17. **M15-T18**: Implement project dependency resolution
    - Initiative resolution
    - Lead/member resolution
    - Label resolution

18. **M15-T19**: Add project import validation
    - Validation-only mode
    - Dry-run support

19. **M15-T20**: Project import testing
    - Integration tests
    - Error case handling

### Phase 5: Documentation & Polish (M15-T21 through M15-T25)

20. **M15-T21**: Update README.md
    - Export/import documentation
    - Usage examples
    - Workflow guides

21. **M15-T22**: Create integration tests
    - Export → Import round-trip tests
    - Validation tests
    - Error handling tests

22. **M15-T23**: Add to setup wizard
    - Mention export/import in tutorial
    - Add to feature showcase

23. **M15-T24**: Performance optimization
    - Batch API calls
    - Parallel file operations
    - Progress indicators

24. **M15-T25**: Final validation
    - Build and typecheck
    - Lint pass
    - Manual testing

## File Organization

### New Files to Create

```
src/commands/
  export/
    issues.ts           # Issue export command
    projects.ts         # Project export command
  import/
    issues.ts           # Issue import command
    projects.ts         # Project import command

src/lib/
  export/
    issue-markdown.ts   # Issue → markdown conversion
    project-markdown.ts # Project → markdown conversion
    metadata.ts         # Metadata.json generation
  import/
    markdown-parser.ts  # Markdown → object parsing
    validator.ts        # File validation logic
    matcher.ts          # Entity matching (update/upsert)
    dependency-resolver.ts # Resolve teams, projects, labels, etc.

tests/scripts/
  test-export-import.sh  # Integration tests
```

## Open Questions

### Priority: High

1. **Q6: Update/Upsert Matching** - How to match existing issues/projects?
   - Recommendation: Match by `id` field (most robust)
   - Support --match-by flag for flexibility

2. **Q8: Import Override Priority** - Flag vs markdown field priority?
   - Recommendation: Flag overrides markdown

3. **Q9: Missing Dependencies** - How to handle missing teams/projects/labels?
   - Recommendation: Error by default, opt-in flags for creation/skipping

### Priority: Medium

4. **Q1: Project Export Team Filter** - Should it filter by team?
   - Recommendation: Yes, support --team and --all-teams

5. **Q2: Projects Without Initiative** - How to handle?
   - Recommendation: Allow --no-initiative flag

6. **Q3: Project Export Filters** - Support status/lead/priority filters?
   - Recommendation: Yes, mirror issue export flexibility

7. **Q4: Project File Naming** - Slugified vs ID-based?
   - Recommendation: Slugified name (human-readable)

8. **Q5: Milestone Representation** - Embedded vs separate files?
   - Recommendation: Embedded in YAML (simpler)

### Priority: Low

9. **Q7: Upsert Partial Updates** - Update only changed fields?
   - Recommendation: Full replacement (simpler), add --partial later if needed

10. **Q10: Project Matching** - By ID, name, or slug?
    - Recommendation: By `id` with --match-by for alternatives

11. **Q11: Incremental Export** - Support incremental exports?
    - Recommendation: Manual only (--updated-after), no tracking

## Success Criteria

### Must Have (v1.0)
- ✅ Export issues with all filters
- ✅ Import issues with create mode
- ✅ Import issues with update/upsert modes
- ✅ Export projects with initiative filter
- ✅ Import projects with create mode
- ✅ Dry-run support for all commands
- ✅ Validation support for imports
- ✅ Comprehensive help text with aliases
- ✅ Round-trip testing (export → edit → import)

### Should Have (v1.1)
- ⏳ Performance optimization (parallel operations)
- ⏳ Progress indicators for large exports/imports
- ⏳ Incremental export support (auto-tracking)
- ⏳ Partial update mode for upsert
- ⏳ Interactive mode for conflict resolution

### Nice to Have (v2.0)
- 💡 Export to other formats (JSON, CSV, HTML)
- 💡 Template-based export (custom markdown templates)
- 💡 Diff view for dry-run (show field changes)
- 💡 Batch operations (export multiple projects)
- 💡 Webhook integration (auto-export on changes)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large exports (1000+ issues) performance | High | Batch API calls, parallel file writes, progress bars |
| Circular parent relationships on import | Medium | Validation checks, two-pass import (create then link) |
| ID collisions when importing to different workspace | High | Clear documentation, --match-by flag, validation |
| Markdown parsing edge cases (malformed YAML) | Medium | Robust error handling, detailed error messages |
| API rate limiting on large imports | High | Batch operations, rate limiting, retry logic |

## Appendix: Example Workflows

### Workflow 1: Project Backup

```bash
# Export all issues and projects for Q1
a2l export issues --project "Q1 Goals" --all --output ./q1-backup/
a2l export projects --initiative "Q1 2025" --output ./q1-backup/

# Commit to git
cd q1-backup
git init
git add .
git commit -m "Q1 2025 backup - $(date)"
git push
```

### Workflow 2: Bulk Editing

```bash
# Export your issues
a2l export issues --assignee me --output ./my-issues/

# Edit in your favorite editor
code ./my-issues/issues/

# Re-import with updates
a2l import issues ./my-issues/ --mode upsert --dry-run
a2l import issues ./my-issues/ --mode upsert
```

### Workflow 3: Migration Between Workspaces

```bash
# Export from old workspace
LINEAR_API_KEY=old_key a2l export issues --team backend --all --output ./migration/

# Import to new workspace (creates new issues)
LINEAR_API_KEY=new_key a2l import issues ./migration/ \
  --team new-backend \
  --mode create \
  --create-missing-labels
```

### Workflow 4: Documentation Generation

```bash
# Export project and its issues
a2l export projects --initiative "Q1 2025" --output ./docs/
a2l export issues --project "Q1 Goals" --all --output ./docs/

# Markdown files can be published as documentation
# Or processed with static site generators
```

---

**Next Steps:**
1. Answer clarifying questions (Q1-Q11)
2. Refine schema based on answers
3. Begin Phase 1 implementation (Issue Export)
4. Create milestone in MILESTONES.md
