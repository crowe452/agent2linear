## [ ] Milestone M27: Import/Export Commands (v0.27.0)
**Goal**: Implement top-level `export` and `import` commands to enable users to export Linear issues and projects to markdown files and import them back, supporting backup, migration, bulk editing, and documentation workflows.

### Overview
M27 is delivered through five implementation phases (M27.1-M27.5) using incremental alpha releases:
- **M27.1** (v0.27.0-alpha.1): Issue Export
- **M27.2** (v0.27.0-alpha.2): Issue Import
- **M27.3** (v0.27.0-alpha.3): Project Export
- **M27.4** (v0.27.0-alpha.4): Project Import
- **M27.5** (v0.27.0): Documentation & Polish + Final Release

### Key Features
- Export issues to markdown with YAML front matter
- Import issues with create/update/upsert modes
- Waterfall matching for issues: identifier → id → title
- Export projects to markdown (metadata only, not issues)
- Import projects with configurable matching strategies
- Command aliases for discoverability (`issue export`, `project export`)
- Dry-run and validation support
- Extensive filtering for both issues and projects
- Missing dependency handling (error, skip, create with flags)

### Design Document
- [IMPORT_EXPORT.md](./IMPORT_EXPORT.md) - Comprehensive design specification (v1.0.0, finalized 2025-11-09)

### High-Level Task Mapping

| Meta Task | Description | Maps To Sub-Milestone Tasks |
|-----------|-------------|----------------------------|
| M27-T01 | Implement issue export command | M27.1-T01 through M27.1-T05 |
| M27-TS01 | Test suite for issue export | M27.1-TS01 through M27.1-TS15 |
| M27-T02 | Implement issue import command | M27.2-T01 through M27.2-T05 |
| M27-TS02 | Test suite for issue import | M27.2-TS01 through M27.2-TS20 |
| M27-T03 | Implement project export command | M27.3-T01 through M27.3-T05 |
| M27-TS03 | Test suite for project export | M27.3-TS01 through M27.3-TS12 |
| M27-T04 | Implement project import command | M27.4-T01 through M27.4-T05 |
| M27-TS04 | Test suite for project import | M27.4-TS01 through M27.4-TS12 |
| M27-T05 | Documentation and polish | M27.5-T01 through M27.5-T05 |
| M27-TS05 | Integration tests (round-trip) | M27.5-TS01 through M27.5-TS10 |

### Test Summary
- **Total test cases**: ~69+ (15 issue export + 20 issue import + 12 project export + 12 project import + 10 integration)
- **Test scripts**: 1 comprehensive integration test suite + unit tests
- **Coverage**: All CLI flags, filtering, modes, matching strategies, validation, dry-run, error handling

### Deliverable
```bash
# Issue export with filters
$ a2l export issues --project "Q1 Goals" --priority 1 --output ./backup/
✅ Exported 15 issues to ./backup/

# Issue import with upsert
$ a2l import issues ./backup/ --mode upsert --create-missing-labels
✅ Imported 15 issues (10 created, 5 updated)

# Project export
$ a2l export projects --initiative "Q1 2025" --team backend --output ./projects/
✅ Exported 3 projects to ./projects/

# Project import
$ a2l import projects ./projects/ --mode update --match-by name
✅ Imported 3 projects (0 created, 3 updated)

# Using aliases
$ a2l issue export --assignee me --output ./my-issues/
$ a2l project import ./projects/ --initiative "Q2 2025"
```

### Overall Verification
- [ ] All alpha releases (v0.27.0-alpha.1 through v0.27.0-alpha.4) completed
- [ ] All 69+ test cases pass
- [ ] `npm run build` succeeds for final release
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes (0 new errors)
- [ ] Dry-run modes work for all commands
- [ ] Validation mode works for imports
- [ ] Command aliases work (`issue export`, `project export`)
- [ ] Round-trip testing passes (export → edit → import)
- [ ] Error messages are helpful with context
- [ ] Cleanup scripts generated for test suites

**For detailed implementation tasks, see sub-milestones M27.1 through M27.5 below.**

---

### [ ] Milestone M27.1: Issue Export (v0.27.0-alpha.1)
**Goal**: Implement issue export command with markdown generation, metadata tracking, and dry-run support.

