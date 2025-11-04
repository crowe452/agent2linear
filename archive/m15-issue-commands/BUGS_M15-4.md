# M15.4 Bug Analysis

**Milestone**: M15.4 - Issue Update Command (v0.24.0-alpha.4)
**Analysis Date**: 2025-10-31
**Status**: Not Started

This document contains a comprehensive bug analysis of Milestone M15.4 from MILESTONES.md, including detailed analysis for and against each bug's validity, fix options, and final recommendations.

---

## Bug Summary

**Total Bugs Found**: 6

### By Priority:
- **HIGH Priority (Should Fix)**: 1 bug
- **MEDIUM Priority (Improve Coverage)**: 4 bugs
- **LOW Priority (Non-Issues)**: 1 bug

### By Category:
- Missing Tests: 3 bugs
- Missing Implementation Tasks: 1 bug
- Organizational Issues: 2 bugs

---

## HIGH PRIORITY BUGS

### BUG-M15.4-11: Missing Documentation Task for README

**Location**: Error Cases section (misplaced)

**Description**: M15.3 has task M15.3-TS41 "Update README.md with issue create command examples" but M15.4 only has TS45 "Update README.md..." hidden in the Error Cases section without a proper task ID structure.

**Analysis FOR validity**:
- TS45 appears in Error Cases (line 724) which is wrong section
- Should be in Documentation group (like M15.3-T26)
- Inconsistent with M15.3 structure
- Documentation is not a test (TS prefix incorrect - should be T prefix)
- Makes milestone harder to navigate
- Documentation tasks should be clearly visible

**Analysis AGAINST validity**:
- Documentation might be part of final M15.6 or overall M15 completion
- Each alpha release might not need README updates
- Could update README once at end of M15
- Minor organizational issue

**Fix Options**:

**Option 1: Move to proper Documentation group and fix ID** (RECOMMENDED)
```markdown
**Documentation:**
- [ ] [M15.4-T40] Add comprehensive help text to issue update command:
      - Explain mutual exclusivity rules (--labels vs --add-labels/--remove-labels)
      - Document add/remove patterns for labels and subscribers
      - Show examples for common update workflows
      - Clarify clearing flags (--no-assignee, --no-due-date, etc.)
- [ ] [M15.4-T41] Update README.md with issue update command documentation and examples

**Error Cases:**
- [ ] [M15.4-TS43] Test error: invalid identifier (not found)
- [ ] [M15.4-TS44] Test error: conflicting flags (--labels and --add-labels)
- [ ] [M15.4-TS46] Test error: cycle with non-UUID/non-alias value
```
(Remove TS45 from Error Cases)

**Option 2: Keep TS45 but move to Documentation section**
```markdown
**Documentation:**
...
- [ ] [M15.4-TS45] Update README.md with issue update command documentation and examples
```

**Option 3: Remove entirely, defer to M15.6**
- Remove TS45
- Add to M15.6 or overall M15 completion

**Final Recommendation**: **FIX with Option 1**

**Rationale**: Add proper documentation task with correct ID (T41 instead of TS45) and place in Documentation section. Consistent with M15.3 pattern. Each command should document itself in README for alpha testing. Using proper task ID (T prefix for implementation tasks, TS prefix for tests) maintains milestone structure consistency.

---

## MEDIUM PRIORITY BUGS

### BUG-M15.4-07: Incomplete Test Coverage for Project Resolution Methods

**Location**: Group 6: Team & Organization Updates

**Description**: Task T21 uses project resolver which supports ID, alias, and name per M15.1-T21. But tests TS18-20 only generically test "assign to project" without testing each resolution method. Compare to M15.3-TS23-25 which explicitly test project by ID, name, and alias.

**Analysis FOR validity**:
- M15.3 has separate tests for each project resolution method (TS23: ID, TS24: name, TS25: alias)
- Inconsistent test coverage between create and update
- Name resolution (with fuzzy matching) especially needs testing
- Ensures all three resolution paths work in update context
- Different code paths might behave differently in update vs create

