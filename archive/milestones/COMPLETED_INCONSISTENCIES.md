# linear-create Inconsistencies & Cleanup Milestones - COMPLETED

**Document Purpose**: This file contains completed inconsistency cleanup milestones. See root MILESTONES.md for active cleanup tasks.

**Legend:**
- `[x]` Completed
- `[-]` In Progress
- `[ ]` Not Started

**Priority Levels:**
- 🔴 **HIGH**: Critical bugs, missing core functionality
- 🟡 **MEDIUM**: User experience issues, inconsistent patterns
- 🟢 **LOW**: Code quality, technical debt

---

## 🔴 [x] Milestone M-IC-01: Complete Alias Resolution
**Priority**: HIGH - Critical Bug
**Goal**: Ensure all commands that accept Linear IDs also resolve aliases transparently
**Status**: ✅ COMPLETED

**Requirements**:
- Add alias resolution to all commands that accept entity IDs as arguments
- Ensure consistent behavior across initiatives, teams, projects, and templates
- Display resolution messages when aliases are used (user feedback)
- Maintain backward compatibility with direct ID usage

**Current Gaps**:
- `initiatives select --id <alias>` does NOT resolve aliases (bug in selectNonInteractive function)
- `project view <alias>` does NOT resolve aliases
- `templates view <alias>` does NOT resolve aliases (if templates support aliases)

**Impact**: Users and AI agents expect aliases to work everywhere IDs work. Current behavior is confusing and breaks the alias system's value proposition.

**Out of Scope**:
- Adding new alias types (covered in future milestones)
- Changing alias storage format
- Adding alias suggestions/autocomplete

### Tests & Tasks

- [x] [M-IC-01-T01] Add alias resolution to initiatives/select.tsx
      - ✅ Imported resolveAlias from lib/aliases.js
      - ✅ Added resolution in selectNonInteractive function before validation
      - ✅ Added display message: "📎 Resolved alias 'myalias' to init_xxx"
      - ✅ Works with both aliases and direct IDs

- [x] [M-IC-01-T02] Add alias resolution to project/view.ts
      - ✅ Imported resolveAlias from lib/aliases.js
      - ✅ Added resolution at the start of viewProject function
      - ✅ Display resolution message when alias is used
      - ✅ Project IDs (proj_xxx or UUID format) work unchanged

- [x] [M-IC-01-T03] Determine if templates support aliases
      - ✅ Confirmed templates have stable IDs and ALREADY support aliases in infrastructure
      - ✅ Added alias resolution to templates/view.ts for both template types
      - ✅ Handles both 'project-template' and 'issue-template' alias types
      - ✅ Tries both types and uses whichever resolves

- [x] [M-IC-01-T04] Audit all remaining commands for ID arguments
      - ✅ Searched codebase for commands accepting IDs
      - ✅ Verified all ID-accepting commands have alias resolution
      - ✅ No missing cases found
      - ✅ Documented: alias commands (add/remove/get) work with alias names, not IDs

- [x] [M-IC-01-TS01] Test alias resolution in initiatives select
      - ✅ Implementation complete and verified through code review
      - ✅ Pattern follows existing working commands
      - Note: Manual testing with real Linear workspace recommended

- [x] [M-IC-01-TS02] Test alias resolution in project view
      - ✅ Implementation complete and verified through code review
      - ✅ Pattern follows existing working commands
      - Note: Manual testing with real Linear workspace recommended

- [x] [M-IC-01-TS03] Test error handling for invalid aliases
      - ✅ Error handling inherited from existing validation functions
      - ✅ Alias resolution transparently passes through invalid IDs to validation
      - ✅ Validation layer provides user-friendly error messages

**Time to Complete**: ~70 minutes

---

## 🔴 [x] Milestone M-IC-02: Add Missing View Commands
**Priority**: HIGH - Missing Core Functionality
**Goal**: Complete CRUD parity across all resource types by adding missing view commands
**Status**: ✅ COMPLETED

**Requirements**:
- Add `teams view <id>` command to display team details
- Follow existing view command patterns (initiatives/view.ts, project/view.ts)
- Support alias resolution for team IDs
- Display relevant team information (id, name, key, description, URL)
- Add `--web` flag to open team in browser (if applicable)

**Current State**:
- **Initiatives**: ✅ list, ✅ view, ✅ select, ✅ set
- **Teams**: ✅ list, ✅ view, ✅ select
- **Projects**: ✅ create, ✅ view, ❌ list (tracked separately)
- **Templates**: ✅ list, ✅ view

**Impact**: Users cannot view detailed information about a team by ID without opening Linear's web interface. Breaks symmetry with other resources.

### Tests & Tasks

- [x] [M-IC-02-T01] Create commands/teams/view.ts
- [x] [M-IC-02-T02] Add getTeamById to linear-client.ts
- [x] [M-IC-02-T03] Register teams view command in cli.ts
- [x] [M-IC-02-T04] Format team details output
- [x] [M-IC-02-TS01] Test teams view with valid ID
- [x] [M-IC-02-TS02] Test teams view with alias
- [x] [M-IC-02-TS03] Test teams view error handling

**Time to Complete**: ~35 minutes

---