#### Requirements
- Implement `export issues` command with all `issue list` filters
- Generate markdown files with YAML front matter
- Create metadata.json with export information
- Support dry-run mode
- Register `issue export` command alias

#### Out of Scope
- Issue import (see M27.2)
- Project export/import (see M27.3, M27.4)
- Incremental export with automatic tracking

#### Tasks

**Core Implementation:**
- [ ] [M27.1-T01] Create `src/commands/export/issues.ts`
  - CLI argument parsing with Commander
  - Integrate all `issue list` filters (project, team, assignee, state, priority, labels, dates, parent)
  - Directory structure creation (metadata.json + issues/ subdirectory)
  - Output path handling and validation
  - Default to `./linear-export` if not specified

- [ ] [M27.1-T02] Create `src/lib/export/issue-markdown.ts`
  - Function to convert issue object → markdown string
  - YAML front matter generation with all fields (identifier, id, title, team, state, priority, estimate, assignee, labels, project, parent, cycle, subscribers, dates, url)
  - Markdown body formatting (description, links, comments)
  - Handle null/undefined fields gracefully
  - Preserve both IDs and human-readable names

- [ ] [M27.1-T03] Create `src/lib/export/metadata.ts`
  - Function to generate metadata.json
  - Export metadata (timestamp, version, filters used)
  - Statistics (total count, counts by state)
  - Filter information storage for reference

- [ ] [M27.1-T04] Add dry-run and validation
  - Implement --dry-run flag (preview without writing files)
  - Show export plan (filters, estimated count, output structure)
  - File conflict detection
  - Error handling with helpful messages

- [ ] [M27.1-T05] Register command and aliases
  - Register `export issues` in src/cli.ts
  - Register `issue export` alias pointing to same handler
  - Update help text to mention aliases
  - Add usage examples

#### Test Cases: M27.1-TS01 through M27.1-TS15 (~15 tests)

- [ ] [M27.1-TS01] Export with --project filter
- [ ] [M27.1-TS02] Export with --team filter
- [ ] [M27.1-TS03] Export with --assignee filter
- [ ] [M27.1-TS04] Export with --state filter
- [ ] [M27.1-TS05] Export with --priority filter
- [ ] [M27.1-TS06] Export with --labels filter (multiple)
- [ ] [M27.1-TS07] Export with date filters (--updated-after, --created-before)
- [ ] [M27.1-TS08] Export with combined filters
- [ ] [M27.1-TS09] Export with --output custom directory
- [ ] [M27.1-TS10] Export dry-run mode (no files written)
- [ ] [M27.1-TS11] Verify metadata.json structure and content
- [ ] [M27.1-TS12] Verify markdown YAML front matter completeness
- [ ] [M27.1-TS13] Verify markdown body formatting (description, comments)
- [ ] [M27.1-TS14] Export with no results (empty export)
- [ ] [M27.1-TS15] Test `issue export` alias works identically