**Analysis AGAINST validity**:
- Infrastructure (M15.1-T21) already tests project resolver
- Update just reuses the resolver, no need to retest
- Would add 2+ extra tests for marginal value
- Over-testing infrastructure that's already validated

**Fix Options**:

**Option 1: Expand with multiple explicit tests**
```markdown
- [ ] [M15.4-TS19] Test assign to project by ID
- [ ] [M15.4-TS19a] Test assign to project by alias
- [ ] [M15.4-TS19b] Test assign to project by name (exact match)
- [ ] [M15.4-TS19c] Test error: ambiguous project name (multiple matches)
```

**Option 2: Add single consolidated test** (RECOMMENDED)
```markdown
- [ ] [M15.4-TS19] Test assign to project
- [ ] [M15.4-TS19a] Test project resolution (ID, alias, name) per M15.1-T21
```

**Option 3: Keep as-is**
- Rely on M15.1 infrastructure tests
- Current TS19 is sufficient

**Final Recommendation**: **FIX with Option 2**

**Rationale**: Add single consolidated test that verifies all three resolution methods work in update command context. This balances coverage with test count. While M15.1 tests the infrastructure, a command-level test ensures the integration works correctly. Option 2 is lighter weight than Option 1 but still provides validation.

---

### BUG-M15.4-08: Missing Test Coverage for Cycle Resolution Methods

**Location**: Group 6: Team & Organization Updates

**Description**: Similar to BUG-07, cycle supports both UUID and alias per M15.1-T22, but TS21 only tests "assign to cycle" generically. M15.3 has TS27 (UUID) and TS27a (alias) as separate tests.

**Analysis FOR validity**:
- M15.3 explicitly tests both cycle UUID and alias formats (TS27, TS27a)
- Ensures both resolution paths work in update context
- Cycle is mentioned in M15.1-T22a as supporting both formats
- Consistency with M15.3 pattern
- Cycle resolution is complex (two different formats)

**Analysis AGAINST validity**:
- Infrastructure already tested in M15.1
- Similar to project resolver argument (BUG-07)
- Adds test overhead
- Update command just delegates to resolver

**Fix Options**:

**Option 1: Split into two explicit tests** (RECOMMENDED)
```markdown
- [ ] [M15.4-TS21] Test assign to cycle by UUID
- [ ] [M15.4-TS21a] Test assign to cycle by alias
```

**Option 2: Keep TS21 but expand description**
```markdown
- [ ] [M15.4-TS21] Test assign to cycle (both UUID and alias formats per M15.1-T22)
```

**Option 3: Keep as-is**
- Current TS21 is sufficient

**Final Recommendation**: **FIX with Option 1**

**Rationale**: Split into two explicit tests for consistency with M15.3-TS27/TS27a pattern. Cycle resolution is complex enough (supporting two fundamentally different format types) to warrant explicit testing of both paths. This ensures both UUID and alias resolution work correctly in the update command context.

---

### BUG-M15.4-09: Missing Error Test for Invalid Subscriber in List

**Location**: Group 9: Subscriber Management (Three Modes)

**Description**: Labels group has TS33a testing "remove label that doesn't exist on issue (silent success)" and error cases for invalid IDs. Subscribers has no equivalent test for invalid subscriber ID/alias/email in comma-separated list.

**Analysis FOR validity**:
- Labels have thorough error coverage including invalid IDs
- Subscribers should have same error testing
- Comma-separated parsing with mixed formats needs validation
- Ensures proper error messages for typos in subscriber lists
- Email resolution adds complexity that needs testing
- Consistent error handling between labels and subscribers

**Analysis AGAINST validity**:
- Member resolution errors might be covered by M15.1-TS10-11
- Implementation task T36 might implicitly handle this
- May be over-testing
- Infrastructure tests might be sufficient

**Fix Options**:

**Option 1: Add comprehensive error tests** (RECOMMENDED)
```markdown
- [ ] [M15.4-TS36] Test remove subscribers
- [ ] [M15.4-TS36d] Test error: invalid subscriber ID/alias/email in list
- [ ] [M15.4-TS36e] Test remove subscriber not on issue (silent success)
```