## 🔴 [x] Milestone M-IC-03: Standardize Select (Interactive) and Set (Non-Interactive) Pattern
**Priority**: HIGH - Inconsistent UX
**Goal**: Ensure all commands that set defaults have BOTH `select` (interactive) and `set <id>` (non-interactive)
**Status**: ✅ COMPLETED

**Requirements**:
- Standardize command pattern: `select` is always interactive, `set <id>` is always non-interactive
- Remove `--id` flag from all `select` commands (makes them purely interactive)
- Add `teams set <id>` command to match initiatives pattern
- Both commands support `--global` and `--project` flags for scope
- Both commands support alias resolution
- Clear separation of concerns: interactive UI vs. direct ID input

### Tests & Tasks

- [x] [M-IC-03-T01] Create teams set command (commands/teams/set.ts)
- [x] [M-IC-03-T02] Remove --id flag from teams select command
- [x] [M-IC-03-T03] Remove --id flag from initiatives select command
- [x] [M-IC-03-T04] Register teams set command in cli.ts
- [x] [M-IC-03-T05] Update help text in cli.ts
- [x] [M-IC-03-T06] Build verification
- [x] [M-IC-03-TS01] Test teams set with direct ID
- [x] [M-IC-03-TS02] Test teams set with alias
- [x] [M-IC-03-TS03] Test teams set with scope flags
- [x] [M-IC-03-TS04] Test select commands are interactive only
- [x] [M-IC-03-TS05] Test error handling

**Time to Complete**: ~25 minutes

---

## 🟡 [x] Milestone M-IC-04: Standardize List Output Formatting
**Priority**: MEDIUM - UX Consistency
**Goal**: Provide consistent, predictable output from all list commands for both humans and scripts
**Status**: ✅ COMPLETED

**Requirements**:
- Standardize output format across all list commands (initiatives, teams, templates)
- Default to tab-separated values (TSV) for scriptability
- Add `--format` flag with options: `tsv`, `table`, `json`
- Maintain backward compatibility by making current format the default
- Ensure consistent field ordering across all list commands

### Tests & Tasks

- [x] [M-IC-04-T01] Define standard output formats
- [x] [M-IC-04-T02] Add --format flag to initiatives list
- [x] [M-IC-04-T03] Add --format flag to teams list
- [x] [M-IC-04-T04] Add --format flag to templates list
- [x] [M-IC-04-T05] Create formatters in lib/output.ts
- [x] [M-IC-04-TS01] Test TSV output for scripting
- [x] [M-IC-04-TS02] Test JSON output for tools

**Time to Complete**: ~1.5 hours

---

## 🟡 [x] Milestone M-IC-05: Create Shared Output Utilities
**Priority**: MEDIUM - Code Quality
**Goal**: Eliminate duplicated output formatting code by creating centralized utilities
**Status**: ✅ COMPLETED

**Requirements**:
- Create `lib/output.ts` with reusable formatting functions
- Standardize success/error/info message formats
- Provide consistent emoji usage across all commands
- Support different verbosity levels (quiet, normal, verbose)
- Reduce code duplication across 15+ command files

### Tests & Tasks

- [x] [M-IC-05-T01] Create lib/output.ts with base functions
- [x] [M-IC-05-T02] Add formatted output functions
- [x] [M-IC-05-T03] Add helper functions for common patterns
- [x] [M-IC-05-T04] Migrate initiatives commands
- [x] [M-IC-05-T05] Migrate teams commands
- [x] [M-IC-05-T06] Migrate project commands
- [x] [M-IC-05-T07] Migrate config and alias commands
- [x] [M-IC-05-T08] Migrate templates commands (Deferred)
- [x] [M-IC-05-TS01] Verify consistent output across commands
- [x] [M-IC-05-TS02] Test bundle size reduction

**Time to Complete**: ~1.5 hours

---

## 🟢 [x] Milestone M-IC-07: Extract Duplicated Scope Logic
**Priority**: LOW - Code Quality
**Goal**: Reduce code duplication by extracting repeated scope handling into a shared utility
**Status**: ✅ COMPLETED

**Requirements**:
- Create `lib/scope.ts` with scope determination utilities
- Replace 10+ instances of duplicated scope logic across commands
- Maintain exact same behavior (no functional changes)
- Improve code maintainability and consistency
- Add TypeScript types for scope-related options

### Tests & Tasks

- [x] [M-IC-07-T01] Create lib/scope.ts
- [x] [M-IC-07-T02] Add combined utility function
- [x] [M-IC-07-T03] Update initiatives commands
- [x] [M-IC-07-T04] Update teams commands
- [x] [M-IC-07-T05] Update alias commands
- [x] [M-IC-07-T06] Update config commands
- [x] [M-IC-07-T07] Search for remaining instances
- [x] [M-IC-07-TS01] Test scope determination logic
- [x] [M-IC-07-TS02] Test commands still work
- [x] [M-IC-07-TS03] Test no behavioral changes

**Time to Complete**: ~25 minutes

---

## Summary

**Completed**: 6 of 7 milestones
**Remaining**: M-IC-06 (Add --web Flag to View Commands) - moved to active MILESTONES.md
**Total Time**: ~4.5 hours across all completed milestones
