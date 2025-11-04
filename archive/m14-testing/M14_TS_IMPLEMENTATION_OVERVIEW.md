# M14 Testing Implementation - Overview & Strategy

**Cross-References:**
- **[MILESTONES.md](./MILESTONES.md#milestone-m14)** - Master task tracking with M14-UT## and M14-E2E## IDs
- **[M14_TS_P1_IMPLEMENTATION_UNIT.md](./M14_TS_P1_IMPLEMENTATION_UNIT.md)** - Detailed unit test implementation
- **[M14_TS_P2_IMPLEMENTATION_E2E.md](./M14_TS_P2_IMPLEMENTATION_E2E.md)** - Detailed E2E test implementation

## Document Purpose

This document provides the **strategic overview** for Milestone M14 Testing Infrastructure. It explains how the two testing approaches (Unit and E2E) work together, provides the complete implementation timeline, and offers decision-making guidance.

### Document Navigation

📚 **Start here** if you want to understand:
- The overall M14 testing strategy
- How Unit and E2E tests complement each other
- Complete implementation timeline (5 weeks)
- Success criteria for the entire milestone

📖 **Then read the phase-specific documents**:
- **[M14_TS_P1_IMPLEMENTATION_UNIT.md](./M14_TS_P1_IMPLEMENTATION_UNIT.md)** - Detailed unit test implementation with Vitest
- **[M14_TS_P2_IMPLEMENTATION_E2E.md](./M14_TS_P2_IMPLEMENTATION_E2E.md)** - Detailed E2E test implementation with real Linear API

---

## Overview

Milestone M14 implements comprehensive testing infrastructure for the `linear-create` CLI tool using **two complementary approaches**:

### 1. Unit Test Implementation (Phase 1)
**Technology**: Vitest + TypeScript
**Purpose**: Fast, isolated component tests with mocking
**Speed**: Milliseconds
**When**: During development, on every commit
**Details**: See [M14_TS_P1_IMPLEMENTATION_UNIT.md](./M14_TS_P1_IMPLEMENTATION_UNIT.md)

### 2. E2E Test Implementation (Phase 2)
**Technology**: TypeScript + Real Linear API
**Purpose**: Integration validation with actual API calls
**Speed**: 2-5 minutes
**When**: Before releases, on PRs to main
**Details**: See [M14_TS_P2_IMPLEMENTATION_E2E.md](./M14_TS_P2_IMPLEMENTATION_E2E.md)

### Why Both?

**Unit tests** provide rapid feedback during development but use mocks that may not catch API changes or integration issues.

**E2E tests** validate real-world behavior and measure actual performance improvements but are slower and require careful workspace management.

**Together**, they provide:
- ⚡ **Fast feedback loop** (unit) + **Release confidence** (E2E)
- 📊 **Code coverage metrics** (unit) + **Performance validation** (E2E)
- 🔒 **Safe refactoring** (unit) + **Integration assurance** (E2E)

---

## Recommended Approach: Use Both Designs Together

### Testing Strategy

#### Development Phase (Daily)
**Use**: Unit Tests Only
```bash
# Start watch mode during development
npm run test:unit:watch

# Run in terminal, auto-runs on save
# Provides instant feedback on code changes
```

**Benefits**:
- Instant feedback (milliseconds)
- No API calls, no pollution
- Perfect for TDD workflow
- Coverage metrics guide development

#### Pre-Commit (Every Commit)
**Use**: Unit Tests + Linting
```bash
# Before committing
npm run test:unit
npm run lint
npm run typecheck
```

**Benefits**:
- Ensures code quality
- No broken tests in main branch
- Fast enough for pre-commit hook
- Catches regressions early

#### Pull Request (Before Merge)
**Use**: Unit Tests + E2E Tests
```bash
# On PR to main
npm run test:unit
npm run test:e2e
```

**Benefits**:
- Validates integration
- Confirms API call reduction
- Measures actual performance
- High confidence before merge

#### Pre-Release (Before Tagging)
**Use**: Full Test Suite + Manual Verification
```bash
# Complete validation
npm run test:unit:coverage
npm run test:e2e
npm run test:e2e:cleanup

# Then manual testing
node dist/index.js project create -I
```

**Benefits**:
- Complete coverage report
- Real-world validation
- Performance benchmarks
- User experience verification

---

### CI/CD Pipeline Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  # Run on every push
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run build
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test:unit:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  # Run only on PRs to main
  e2e:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request' && github.base_ref == 'main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run build
      - name: Run E2E Tests
        env:
          LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY_TEST }}
          E2E_RANDOM: true
        run: npm run test:e2e
      - name: Upload cleanup script
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-cleanup-script
          path: tests/e2e/cleanup-generated.sh
