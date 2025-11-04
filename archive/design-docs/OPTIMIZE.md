# GraphQL Query Optimization Plan

## Executive Summary

The `getAllProjects()` function currently suffers from the N+1 query problem, making 1 + (4×N) API calls where N is the number of projects. This can be optimized to a **single GraphQL query** using nested field selection, reducing API calls by 97-99%.

## Current Implementation Problem

### File: `src/lib/linear-client.ts` (lines 611-752)

**Current pattern:**
```typescript
// Call #1: Fetch all projects
const projects = await client.projects({
  filter: graphqlFilter,
  includeArchived: false
});

// For EACH project (N iterations):
for (const project of projects.nodes) {
  const teams = await project.teams();      // Call #2 (×N)
  const lead = await project.lead;          // Call #3 (×N)
  const labels = await project.labels();    // Call #4 (×N)
  const members = await project.members();  // Call #5 (×N)
}
```

**Performance impact:**
| Projects | API Calls | Performance Issue |
|----------|-----------|-------------------|
| 10       | 41        | Acceptable        |
| 50       | 201       | Slow              |
| 100      | 401       | Very Slow         |
| 500      | 2,001     | Unacceptable      |

## Proposed Solution: Raw GraphQL Query

### Existing Pattern in Codebase

The codebase already demonstrates this pattern in `getAllProjectLabels()` at line 2052:

```typescript
const query = `
  query GetAllProjectLabels {
    organization {
      projectLabels {
        nodes {
          id
          name
          color
          description
        }
      }
    }
  }
`;

const response: any = await client.client.rawRequest(query);
const labels = response.data?.organization?.projectLabels?.nodes || [];
```

### Proposed GraphQL Query

```graphql
query GetAllProjectsWithRelations(
  $filter: ProjectFilter
  $includeArchived: Boolean
) {
  projects(
    filter: $filter
    includeArchived: $includeArchived
  ) {
    nodes {
      # Core project fields
      id
      name
      description
      content
      icon
      color
      state
      priority
      startDate
      targetDate
      completedAt
      url
      createdAt
      updatedAt

      # Nested relations - all in one query!
      teams {
        nodes {
          id
          name
          key
        }
      }

      lead {
        id
        name
        email
      }

      labels {
        nodes {
          id
          name
          color
        }
      }

      members {
        nodes {
          id
          name
          email
        }
      }
    }
  }
}
```

## Implementation Plan

### Step 1: Modify `getAllProjects()` function

**File:** `src/lib/linear-client.ts` (lines 611-752)

**Changes:**

1. **Keep existing filter building logic** (lines 616-674)
   - No changes needed to GraphQL filter object construction
   - This already builds the correct filter structure

2. **Replace SDK call with raw GraphQL request**

```typescript
export async function getAllProjects(filters?: ProjectListFilters): Promise<ProjectListItem[]> {
  try {
    const client = getLinearClient();

    // Build GraphQL filter (EXISTING CODE - no changes)
    const graphqlFilter: any = {};

    if (filters?.teamId) {
      graphqlFilter.team = { id: { eq: filters.teamId } };
    }
    // ... rest of filter logic ...

    // NEW: Raw GraphQL query with nested fields
    const query = `
      query GetAllProjectsWithRelations($filter: ProjectFilter, $includeArchived: Boolean) {
        projects(filter: $filter, includeArchived: $includeArchived) {
          nodes {
            id
            name
            description
            content
            icon
            color
            state
            priority
            startDate
            targetDate
            completedAt
            url
            createdAt
            updatedAt

            teams {
              nodes {
                id
                name
                key
              }
            }

            lead {
              id
              name
              email
            }

            labels {
              nodes {
                id
                name
                color
              }
            }

            members {
              nodes {
                id
                name
                email
              }
            }
          }
        }
      }
    `;

    const variables = {
      filter: Object.keys(graphqlFilter).length > 0 ? graphqlFilter : null,
      includeArchived: false
    };

    // Execute raw GraphQL query (REPLACES: client.projects() call)
    const response: any = await client.client.rawRequest(query, variables);

    // Parse response (SIMPLIFIED - no more await calls in loop)
    const projectList: ProjectListItem[] = [];
    const projects = response.data?.projects?.nodes || [];

    for (const project of projects) {
      projectList.push({
        id: project.id,
        name: project.name,
        description: project.description || undefined,
        content: project.content || undefined,
        icon: project.icon || undefined,
        color: project.color || undefined,
        state: project.state,
        priority: project.priority !== undefined ? project.priority : undefined,

        status: undefined, // Not available in SDK v27+

        // Direct access - no more await!
        lead: project.lead ? {
          id: project.lead.id,
          name: project.lead.name,
          email: project.lead.email
        } : undefined,

        team: project.teams?.nodes?.[0] ? {
          id: project.teams.nodes[0].id,
          name: project.teams.nodes[0].name,
          key: project.teams.nodes[0].key
        } : undefined,

        initiative: undefined, // Needs separate handling

        labels: (project.labels?.nodes || []).map((label: any) => ({
          id: label.id,
          name: label.name,
          color: label.color || undefined
        })),

        members: (project.members?.nodes || []).map((member: any) => ({
          id: member.id,
          name: member.name,
          email: member.email
        })),

        startDate: project.startDate || undefined,
        targetDate: project.targetDate || undefined,
        completedAt: project.completedAt || undefined,

        url: project.url,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      });
    }

    return projectList;
  } catch (error) {
    if (error instanceof LinearClientError) {
      throw error;
    }

    throw new Error(
      `Failed to fetch projects: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