#### Deliverable
```bash
# Export with filters
$ a2l export issues --project "Q1 Goals" --priority 1 --output ./backup/
Exporting issues...
✅ Exported 15 issues to ./backup/

# Dry run
$ a2l export issues --project "Q1 Goals" --dry-run
Dry run mode: No files will be written

Export Plan:
  Filters:
    Project: Q1 Goals (proj_abc123)
    Assignee: me (user_alice123)

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

#### Verification
- [ ] `npm run build` succeeds
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] All 15 test cases pass
- [ ] Markdown files have valid YAML front matter
- [ ] metadata.json is well-formed JSON
- [ ] Command alias `issue export` works

---

### [ ] Milestone M27.2: Issue Import (v0.27.0-alpha.2)
**Goal**: Implement issue import command with create/update/upsert modes, waterfall matching, validation, and dry-run support.

#### Requirements
- Implement `import issues` command with all modes (create, update, upsert)
- Parse markdown files with YAML front matter
- Waterfall matching: identifier → id → title
- Missing dependency handling (error, skip, create with flags)
- Validation and dry-run support
- Register `issue import` command alias

#### Out of Scope
- Issue export (completed in M27.1)
- Project import/export (see M27.3, M27.4)
- Partial updates for upsert (full replacement only)

#### Tasks

**Core Implementation:**
- [ ] [M27.2-T01] Create `src/commands/import/issues.ts`
  - CLI argument parsing (mode, project, team, flags)
  - Directory reading and .md file discovery
  - Batch processing framework
  - Summary reporting (created, updated, errors)

- [ ] [M27.2-T02] Create `src/lib/import/markdown-parser.ts`
  - Parse YAML front matter (use gray-matter library)
  - Validate required fields (title, team)
  - Type validation (priority 0-4, dates ISO 8601, etc.)
  - Detailed error reporting with file:line
  - Handle malformed YAML gracefully

- [ ] [M27.2-T03] Create `src/lib/import/matcher.ts`
  - Implement waterfall matching for issues:
    1. Try matching by `identifier` (ENG-123)
    2. Fall back to `id` (issue_abc123)
    3. Fall back to `title` (case-insensitive)
  - Return matched issue or null
  - Handle ambiguous matches

- [ ] [M27.2-T04] Create `src/lib/import/dependency-resolver.ts`
  - Resolve team (by ID or alias)
  - Resolve project (by ID, alias, or name)
  - Resolve assignee (by ID, alias, or email)
  - Resolve labels (by ID or alias, create if --create-missing-labels)
  - Resolve workflow state (team-specific validation)
  - Handle missing dependencies based on flags (error/skip/create)

- [ ] [M27.2-T05] Implement modes and validation
  - Create mode: Always create new issues
  - Update mode: Use waterfall matching, error if not found, full replacement
  - Upsert mode: Match or create, full replacement on match
  - CLI flags override markdown fields (--target-project, --target-team, etc.)
  - --validate mode (check files without importing)
  - --dry-run mode (preview operations)

#### Test Cases: M27.2-TS01 through M27.2-TS20 (~20 tests)

- [ ] [M27.2-TS01] Import create mode (all new issues)
- [ ] [M27.2-TS02] Import update mode with identifier match (ENG-123)
- [ ] [M27.2-TS03] Import update mode with id match (issue_abc123)
- [ ] [M27.2-TS04] Import update mode with title match
- [ ] [M27.2-TS05] Import update mode with no match (error)
- [ ] [M27.2-TS06] Import upsert mode (mix of create and update)
- [ ] [M27.2-TS07] Validation mode (--validate)
- [ ] [M27.2-TS08] Dry-run mode (--dry-run)
- [ ] [M27.2-TS09] --create-missing-labels flag
- [ ] [M27.2-TS10] --create-missing-projects flag
- [ ] [M27.2-TS11] --skip-missing-assignees flag
- [ ] [M27.2-TS12] --skip-on-error flag (continue on errors)
- [ ] [M27.2-TS13] --target-project override
- [ ] [M27.2-TS14] --target-team override
- [ ] [M27.2-TS15] Missing project error handling
- [ ] [M27.2-TS16] Missing label error handling
- [ ] [M27.2-TS17] Malformed YAML handling
- [ ] [M27.2-TS18] Invalid field values (priority 5, bad dates)
- [ ] [M27.2-TS19] Full replacement on update (all fields replaced)
- [ ] [M27.2-TS20] Test `issue import` alias works

#### Deliverable
```bash
# Import create mode
$ a2l import issues ./backup/ --project "Q1 Goals" --team backend
Importing 15 issues...
✅ Imported 15 issues (15 created, 0 updated, 0 errors)

# Import upsert with dry-run
$ a2l import issues ./backup/ --mode upsert --dry-run
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
      - ENG-130.md → Update existing ENG-130 (matched by identifier)
      - ENG-131.md → Update existing issue_xyz789 (matched by id)
      ...

  Warnings:
    - ENG-125.md: Label 'deprecated' not found (will skip)

Run without --dry-run to execute import.