```

**Important Notes**:
- Use `secrets.LINEAR_API_KEY_TEST` pointing to a **dedicated test workspace**
- Never use production Linear workspace in CI
- E2E tests with `E2E_RANDOM=true` for CI (no manual config needed)
- Upload cleanup script as artifact for manual review

---

### Development Workflow

#### Typical Day: Feature Development

```bash
# 1. Start watch mode (runs automatically on save)
npm run test:unit:watch

# 2. Write code + tests iteratively
# Watch mode provides instant feedback

# 3. Before committing
npm run test:unit
git add .
git commit -m "feat: add new feature"

# 4. Before pushing
npm run lint
npm run typecheck
git push
```

**Time Investment**: Negligible - tests run in background

---

#### Weekly/Sprint: Feature Complete

```bash
# 1. Ensure all unit tests pass
npm run test:unit:coverage

# 2. Review coverage report (target: 80%+)
open coverage/index.html

# 3. Configure E2E tests (first time only)
npm run test:e2e:setup
# Select test team and initiative interactively

# 4. Run E2E tests
npm run test:e2e

# 5. Review created entities
npm run test:e2e:show-config

# 6. Cleanup test data
npm run test:e2e:cleanup
```

**Time Investment**: ~30-45 minutes (first time), ~10-15 minutes (subsequent)

---

#### Release Preparation

```bash
# 1. Full unit test suite with coverage
npm run test:unit:coverage

# 2. Verify coverage thresholds met
# Lines: 80%+, Functions: 80%+, Branches: 75%+

# 3. Run E2E tests
npm run test:e2e

# 4. Manual testing of key workflows
node dist/index.js project create -I
node dist/index.js project update -I

# 5. Performance verification
# Check E2E output for API call reduction metrics
# Target: 60-70% reduction

# 6. Cleanup E2E test data
npm run test:e2e:cleanup

# 7. Update MILESTONES.md
# Mark all tasks as [x] completed