**Option 2: Add single comprehensive subscriber error test**
```markdown
- [ ] [M15.4-TS36d] Test subscriber error cases (invalid ID, not on issue)
```

**Option 3: Keep as-is**
- Rely on member resolution infrastructure tests

**Final Recommendation**: **FIX with Option 1**

**Rationale**: Add explicit error tests for subscriber list validation. This ensures error messages are helpful and consistent with labels behavior. Testing removal of non-existent subscriber clarifies expected behavior (silent success, matching labels pattern). The comma-separated list with mixed formats (ID/alias/email) has enough complexity to warrant explicit validation testing.

---

### BUG-M15.4-10: Unclear Test TS04 - "No Update Options Provided"

**Location**: Group 1: Basic Field Updates (should be in Command Setup)

**Description**: Test TS04 says "Test error: no update options provided (only identifier)" but it's placed in "Group 1: Basic Field Updates" section, implying it's about field updates. This test should actually be in the Command Setup section since it tests T05 validation.

**Analysis FOR validity**:
- TS04 tests T05 validation logic (command setup)
- Misplaced in Group 1 (Basic Field Updates) where it doesn't belong
- Should be near T05 for clarity
- Organization issue affects milestone readability
- Makes it harder to understand which tests correspond to which tasks
- T05 is in Command Setup, TS04-05 should be there too

**Analysis AGAINST validity**:
- Test will still run regardless of placement
- Minor organizational issue, not a functional bug
- Test numbering already assigned
- Moving tests might cause confusion during implementation

**Fix Options**:

**Option 1: Move tests to Command Setup section** (RECOMMENDED)
```markdown
**Command Setup:**
- [ ] [M15.4-T01] Create src/commands/issue/update.ts file with commander setup
- [ ] [M15.4-T02] Register issue update command in src/cli.ts
- [ ] [M15.4-T03] Add `<identifier>` required argument (ENG-123 or UUID)
- [ ] [M15.4-T04] Implement identifier resolution using issue-resolver
- [ ] [M15.4-T05] Validate at least one update option is provided (error if none):
      - Count data-modifying flags: title, description, priority, estimate, state, dates, assignments,
        labels, subscribers, trash/untrash, team, project, cycle, parent
      - Exclude: --web (mode flag), --json (output format)
      - Error message: "No update options specified. Use --help to see available options."
- [ ] [M15.4-TS04] Test error: no update options provided (only identifier)
- [ ] [M15.4-TS04a] Test --web alone doesn't count as update (should error)

**Group 1: Basic Field Updates:**
- [ ] [M15.4-T06] Implement `--title <string>` option
- [ ] [M15.4-T07] Implement `--description <string>` option (inline)
...
- [ ] [M15.4-TS01] Test update title only
```

**Option 2: Add cross-reference note**
```markdown
**Group 1: Basic Field Updates:**
- [ ] [M15.4-T06] Implement `--title <string>` option
...
- [ ] [M15.4-TS01] Test update title only
...
- [ ] [M15.4-TS04] Test error: no update options provided (tests T05 from Command Setup)
- [ ] [M15.4-TS04a] Test --web alone doesn't count as update (tests T05 from Command Setup)
```

**Option 3: Keep as-is**
- Maintain stable test numbering
- Accept organizational inconsistency

**Final Recommendation**: **FIX with Option 1**

**Rationale**: Move tests to Command Setup section for better organization. Test organization matters for milestone clarity and maintenance. This improves readability without functional impact. Tests should be near the tasks they validate, making it easier to understand the milestone structure and track completion.

---

## LOW PRIORITY BUGS (Non-Issues)

### BUG-M15.4-01: Missing Test for --json Flag in "No Update Options" Validation

**Location**: Task M15.4-T05

**Description**: Task M15.4-T05 specifies that `--json` (like `--web`) should not count as an update option. Test TS04a covers `--web` alone should error, but there's no equivalent test for `--json` alone.