# Import with missing dependency creation
$ a2l import issues ./backup/ --mode create --create-missing-labels --create-missing-projects
Importing 15 issues...
Created 2 missing labels: urgent, needs-review
Created 1 missing project: Infrastructure
✅ Imported 15 issues (15 created, 0 updated, 0 errors)
```

#### Verification
- [ ] `npm run build` succeeds
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] All 20 test cases pass
- [ ] Waterfall matching works correctly
- [ ] Validation catches malformed files
- [ ] Dry-run shows accurate preview
- [ ] Error messages are helpful

---

### [ ] Milestone M27.3: Project Export (v0.27.0-alpha.3)
**Goal**: Implement project export command with initiative/team filtering, configurable file naming, and milestone support.

#### Requirements
- Implement `export projects` command with initiative-based filtering
- Team filtering with --all-teams override
- Support --no-initiative flag
- Extensive filtering (status, lead, priority, date ranges)
- Configurable file naming (--naming slug|id|combined)
- Milestones embedded in YAML front matter
- Register `project export` command alias

#### Out of Scope
- Exporting issues within projects (use `export issues`)
- Project import (see M27.4)

#### Tasks

**Core Implementation:**
- [ ] [M27.3-T01] Create `src/commands/export/projects.ts`
  - CLI argument parsing
  - Initiative-based filtering (defaultInitiative support)
  - Team filtering (defaultTeam with --all-teams override)
  - --no-initiative flag support
  - Additional filters (--status, --lead, --priority, date ranges)
  - Directory structure creation

- [ ] [M27.3-T02] Create `src/lib/export/project-markdown.ts`
  - Function to convert project object → markdown
  - YAML front matter (all project fields: id, name, slug, status, priority, team, initiative, lead, members, labels, dates, milestones, links, icon, color)
  - Milestones embedded as array in YAML
  - Project description and content in markdown body
  - Preserve both IDs and names

- [ ] [M27.3-T03] Implement configurable file naming
  - --naming slug|id|combined flag
  - Default: slugified name (q1-goals.md)
  - slug: Lowercase, hyphens, no special chars
  - id: proj_abc123.md
  - combined: q1-goals-proj_abc123.md
  - Collision detection and handling

- [ ] [M27.3-T04] Add validation and dry-run
  - --dry-run flag with preview
  - File conflict detection
  - Error handling

- [ ] [M27.3-T05] Register command and aliases
  - Register `export projects` in src/cli.ts
  - Register `project export` alias
  - Update help text

#### Test Cases: M27.3-TS01 through M27.3-TS12 (~12 tests)

- [ ] [M27.3-TS01] Export with --initiative filter
- [ ] [M27.3-TS02] Export with --team filter
- [ ] [M27.3-TS03] Export with --all-teams override
- [ ] [M27.3-TS04] Export with --no-initiative flag
- [ ] [M27.3-TS05] Export with --status filter
- [ ] [M27.3-TS06] Export with --lead filter
- [ ] [M27.3-TS07] Export with date filters (--start-after, --target-before)
- [ ] [M27.3-TS08] File naming: --naming slug (default)
- [ ] [M27.3-TS09] File naming: --naming id
- [ ] [M27.3-TS10] File naming: --naming combined
- [ ] [M27.3-TS11] Verify milestone serialization in YAML
- [ ] [M27.3-TS12] Test `project export` alias works

#### Deliverable
```bash
# Export projects
$ a2l export projects --initiative "Q1 2025" --team backend --output ./projects/
Exporting projects...
✅ Exported 3 projects to ./projects/

# Export with custom naming
$ a2l export projects --initiative "Q1 2025" --naming id --output ./projects/
✅ Exported 3 projects to ./projects/
  - proj_abc123.md
  - proj_def456.md
  - proj_ghi789.md

# Dry run
$ a2l export projects --initiative "Q1 2025" --dry-run
Dry run mode: No files will be written

Export Plan:
  Filters:
    Initiative: Q1 2025 (init_abc123)
    Team: Backend (team_xyz789)

  Estimated results: 3 projects

  Output structure:
    ./linear-export/
      ├── metadata.json
      └── projects/
          ├── q1-goals.md
          ├── mobile-redesign.md
          └── api-v2-migration.md