# 8. Tag release
git tag v0.14.0
git push --tags
```

**Time Investment**: ~1-2 hours

---

## Complete Implementation Timeline

### Overview: 5 Weeks (Part-Time, ~4 hours/day)

**Total Estimated Effort**: ~74 hours
- Phase 1 (Unit): ~38 hours
- Phase 2 (E2E): ~36 hours

---

### Phase 1: Unit Test Infrastructure (Weeks 1-2)

#### Week 1: Infrastructure & Core Tests

**Day 1-2: Setup & Infrastructure (8 hours)**
- Install Vitest, @vitest/ui, @vitest/coverage-v8
- Create `tests/vitest.config.ts`
- Create `tests/setup.ts` with global test configuration
- Create mock fixtures in `tests/unit/fixtures/`
- Update `package.json` with test scripts
- Verify setup: `npm run test:unit` works

**Day 3-4: Validators & Parsers (6 hours)**
- ✅ **M14-UT01**: Write `tests/unit/lib/validators.test.ts` - Priority validation tests
- ✅ **M14-UT02**: Write `tests/unit/lib/parsers.test.ts` - Comma-separated/pipe-delimited/date parser tests
- Target: 100% coverage for validators and parsers modules

**Day 5: File Utils & Resolution (4 hours)**
- ✅ **M14-UT03**: Write `tests/unit/lib/file-utils.test.ts` - File reading tests with mocked fs
- ✅ **M14-UT04**: Write `tests/unit/lib/resolution.test.ts` - Alias resolution tests
- Target: 100% coverage for file-utils and resolution modules

**Week 1 Deliverable**: ~18 hours
- ✅ Vitest infrastructure fully configured
- ✅ 5 test files completed (validators, parsers, file-utils, resolution)
- ✅ Coverage: 100% for utility modules
- ✅ `npm run test:unit` passes all tests in <5 seconds

---

#### Week 2: Caching & Command Tests

**Day 1-2: Entity Cache Tests (8 hours)**
- ✅ **M14-UT05**: Write `tests/unit/lib/entity-cache.test.ts`
  - Test cache population, cache hits, cache expiration
  - Test singleton pattern
  - Test clear() and clearEntity() methods
  - Test findById() methods for all entity types
- Target: 85%+ coverage for entity-cache module

**Day 3: Batch Fetcher Tests (4 hours)**
- ✅ **M14-UT06**: Write `tests/unit/lib/batch-fetcher.test.ts`
  - Test prewarmProjectCreation() fetches all entities in parallel
  - Test prewarmProjectUpdate() fetches fewer entities
  - Test error handling (graceful failure on individual fetches)
  - Verify cache population after prewarm
- ✅ **M14-UT07**: Write `tests/unit/lib/status-cache.test.ts` - Persistent cache tests
- Target: 85%+ coverage for batch-fetcher and status-cache modules

**Day 4-5: Additional Module Tests (8 hours) - Optional Expansion**
- ✅ **M14-UT08**: Write `tests/unit/lib/config.test.ts` - Config module tests
- ✅ **M14-UT09**: Write `tests/unit/commands/cache/*.test.ts` - Cache command tests
- ✅ **M14-UT10**: Write `tests/unit/lib/linear-client.test.ts` - Linear client validation tests
- Target: 70%+ coverage for additional modules

**Week 2 Deliverable**: ~20 hours
- ✅ 3 additional test files (entity-cache, batch-fetcher, commands)
- ✅ Coverage: 85%+ for caching modules, 70%+ for commands
- ✅ All unit tests pass in <10 seconds
- ✅ Total unit test count: ~100+ test cases

**Phase 1 Total**: ~38 hours over 2 weeks

---

### Phase 2: E2E Test Infrastructure (Weeks 3-4)

#### Week 3: E2E Infrastructure

**Day 1-2: Configuration System (8 hours)**
- Create `tests/e2e/setup/e2e-config.ts` - Config manager (load/save/delete)
- Create `tests/e2e/setup/interactive-setup.ts` - Ink-based UI for team/initiative selection
- Create `tests/e2e/setup/random-selector.ts` - Random fallback for CI
- Create `tests/e2e-config.example.json` - Template for users
- Test interactive flow manually
- Add `tests/e2e-config.json` to `.gitignore`

**Day 3: Preflight & Validation (4 hours)**
- Create `tests/e2e/setup/preflight-check.ts`
  - Check for config or E2E_RANDOM flag
  - Check for LINEAR_API_KEY
  - Display helpful error messages with instructions
- Test both configuration modes (configured + random)

**Day 4: Test Framework (6 hours)**
- Create `tests/e2e/lib/api-call-tracker.ts` - TrackedLinearClient wrapper
- Create `tests/e2e/lib/cleanup-tracker.ts` - Track created entities, generate cleanup scripts
- Create `tests/e2e/lib/test-runner.ts` - E2E test framework
  - Setup, test registration, execution, cleanup
  - Pass/fail tracking
  - Summary reporting

**Week 3 Deliverable**: ~18 hours
- ✅ E2E infrastructure complete
- ✅ Interactive setup works (`npm run test:e2e:setup`)
- ✅ Preflight checks prevent misconfiguration
- ✅ Test framework ready for test specs

---

#### Week 4: E2E Test Specs & Documentation

**Day 1-2: Project Create & Update E2E (6 hours)**
- ✅ **M14-E2E01**: Write `tests/e2e/specs/project-create.e2e.ts`
  - Test project create with 5 members, verify API call reduction
  - Test project create without cache (baseline)
  - Track created projects for cleanup
  - Dynamic member lookup (no hardcoded values)
- ✅ **M14-E2E02**: Write `tests/e2e/specs/project-update.e2e.ts` (optional)
  - Test project update with caching
  - Verify API call reduction for updates

**Day 3: Caching Performance E2E (4 hours)**
- ✅ **M14-E2E04**: Write `tests/e2e/specs/caching-performance.e2e.ts`
  - Measure API call reduction: baseline vs. cached (target: 60-70%)
  - Compare call counts, assert reduction threshold
- ✅ **M14-E2E05**: Extend caching-performance test
  - Measure wall-clock time reduction (target: 50-70%)
  - Compare execution times, assert time threshold

**Day 4: Regression Tests (4 hours)**
- ✅ **M14-E2E03**: Write `tests/e2e/specs/regression.e2e.ts`
  - Test project create with all fields still works
  - Test project update still works identically
  - Verify fields: priority, color, dates, description, etc.

**Day 5: Documentation & Polish (4 hours)**
- Create `tests/README-E2E-TESTS.md` (user-facing guide)
  - Quick start, configuration modes, troubleshooting
  - CI/CD examples, best practices, FAQ
- Update `package.json` with E2E scripts:
  - `test:e2e`, `test:e2e:setup`, `test:e2e:reset`, `test:e2e:cleanup`, `test:e2e:show-config`
- Create `tests/e2e/runner.ts` - Main entry point
- Test full E2E flow end-to-end

**Week 4 Deliverable**: ~18 hours
- ✅ 3 E2E test spec files (project-create, caching-performance, regression)
- ✅ Complete E2E documentation (README-E2E-TESTS.md)
- ✅ NPM scripts configured
- ✅ E2E tests run successfully with real Linear API

**Phase 2 Total**: ~36 hours over 2 weeks

---

### Phase 3: Integration & Polish (Week 5)

**Day 1-2: Documentation Updates (8 hours)**
- Update main README.md with testing section
- Add testing examples to CLAUDE.md
- Cross-reference all three M14 documents
- Create testing workflow diagram (optional)

**Day 3-4: CI/CD Integration (8 hours)**
- Add GitHub Actions workflow for unit tests (on every push)
- Add GitHub Actions workflow for E2E tests (on PRs only)
- Configure secrets (LINEAR_API_KEY_TEST)
- Test CI workflows with real commits

**Day 5: Final Verification (4 hours)**
- Run complete test suite locally
- Verify coverage thresholds met
- Run E2E tests and validate performance metrics
- Update MILESTONES.md with completion status
- Tag release v0.14.0

**Phase 3 Total**: ~20 hours

---

## Timeline Summary

| **Phase** | **Duration** | **Hours** | **Key Deliverables** |
|-----------|--------------|-----------|----------------------|
| Phase 1: Unit Tests (Weeks 1-2) | 2 weeks | 38 hrs | Vitest infrastructure, ~100+ unit tests, 80%+ coverage |
| Phase 2: E2E Tests (Weeks 3-4) | 2 weeks | 36 hrs | E2E infrastructure, real API tests, performance validation |
| Phase 3: Integration (Week 5) | 1 week | 20 hrs | Documentation, CI/CD, final verification |
| **Total** | **5 weeks** | **~94 hrs** | **Complete M14 testing infrastructure** |

**Note**: Timeline assumes part-time work (~4 hours/day). Full-time work could complete in 2.5-3 weeks.

---

## Combined Success Criteria

### Phase 1: Unit Tests

#### Coverage Targets
- ✅ **80%+ lines** for utility modules (validators, parsers, file-utils, resolution)
- ✅ **85%+ lines** for caching modules (entity-cache, batch-fetcher)
- ✅ **70%+ lines** for command files (project-create, project-update)
- ✅ **All tests run in <10 seconds**

#### Quality Metrics
- ✅ Watch mode works smoothly (Vitest)
- ✅ CI integration complete (GitHub Actions)
- ✅ No flaky tests (100% deterministic)
- ✅ Clear, maintainable test code
- ✅ Coverage report generated (`npm run test:unit:coverage`)

#### Task Coverage
- ✅ **M14-UT01**: Validators module tests (priority, color, enum, date validation)
- ✅ **M14-UT02**: Parsers module tests (comma-separated, pipe-delimited, date parsing)
- ✅ **M14-UT03**: File-utils module tests (file reading with error handling)
- ✅ **M14-UT04**: Resolution module tests (alias resolution, status lookup)
- ✅ **M14-UT05**: Entity-cache module tests (cache population, hits, expiration)
- ✅ **M14-UT06**: Batch-fetcher module tests (parallel fetching, prewarm)
- ✅ **M14-UT07**: Status-cache module tests (persistent cache, TTL)
- ✅ **M14-UT08** (optional): Config module tests
- ✅ **M14-UT09** (optional): Cache command tests
- ✅ **M14-UT10** (optional): Linear-client validation tests

---

### Phase 2: E2E Tests

#### E2E Test Quality
- ✅ **Zero hardcoded values** (all dynamic lookups)
- ✅ **Safe configuration system** works (interactive + random modes)
- ✅ **API call reduction validated** (60-70% target met)
- ✅ **Cleanup tracking** generates scripts
- ✅ **Clear error messages** and failure modes

#### Performance Metrics
- ✅ **60-70% API call reduction** for project create (with caching)
- ✅ **50-70% wall-clock time reduction** (with caching)
- ✅ **E2E tests complete in 2-5 minutes**
- ✅ **No production data pollution** (safe workspace config)

#### Task Coverage
- ✅ **M14-E2E01**: Project create E2E with caching (basic validation)
- ✅ **M14-E2E02**: Project update E2E with caching (optional)
- ✅ **M14-E2E03**: Regression tests (behavior unchanged)
- ✅ **M14-E2E04**: API call reduction measurement (60-70% target)
- ✅ **M14-E2E05**: Wall-clock time reduction measurement (50-70% target)

#### User Experience
- ✅ **Setup process** is clear and guided (`npm run test:e2e:setup`)
- ✅ **Configuration is reusable** (saved to `tests/e2e-config.json`)
- ✅ **Random mode works** for CI (`E2E_RANDOM=true`)
- ✅ **Cleanup is tracked** and documented

---

### Overall Milestone Success

#### All Tests Pass
- ✅ `npm run test:unit` passes (all unit tests)
- ✅ `npm run test:e2e` passes (all E2E tests)
- ✅ `npm run test` passes (both combined)

#### Coverage & Quality
- ✅ Coverage report shows 80%+ overall
- ✅ No regressions in existing functionality
- ✅ Tests catch real bugs during development

#### Documentation Complete
- ✅ `tests/README-E2E-TESTS.md` created
- ✅ All three M14 documents cross-reference each other
- ✅ Main README.md updated with testing section

#### Developer Experience
- ✅ Setup instructions clear and working
- ✅ Tests run smoothly on first try
- ✅ Fast feedback during development (unit watch mode)
- ✅ Confidence for releases (E2E validation)

#### CI/CD Integration
- ✅ GitHub Actions workflow configured
- ✅ Unit tests run on every push
- ✅ E2E tests run on PRs to main
- ✅ Coverage reports uploaded to Codecov (optional)

---

## Questions to Resolve

Before or during implementation, consider these decision points:

### 1. Coverage Thresholds
**Question**: Are 80% line coverage / 80% function coverage / 75% branch coverage the right targets?

**Options**:
- **Current**: 80/80/75 (recommended by Vitest community)
- **Stricter**: 90/90/85 (may be too aggressive for CLI tool)
- **Relaxed**: 70/70/65 (may miss edge cases)

**Recommendation**: Start with 80/80/75, adjust after Phase 1 if needed.

---

### 2. E2E Frequency
**Question**: How often should E2E tests run in CI?

**Options**:
- **A) Every PR to main** (recommended) - High confidence, slower CI
- **B) Only on releases** - Faster CI, less confidence
- **C) Nightly builds** - Good middle ground

**Recommendation**: Option A (every PR to main) - E2E tests are only 2-5 minutes, worth the confidence.

---

### 3. Test Workspace
**Question**: Should we create a dedicated Linear workspace for CI testing?

**Options**:
- **A) Dedicated test workspace** (recommended) - Isolated, safe
- **B) Use existing workspace with test team** - Simpler, but pollutes data
- **C) Use disposable workspace** - Clean, but requires setup/teardown

**Recommendation**: Option A - Dedicated test workspace with API key in GitHub Secrets.

---

### 4. Cleanup Automation
**Question**: When will delete commands be implemented to automate E2E cleanup?

**Options**:
- **A) Part of M14** - Implement `project delete` command
- **B) Separate milestone** (M15?) - Focus M14 on testing only
- **C) Manual cleanup only** - Simplest, but inconvenient

**Recommendation**: Option B - Track in M15. M14 generates cleanup scripts, manual deletion for now.

---

### 5. Performance Benchmarks
**Question**: Should E2E tests include performance regression checks in CI?

**Options**:
- **A) Yes, fail CI if performance degrades** - Catches regressions
- **B) Report only (no CI failure)** - Informational
- **C) Manual benchmarks only** - Simplest

**Recommendation**: Option B initially, consider Option A after establishing baselines.

---

## Next Steps

### Getting Started

1. **Read this overview document** ✅ (you're here!)

2. **Understand both approaches**:
   - Unit: [M14_TS_P1_IMPLEMENTATION_UNIT.md](./M14_TS_P1_IMPLEMENTATION_UNIT.md)
   - E2E: [M14_TS_P2_IMPLEMENTATION_E2E.md](./M14_TS_P2_IMPLEMENTATION_E2E.md)

3. **Start with Phase 1 (Unit Tests)**:
   ```bash
   npm install -D vitest @vitest/ui @vitest/coverage-v8
   ```

4. **Follow the timeline** in each phase document

5. **Update MILESTONES.md** as you complete tasks

6. **Integrate both** approaches per the workflow recommendations

---

### Checklist for Starting Phase 1

- [ ] Read [M14_TS_P1_IMPLEMENTATION_UNIT.md](./M14_TS_P1_IMPLEMENTATION_UNIT.md) thoroughly
- [ ] Install Vitest dependencies: `npm install -D vitest @vitest/ui @vitest/coverage-v8`
- [ ] Create `tests/vitest.config.ts`
- [ ] Create `tests/setup.ts`
- [ ] Update `package.json` with test scripts
- [ ] Verify setup: `npm run test:unit` works (even with no tests)
- [ ] Create first test: `tests/unit/lib/validators.test.ts`
- [ ] Watch mode: `npm run test:unit:watch`

---

### Checklist for Starting Phase 2

- [ ] Complete Phase 1 (all unit tests passing)
- [ ] Read [M14_TS_P2_IMPLEMENTATION_E2E.md](./M14_TS_P2_IMPLEMENTATION_E2E.md) thoroughly
- [ ] Install Ink dependencies: `npm install ink ink-select-input react`
- [ ] Create E2E directory structure: `tests/e2e/`
- [ ] Implement config manager: `tests/e2e/setup/e2e-config.ts`
- [ ] Test interactive setup: `npm run test:e2e:setup`
- [ ] Create E2E test framework
- [ ] Write first E2E test spec

---

## Summary

**M14 Testing Infrastructure** delivers a comprehensive, two-phase testing solution:

- **Phase 1 (Weeks 1-2)**: Unit tests with Vitest provide rapid development feedback
- **Phase 2 (Weeks 3-4)**: E2E tests with real API validate integration and performance

**Total Investment**: ~5 weeks part-time (~94 hours)

**Outcome**:
- ✅ 80%+ code coverage (unit)
- ✅ 60-70% API call reduction validated (E2E)
- ✅ Fast feedback during development
- ✅ High confidence for releases
- ✅ CI/CD integration complete

**Start Now**: Begin with Phase 1 → [M14_TS_P1_IMPLEMENTATION_UNIT.md](./M14_TS_P1_IMPLEMENTATION_UNIT.md)

---

*Document Version: 1.0*
*Created: 2025-01-27*
*Purpose: Strategic overview and integration guide for M14 Testing Infrastructure*