**Analysis FOR validity**:
- T05 explicitly excludes `--json` from data-modifying flags
- TS04a tests `--web` alone, establishing the pattern
- Consistency requires testing both output flags
- Parallel structure between --web and --json

**Analysis AGAINST validity**:
- Looking at the command design, `--json` might only be used for output formatting after a successful update
- May not be a command-line flag at all for update command (not listed in any implementation tasks)
- Could be a documentation/consistency issue rather than missing functionality
- Reviewing M15.4 tasks, there's no `--json` output implementation task listed
- M15.2 view command has M15.2-T09 for --json, but M15.4 has no such task
- The mention in T05 appears to be copied from another command

**Fix Options**:

**Option 1: Add test**
```markdown
- [ ] [M15.4-TS04b] Test --json alone doesn't count as update (should error)
```

**Option 2: Remove from T05 description** (RECOMMENDED)
```markdown
- [ ] [M15.4-T05] Validate at least one update option is provided (error if none):
      - Count data-modifying flags: title, description, priority, estimate, state, dates, assignments,
        labels, subscribers, trash/untrash, team, project, cycle, parent
      - Exclude: --web (mode flag)
      - Error message: "No update options specified. Use --help to see available options."
```

**Option 3: Add implementation task for --json output**
```markdown
**Group 11: Mode Options:**
- [ ] [M15.4-T39] Implement `-w, --web` flag to open updated issue in browser
- [ ] [M15.4-T40] Implement `--json` flag for JSON output format
- [ ] [M15.4-TS39] Test web mode (opens browser after update)
- [ ] [M15.4-TS40] Test JSON output format
```

**Final Recommendation**: **FIX with Option 2 (Remove from T05)**

**Rationale**: Reviewing the M15.4 tasks, there's no `--json` output implementation task listed (unlike M15.2 view command which has T09 for --json). The mention in T05 appears to be copied from another command or is a forward-looking reference. Remove `--json` from T05 description unless there's an intent to add JSON output (in which case use Option 3).

---

## Summary & Prioritized Recommendations

### Bugs by Status

| Priority | Count | Action |
|----------|-------|--------|
| HIGH | 1 | Fix immediately (documentation task) |
| MEDIUM | 4 | Close coverage & organization gaps |
| LOW | 1 | Spec cleanup |

### HIGH Priority Fixes (Required)

These issues block accurate milestone tracking and should be addressed first:

1. **BUG-M15.4-11**: Documentation task misplaced/mislabeled  
   - **Action**: Move the README update work into the Documentation group and convert `[M15.4-TS45]` into `[M15.4-T41]`.

**Total HIGH priority additions**:
- 1 implementation task (T41)
- 0 new test cases

### MEDIUM Priority Fixes (Recommended)

These items tighten end-to-end coverage and clarify the test plan:

1. **BUG-M15.4-07**: Incomplete project resolution tests  
   - **Action**: Add `[M15.4-TS19a]` covering ID, alias, and name resolution.

2. **BUG-M15.4-08**: Missing cycle resolution method tests  
   - **Action**: Split `[M15.4-TS21]` into explicit UUID coverage and add `[M15.4-TS21a]` for alias support.

3. **BUG-M15.4-09**: Missing subscriber error tests  
   - **Action**: Add `[M15.4-TS36d]` (invalid identifier) and `[M15.4-TS36e]` (removing non-member should be silent).

4. **BUG-M15.4-10**: Test organization issue  
   - **Action**: Relocate `[M15.4-TS04]`/`[M15.4-TS04a]` into the Command Setup section alongside `[M15.4-T05]`.

**Total MEDIUM priority additions**:
- 0 implementation tasks
- 4 test cases (TS19a, TS21a, TS36d, TS36e) plus an updated TS21 scope

### LOW Priority (Spec Cleanup)

1. **BUG-M15.4-01**: `--json` flag reference  
   - **Action**: Remove the unused `--json` bullet from `[M15.4-T05]`.

---

## Overall Impact Summary

### Total Estimated Changes