```

#### Verification
- [ ] `npm run build` succeeds
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] All 12 test cases pass
- [ ] All file naming modes work
- [ ] Milestones serialize correctly
- [ ] Command alias works

---

### [ ] Milestone M27.4: Project Import (v0.27.0-alpha.4)
**Goal**: Implement project import command with create/update/upsert modes, configurable matching, and dependency resolution.

#### Requirements
- Implement `import projects` command with all modes
- Configurable matching (--match-by id|name|slug)
- Missing dependency handling
- Validation and dry-run support
- Register `project import` command alias

#### Out of Scope
- Importing issues when importing projects (separate commands)
- Project export (completed in M27.3)

#### Tasks

**Core Implementation:**
- [ ] [M27.4-T01] Create `src/commands/import/projects.ts`
  - CLI argument parsing (mode, initiative, team, flags)
  - Directory reading and .md file discovery
  - Batch processing
  - Summary reporting

- [ ] [M27.4-T02] Extend `src/lib/import/markdown-parser.ts` for projects
  - Parse project YAML front matter
  - Parse embedded milestones array
  - Validate required fields (name, team, initiative for create mode)
  - Type validation

- [ ] [M27.4-T03] Extend `src/lib/import/matcher.ts` for projects
  - Implement --match-by flag (id|name|slug)
  - Default: match by id
  - name: Case-insensitive matching
  - slug: Exact slug matching
  - Single strategy (not waterfall like issues)

- [ ] [M27.4-T04] Extend `src/lib/import/dependency-resolver.ts` for projects
  - Resolve initiative (by ID or alias)
  - Resolve lead (by ID, alias, or email)
  - Resolve members (by ID, alias, or email)
  - Resolve labels (create if --create-missing-labels)
  - Handle missing dependencies

- [ ] [M27.4-T05] Implement modes and validation
  - Create mode: Always create new projects
  - Update mode: Match by --match-by strategy, full replacement
  - Upsert mode: Match or create
  - --validate mode
  - --dry-run mode
  - Milestone import and creation

#### Test Cases: M27.4-TS01 through M27.4-TS12 (~12 tests)

- [ ] [M27.4-TS01] Import create mode
- [ ] [M27.4-TS02] Import update mode with --match-by id
- [ ] [M27.4-TS03] Import update mode with --match-by name
- [ ] [M27.4-TS04] Import update mode with --match-by slug
- [ ] [M27.4-TS05] Import upsert mode
- [ ] [M27.4-TS06] Validation mode
- [ ] [M27.4-TS07] Dry-run mode
- [ ] [M27.4-TS08] --create-missing-labels flag
- [ ] [M27.4-TS09] --target-initiative override
- [ ] [M27.4-TS10] Milestone import
- [ ] [M27.4-TS11] Missing initiative handling
- [ ] [M27.4-TS12] Test `project import` alias works

#### Deliverable
```bash
# Import create mode
$ a2l import projects ./projects/ --initiative "Q1 2025" --team backend
Importing 3 projects...
✅ Imported 3 projects (3 created, 0 updated, 0 errors)

# Import update with matching
$ a2l import projects ./projects/ --mode update --match-by name
Importing 3 projects...
✅ Imported 3 projects (0 created, 3 updated, 0 errors)

# Dry run
$ a2l import projects ./projects/ --mode upsert --dry-run
Dry run mode: No changes will be made

Import Plan:
  Mode: upsert
  Files: 3 projects
  Match strategy: id

  Operations:
    Create: 1 project
      - new-project.md → New project (no match found)

    Update: 2 projects
      - q1-goals.md → Update existing proj_abc123 (matched by id)
      - mobile-redesign.md → Update existing proj_def456 (matched by id)