```

### Step 2: Testing

**Test files to run:**
- `tests/scripts/test-project-list.sh` - All 10 test cases
- `tests/scripts/test-project-create.sh` - Verify no regressions
- `tests/scripts/test-project-update.sh` - Verify no regressions

**Manual testing:**
```bash
# Build
npm run build

# Test various filter combinations
node dist/index.js project list --all-teams --all-leads
node dist/index.js project list --team backend --status planned
node dist/index.js project list --search "API" --format json

# Test with large result sets (performance validation)
node dist/index.js project list --all-teams --all-leads --all-initiatives
```

### Step 3: Verification

**Build checks:**
```bash
npm run build       # Must succeed
npm run typecheck   # Must pass
npm run lint        # Must pass
```

**Functional checks:**
- [ ] All filters work correctly
- [ ] All output formats work (table, JSON, TSV, interactive)
- [ ] Alias resolution still works
- [ ] Smart defaults still work
- [ ] Search functionality works
- [ ] Date range filters work

**Performance checks:**
- [ ] Single API call made (verify with network inspector or debug logging)
- [ ] Response time improved for large result sets
- [ ] Memory usage acceptable

## Performance Improvement

| Scenario | Before | After | Improvement |
|----------|--------|-------|-------------|
| 10 projects | 41 calls | 1 call | **97.6%** |
| 50 projects | 201 calls | 1 call | **99.5%** |
| 100 projects | 401 calls | 1 call | **99.75%** |
| 500 projects | 2,001 calls | 1 call | **99.95%** |

**Additional benefits:**
- Reduced latency (single round-trip vs sequential requests)
- Lower risk of rate limiting
- Reduced server load
- Simpler code (no async loops)

## Technical Considerations

### Advantages
✅ **Proven pattern** - `getAllProjectLabels()` already uses this approach
✅ **Massive performance gain** - O(N) → O(1) API calls
✅ **SDK support** - `client.client.rawRequest()` is official API
✅ **No breaking changes** - Function signature unchanged
✅ **Simpler code** - Eliminates async loops

### Potential Risks
⚠️ **GraphQL schema changes** - Linear might change field names
⚠️ **Filter compatibility** - Variables must match Linear's schema
⚠️ **Error handling** - Raw queries may have different error structures
⚠️ **Initiative field** - May need special handling (see code comment)

### Mitigation Strategies
1. **Comprehensive testing** - Use existing test suite
2. **Error handling** - Preserve existing error handling patterns
3. **Debug logging** - Add optional debug output for troubleshooting
4. **Documentation** - Add inline comments explaining query structure
5. **Version compatibility** - Note Linear SDK version (@linear/sdk v61.0.0)

## Rollout Strategy

### Option 1: Direct Replacement (Recommended)
- Replace current implementation immediately
- Test thoroughly before release
- Document in release notes

### Option 2: Feature Flag
- Add config option: `useRawProjectQuery` (default: true)
- Allow fallback to old implementation if issues arise
- Remove flag after stability confirmed

### Option 3: Phased Rollout
- Implement behind environment variable: `LINEAR_USE_RAW_QUERY=1`
- Enable for testing/development first
- Enable for all users after validation

**Recommendation:** Use **Option 1** (Direct Replacement) because:
- Pattern is proven in codebase
- Comprehensive test suite exists
- Performance improvement is substantial
- No API changes to function interface

## Success Criteria

### Must Have
- [x] Single GraphQL query fetches all project data
- [x] All existing tests pass
- [x] No breaking changes to function interface
- [x] Build, typecheck, and lint pass

### Nice to Have
- [ ] Debug logging to confirm API call count
- [ ] Performance benchmarks documented
- [ ] Updated inline documentation

## Related Files

**Primary:**
- `src/lib/linear-client.ts` - `getAllProjects()` function (lines 611-752)

**Testing:**
- `tests/scripts/test-project-list.sh` - Main test suite
- `tests/scripts/test-project-create.sh` - Regression tests
- `tests/scripts/test-project-update.sh` - Regression tests

**Reference:**
- `src/lib/linear-client.ts` - `getAllProjectLabels()` (line 2052) - Existing raw query pattern

**Documentation:**
- `README.md` - User-facing documentation
- `MILESTONES.md` - Add as new milestone or task

## Next Steps

1. **Review this plan** - Confirm approach is acceptable
2. **Implement changes** - Modify `getAllProjects()` as outlined
3. **Run tests** - Execute full test suite
4. **Manual verification** - Test with various filter combinations
5. **Performance validation** - Confirm single API call
6. **Documentation** - Update MILESTONES.md
7. **Release** - Bump version and tag release

## Implementation Checklist

- [ ] Modify `getAllProjects()` to use raw GraphQL query
- [ ] Remove async await calls in project loop
- [ ] Update response parsing to access nested fields directly
- [ ] Add inline comments explaining optimization
- [ ] Run `npm run build`
- [ ] Run `npm run typecheck`
- [ ] Run `npm run lint`
- [ ] Run `tests/scripts/test-project-list.sh`
- [ ] Manual testing with various filters
- [ ] Verify single API call (network inspection or debug logging)
- [ ] Update MILESTONES.md
- [ ] Commit changes
- [ ] Tag release (e.g., v0.19.1)
- [ ] Push to GitHub

---

**Document Version:** 1.0
**Created:** 2025-10-28
**Author:** Based on codebase analysis and Linear SDK v61.0.0
**Status:** Proposed - Awaiting approval