**If all HIGH + MEDIUM priority bugs are fixed**:
- **Implementation tasks to add**: 1 (`[M15.4-T41]`)
- **Test cases to add**: 4 (`[M15.4-TS19a]`, new `[M15.4-TS21a]`, `[M15.4-TS36d]`, `[M15.4-TS36e]`, with `[M15.4-TS21]` updated for UUID coverage)
- **Organizational/Text updates**: 2 (move `[M15.4-TS04/TS04a]`, remove `--json` from `[M15.4-T05]`)

### Test Count Impact

**Current M15.4 test count**: ~52 test cases  
**After fixes**: ~56 test cases (+4 tests, ~8% increase)

This keeps update-command coverage in line with the create command while accounting for the added resolution scenarios.

### Implementation Effort

**Estimated effort**:
- HIGH priority: ~0.5 hour (documentation restructure)
- MEDIUM priority: ~2-3 hours (new coverage)
- **Total**: ~2.5-3.5 hours of work

### Risk Assessment

**If HIGH priority bug is not fixed**:
- README work remains hidden under the wrong section, making the milestone checklist misleading.

**If MEDIUM priority bugs are not fixed**:
- Project and cycle resolution paths lack regression coverage.
- Subscriber error handling could regress silently.
- Command-setup validation remains harder to discover in the test plan.

---

## Next Steps

1. Update `MILESTONES.md` to promote `[M15.4-TS45]` into `[M15.4-T41]` under Documentation.
2. Add the missing project/cycle/subscriber tests and reorganize the command-setup tests.
3. Clean up the `[M15.4-T05]` description by removing the stray `--json` bullet.

---

## Verification

After applying the fixes:

- [ ] Confirm `[M15.4-TS04]`/`[M15.4-TS04a]` live under Command Setup.
- [ ] Verify `[M15.4-T41]` replaces `[M15.4-TS45]` in the Documentation group.
- [ ] Ensure new tests (`TS19a`, `TS21a`, `TS36d`, `TS36e`) are present and updated `TS21` explicitly states UUID coverage.
- [ ] Recount M15.4 tests (~57 cases) and update milestone totals if tracked elsewhere.

---

## Appendix: Quick Reference

### Bug ID Quick Lookup

| Bug ID | Title | Priority | Status |
|--------|-------|----------|--------|
| BUG-M15.4-11 | Documentation task placement | HIGH | Promote `[M15.4-TS45]` to `[M15.4-T41]` under Documentation |
| BUG-M15.4-07 | Project resolution tests | MEDIUM | Add `[M15.4-TS19a]` for ID/alias/name coverage |
| BUG-M15.4-08 | Cycle resolution tests | MEDIUM | Add `[M15.4-TS21a]` and update `[M15.4-TS21]` for UUID clarity |
| BUG-M15.4-09 | Subscriber error tests | MEDIUM | Add `[M15.4-TS36d]` and `[M15.4-TS36e]` |
| BUG-M15.4-10 | Test organization | MEDIUM | Move `[M15.4-TS04]`/`[M15.4-TS04a]` into Command Setup |
| BUG-M15.4-01 | `--json` reference | LOW | Remove `--json` from `[M15.4-T05]` description |

### Tasks to Add Summary

**Implementation Tasks** (1):
- `[M15.4-T41]` Document the issue update command in README (replaces `[M15.4-TS45]`)

**Test Cases** (4 new + 1 update):
- `[M15.4-TS19a]` Cover project resolution via ID, alias, and name
- `[M15.4-TS21a]` Verify cycle assignment by alias
- `[M15.4-TS36d]` Error when subscriber identifier cannot be resolved
- `[M15.4-TS36e]` Removing a subscriber who is not on the issue stays silent
- Update `[M15.4-TS21]` to state explicit UUID coverage

**Organizational/Text Updates** (2):
- Move `[M15.4-TS04]` and `[M15.4-TS04a]` to the Command Setup section
- Remove the `--json` reference from `[M15.4-T05]`

---

**End of Bug Analysis**