```

#### Verification
- [ ] `npm run build` succeeds
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] All 12 test cases pass
- [ ] All matching strategies work
- [ ] Milestones import correctly
- [ ] Command alias works

---

### [ ] Milestone M27.5: Documentation & Polish (v0.27.0)
**Goal**: Complete documentation, integration testing, performance optimization, and final release.

#### Requirements
- Update README.md with comprehensive export/import documentation
- Create integration test suite with round-trip tests
- Performance optimization for large exports/imports
- Final validation and cleanup

#### Out of Scope
- New features beyond M27.1-M27.4 scope
- Interactive modes (future enhancement)

#### Tasks

**Documentation:**
- [ ] [M27.5-T01] Update README.md
  - Add "Import/Export" section
  - Usage examples for all 4 commands
  - Workflow guides (backup, bulk edit, migration, documentation generation)
  - Markdown schema documentation reference
  - Link to IMPORT_EXPORT.md for details

**Testing:**
- [ ] [M27.5-T02] Create `tests/scripts/test-export-import.sh`
  - Round-trip tests (export → edit → import → verify)
  - Cross-team import tests
  - Validation tests
  - Error handling tests
  - All 4 commands coverage

**Polish:**
- [ ] [M27.5-T03] Optional: Add to setup wizard
  - Mention export/import in tutorial screens
  - Add to feature showcase (if space permits)

- [ ] [M27.5-T04] Performance optimization
  - Batch API calls for exports (single query for all issues/projects)
  - Parallel file I/O operations
  - Progress indicators for large operations (>50 items)
  - Memory efficiency for large exports

- [ ] [M27.5-T05] Final validation
  - `npm run build` succeeds
  - `npm run typecheck` passes
  - `npm run lint` passes (0 new errors)
  - All 69+ tests pass
  - Manual testing of all 4 commands
  - Help text review for all commands
  - Error message review

#### Test Cases: M27.5-TS01 through M27.5-TS10 (~10 integration tests)

- [ ] [M27.5-TS01] Round-trip: Export issues → Import create (verify identical)
- [ ] [M27.5-TS02] Round-trip: Export issues → Edit → Import update (verify changes)
- [ ] [M27.5-TS03] Round-trip: Export projects → Import create
- [ ] [M27.5-TS04] Round-trip: Export projects → Edit → Import update
- [ ] [M27.5-TS05] Cross-team import (export from team A, import to team B)
- [ ] [M27.5-TS06] Large export (100+ issues) performance test
- [ ] [M27.5-TS07] Large import (100+ issues) performance test
- [ ] [M27.5-TS08] Export issues + projects for same initiative
- [ ] [M27.5-TS09] Import with all dependency creation flags
- [ ] [M27.5-TS10] Error recovery (partial import with errors)

#### Deliverable
```bash
# All commands working with comprehensive help
$ a2l export --help
$ a2l import --help
$ a2l export issues --help
$ a2l import issues --help
$ a2l export projects --help
$ a2l import projects --help

# Full workflow example in README.md
# Performance: Export 100+ issues in <5 seconds
# All tests pass: 69+ test cases
```

#### Verification
- [ ] `npm run build` succeeds
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes (0 new errors)
- [ ] All integration tests pass (10 test cases)
- [ ] All previous alpha tests still pass (59 test cases)
- [ ] README.md updated with examples
- [ ] Help text complete for all commands
- [ ] Performance acceptable for 100+ items
- [ ] Ready for v0.27.0 release

---

## File Organization (All Phases)

```
src/commands/
  export/
    issues.ts           # M27.1-T01: Issue export command
    projects.ts         # M27.3-T01: Project export command
  import/
    issues.ts           # M27.2-T01: Issue import command
    projects.ts         # M27.4-T01: Project import command

src/lib/
  export/
    issue-markdown.ts   # M27.1-T02: Issue → markdown conversion
    project-markdown.ts # M27.3-T02: Project → markdown conversion
    metadata.ts         # M27.1-T03: metadata.json generation
  import/
    markdown-parser.ts  # M27.2-T02: Markdown → object parsing
    matcher.ts          # M27.2-T03, M27.4-T03: Entity matching
    dependency-resolver.ts # M27.2-T04, M27.4-T04: Dependency resolution
    validator.ts        # Validation logic (part of parser)

tests/scripts/
  test-export-import.sh  # M27.5-T02: Comprehensive integration tests
```

## Dependencies

**New package dependencies:**
- `gray-matter` - YAML front matter parsing (likely already installed)
- Consider: `slugify` or implement manual slugification for project names

## Success Criteria (Overall)

### Build & Quality
- [ ] `npm run build` succeeds
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes (0 new errors)
- [ ] All 69+ test cases pass

### Functionality
- [ ] All 4 commands work (export/import for issues/projects)
- [ ] All command aliases work (`issue export`, `project export`, etc.)
- [ ] Dry-run modes work for all commands
- [ ] Validation mode works for imports
- [ ] Round-trip testing passes (export → import → verify)
- [ ] Waterfall matching works (identifier → id → title)
- [ ] Missing dependency handling works (error/skip/create)
- [ ] CLI flag overrides work

### Documentation
- [ ] README.md updated with comprehensive examples
- [ ] Help text includes alias information
- [ ] IMPORT_EXPORT.md design doc complete ✅
- [ ] Error messages are helpful with context

### Performance
- [ ] Export 100+ issues completes in <5 seconds
- [ ] Import 100+ issues completes in <10 seconds
- [ ] No N+1 query patterns
- [ ] Progress indicators for large operations

---

**End of Milestone M27 Plan**
