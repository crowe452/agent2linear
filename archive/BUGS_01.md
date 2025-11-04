# Bug Analysis Report

**Analysis Date**: 2025-10-27
**Focus Areas**: Cache commands, Project create/update commands
**Scope**: Code review for bugs, potential issues, and edge cases

---

## Bug #2: Missing Cache Clear for Issue/Project Labels

**File**: `src/commands/cache/clear.ts:19-48`
**Severity**: 🟡 Low (Feature Gap)

### Issue
The cache clear command supports clearing `issue-labels` and `project-labels` entity types, but the clear logic in the switch statement only handles:
- teams
- initiatives
- members
- templates
- statuses

There's no case for `issue-labels` or `project-labels`.

```typescript
const validEntities = ['teams', 'initiatives', 'members', 'templates', 'issue-labels', 'project-labels', 'statuses'];
// ...
switch (options.entity) {
  case 'teams':
    clearTeamsCache();
    break;
  // ... other cases
  // MISSING: 'issue-labels' and 'project-labels' cases
}
```

### Analysis
**Is this a bug?** ✅ YES

### Why It's a Bug
1. **Validation allows it**: The command validates `issue-labels` and `project-labels` as valid entity types (line 19)
2. **Silent failure**: If a user runs `linear-create cache clear --entity issue-labels`, it will:
   - Pass validation ✓
   - Clear session cache via `cache.clearEntity()` ✓
   - Skip persistent cache clearing (missing switch case) ✗
   - Report success "Cache cleared successfully (session + persistent)" ✗ (false claim)
3. **Inconsistent behavior**: Only session cache gets cleared, not persistent cache

### Impact
- Users can't clear persistent cache for labels
- Command claims success but only partially works
- Persistent label cache stays stale even after "clearing"

### Recommendation
Either:
1. Add cases for `issue-labels` and `project-labels` in the switch statement
2. Remove them from `validEntities` if they're not supposed to be clearable
3. Add functions like `clearIssueLabelsCache()` and `clearProjectLabelsCache()` to `status-cache.ts`

---

## Bug #3: Missing Label Cache in Entity Cache

**File**: `src/lib/entity-cache.ts:62-63`
**Severity**: 🟡 Low (Incomplete Implementation)

### Issue
The `EntityCache` class declares private properties for label caching:
```typescript
private issueLabels?: CachedEntity<IssueLabel>;
private projectLabels?: CachedEntity<ProjectLabel>;
```

But there are no getter methods like `getIssueLabels()` or `getProjectLabels()` to fetch and cache them. The only label-related functionality is clearing them in `clearEntity()` and `invalidateIfExpired()`.

### Analysis
**Is this a bug?** ⚠️ PARTIAL BUG (Incomplete Feature)

This is an **incomplete implementation** rather than a traditional bug. The infrastructure is there but not connected.

### Why It's a Problem
1. **Dead code**: The label cache properties are declared but never populated
2. **Inconsistent with other entities**: Teams, initiatives, members, and templates all have full getter implementations
3. **Cache clear supports it**: Users can clear label caches, but they can never be populated
4. **No API calls exist**: Unlike other entities, there's no `getAllIssueLabels()` or `getAllProjectLabels()` in `linear-client.ts`

### Impact
- Label caching is non-functional
- No performance benefit for label lookups (every lookup hits the API)
- Status-cache.ts doesn't support labels either (only project-statuses, teams, initiatives, members, templates)

### Recommendation
Either:
1. Implement full label caching (add getters, Linear API calls, status-cache support)
2. Remove the unused properties and `clearEntity` cases for labels
3. Document that label caching is planned but not yet implemented

---

## Bug #7: Entity Cache - Team Options Parameter Ignored

**File**: `src/lib/entity-cache.ts:220-273`
**Severity**: 🟡 Low (Feature Incomplete)

### Issue
The `getMembers()` method accepts an `options?: { teamId?: string }` parameter but never uses it:

```typescript
async getMembers(options?: { teamId?: string }): Promise<Member[]> {
  // ... cache check logic

  // Cache miss - fetch from API
  const members = await getAllMembers(options);  // ✓ Passes to API

  // ... but then caches ALL members without filtering
  if (this.isCacheEnabled()) {
    this.members = {
      data: members,  // ✗ Caches potentially filtered results as "all members"
      timestamp
    };
  }

  return members;
}
```

### Analysis
**Is this a bug?** ✅ YES

### Why It's a Bug
1. **Cache pollution**: If you call `getMembers({ teamId: "team_123" })`, it caches only team_123's members
2. **Next call fails**: If you call `getMembers()` (no filter), it returns the cached team_123 members instead of all members
3. **Inconsistent behavior**: Cache should either:
   - Always cache all members and filter client-side
   - Cache per-team with separate cache keys

### Impact
- Team-filtered member queries pollute the global member cache
- Subsequent unfiltered queries return incorrect subset of members
- Hard to debug because it only breaks after a filtered query

### Recommendation
Since the code comment says "For now, we cache all members and filter client-side", the fix is:
```typescript
async getMembers(options?: { teamId?: string }): Promise<Member[]> {
  // Check session cache first
  if (this.isCacheEnabled() && this.isValid(this.members)) {
    const members = this.members!.data;
    // Filter client-side if needed
    if (options?.teamId) {
      return members.filter(m => m.teamIds?.includes(options.teamId));
    }
    return members;
  }

  // Fetch ALL members (ignore options.teamId)
  const members = await getAllMembers();  // Remove options parameter

  // Cache all members
  if (this.isCacheEnabled()) {
    this.members = { data: members, timestamp: Date.now() };
  }

  // Filter after caching
  if (options?.teamId) {
    return members.filter(m => m.teamIds?.includes(options.teamId));
  }
  return members;
}
```

---
## Bug #9: Resolution Module - Workflow State Resolution Not Implemented

**File**: `src/lib/resolution.ts:103-119`
**Severity**: 🟡 Low (Feature Incomplete)

### Issue
The `resolveStatus()` function has logic for workflow state resolution, but it's incomplete:

```typescript
// Workflow state resolution not yet implemented
// For now, assume input is valid ID or return error
if (input.startsWith('workflowState_')) {
  console.log(`   ✓ Using workflow state ID: ${input}`);
  return { success: true, id: input };
}
```

### Analysis
**Is this a bug?** ⚠️ INCOMPLETE FEATURE

### Why It's a Problem
1. **Only accepts IDs**: Can't resolve workflow states by name or alias (except through alias resolution)
2. **Inconsistent with project-status**: Project statuses get full name/ID lookup via cache
3. **User expectation**: Users expect `--status "In Progress"` to work for workflow states like it does for project statuses

### Impact
- Users must use IDs or aliases for workflow states
- No name-based lookup for workflow states
- Different UX from project status resolution

### Recommendation
Implement full workflow state resolution:
1. Add `getAllWorkflowStates()` to linear-client.ts
2. Add workflow state caching to status-cache.ts
3. Add name lookup logic like project-status has

---

## Summary

### Critical Bugs (None)
No critical bugs found.

### Moderate Bugs
- **Bug #2**: Missing cache clear for labels (validation passes, but fails silently)
- **Bug #7**: Entity cache team filter pollutes global cache

### Minor Issues
- **Bug #3**: Label caching infrastructure exists but not implemented

### Known Limitations
- **Bug #9**: Workflow state resolution not yet implemented (documented backlog)

### Recommendations Priority
1. **High**: Fix Bug #7 (team filter cache pollution)
2. **Medium**: Fix Bug #2 (add label cache clearing or remove from validation)
3. **Future**: Complete label caching implementation (Bug #3)
4. **Future**: Implement workflow state name resolution (Bug #9)
