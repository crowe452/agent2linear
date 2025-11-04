# linear-create Inconsistencies & Cleanup Milestones

**Document Purpose**: This file tracks remaining implementation inconsistencies. For completed inconsistencies, see [archive/milestones/COMPLETED_INCONSISTENCIES.md](archive/milestones/COMPLETED_INCONSISTENCIES.md).

**Legend:**
- `[x]` Completed
- `[-]` In Progress
- `[ ]` Not Started
- `[~]` Won't fix / Invalid / False positive

**Priority Levels:**
- 🔴 **HIGH**: Critical bugs, missing core functionality
- 🟡 **MEDIUM**: User experience issues, inconsistent patterns
- 🟢 **LOW**: Code quality, technical debt

---

## 🟡 [ ] Milestone M-IC-06: Add --web Flag to View Commands
**Priority**: MEDIUM - Feature Parity
**Goal**: Allow users to quickly open specific entities in their browser from view commands

**Requirements**:
- Add `--web` flag to `initiatives view`, `project view`, `templates view`
- When used, open the entity's specific URL in browser instead of displaying details
- Follow the pattern established in list commands (initiatives list --web, etc.)
- Handle cases where URL is not available gracefully
- Support all entity types that have web URLs

**Current State**:
- ✅ `initiatives list --web` - Opens Linear initiatives page
- ✅ `teams list --web` - Opens Linear teams page
- ✅ `templates list --web` - Opens Linear templates page
- ✅ `project create --web` - Opens Linear project creation page
- ❌ `initiatives view <id> --web` - Missing
- ❌ `teams view <id> --web` - Missing (command doesn't exist yet)
- ❌ `project view <id> --web` - Missing
- ❌ `templates view <id> --web` - Missing

**Impact**: Users need a quick way to view full details in Linear's web UI without manually constructing URLs

**Out of Scope**:
- Adding --web to commands that don't display entities
- Custom browser selection
- Deep linking to specific tabs/sections within Linear

### Tests & Tasks

- [ ] [M-IC-06-T01] Add --web flag to initiatives view
      - Add option: `-w, --web` to command in cli.ts
      - Check for flag at start of viewInitiative function
      - If flag present: get entity, open URL, exit
      - Use openInBrowser utility (already exists)
      - Update help text with --web example

- [ ] [M-IC-06-T02] Add --web flag to project view
      - Add option: `-w, --web`
      - Handle flag similar to initiatives
      - Project URL from API response
      - Update help text

- [ ] [M-IC-06-T03] Add --web flag to templates view
      - Add option: `-w, --web`
      - Template URL may be different format
      - Test that URL opens correct template in Linear
      - Update help text

- [ ] [M-IC-06-T04] Add --web flag to teams view (when created)
      - Dependency: M-IC-02 (teams view command)
      - Add --web support during creation
      - Team URL should open team workspace
      - Update help text

- [ ] [M-IC-06-T05] Handle missing URL gracefully
      - If entity doesn't have URL field, construct one
      - If construction not possible, show error
      - Fallback: open general Linear page for that entity type
      - User-friendly error messages

- [ ] [M-IC-06-TS01] Test --web with valid entities
      - Test: `initiatives view init_xxx --web`
      - Verify browser opens to correct initiative
      - Test: `project view proj_xxx --web`
      - Verify correct project opens

- [ ] [M-IC-06-TS02] Test --web with aliases
      - Create alias: `alias add initiative test init_xxx`
      - Test: `initiatives view test --web`
      - Should resolve alias, then open in browser
      - Verify correct entity opens

- [ ] [M-IC-06-TS03] Test --web with invalid IDs
      - Test: `project view invalid_id --web`
      - Should show error: entity not found
      - Should not attempt to open browser
      - Error message should be helpful

### Deliverable

```bash
# View initiative in browser
$ linear-create initiatives view init_abc123 --web
📎 Fetching initiative init_abc123...
🌐 Opening in browser: Q1 2024 Goals
✓ Browser opened to https://linear.app/workspace/initiative/q1-2024-goals

# View project in browser with alias
$ linear-create alias add project api proj_xyz789
$ linear-create project view api --web
📎 Resolved alias "api" to proj_xyz789
🌐 Opening project in browser...
✓ Browser opened to https://linear.app/workspace/project/api-development

# Error handling
$ linear-create project view invalid --web
❌ Error: Project with ID "invalid" not found
   Use "linear-create project list" to see available projects

# Help text updated
$ linear-create initiatives view --help
Usage: linear-create initiatives view <id> [options]

View details of a specific initiative

Options:
  -w, --web    Open initiative in browser instead of displaying in terminal
  -h, --help   display help for command

Examples:
  $ linear-create initiatives view init_abc123
  $ linear-create init view init_abc123 --web
  $ linear-create initiatives view myalias --web
```

### Automated Verification
- `npm run build` succeeds
- All view commands have --web option in help
- TypeScript compilation passes
- Lint checks pass

### Manual Verification
- Test --web on each view command
- Verify correct URL opens in browser
- Test with both direct IDs and aliases
- Test error handling with invalid IDs
- Verify browser opens on different platforms (macOS, Linux, Windows)

---

## 📝 Implementation Notes

### Completed Milestones
See [archive/milestones/COMPLETED_INCONSISTENCIES.md](archive/milestones/COMPLETED_INCONSISTENCIES.md) for:
- M-IC-01: Complete Alias Resolution ✅
- M-IC-02: Add Missing View Commands ✅
- M-IC-03: Standardize Select/Set Pattern ✅
- M-IC-04: Standardize List Output Formatting ✅
- M-IC-05: Create Shared Output Utilities ✅
- M-IC-07: Extract Duplicated Scope Logic ✅

### Estimated Time
- M-IC-06: ~1.5 hours

---

## 🎯 Next Steps

1. Review M-IC-06 and prioritize for an upcoming release
2. Schedule into MILESTONES.md when ready to implement
3. Track progress using the `[ ]` / `[-]` / `[x]` checkboxes
4. Update this document as inconsistencies are resolved
