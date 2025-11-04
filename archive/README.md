# Archive Directory

This directory contains historical documentation, completed milestone analysis, and planning documents that are no longer actively needed but preserved for reference.

## Directory Structure

### `m15-issue-commands/` - Issue Commands Milestone (v0.24.0 - COMPLETED)
Completed milestone released as v0.24.0. Contains bug analysis and fixes from M15 development.

**Files:**
- `BUGS_M15-1.md` - M15.1 bug analysis
- `BUGS_M15-2.md` - M15.2 bug analysis
- `BUGS_M15-3.md` - M15.3 bug analysis
- `BUGS_M15-4.md` - M15.4 bug analysis
- `BUGS_M15-5.md` - M15.5 bug analysis
- `BUGS_TEST_ANALYSIS.md` - Analysis of test bugs
- `BUGS_TEST_ANALYSIS_FIXES.md` - Implementation report (6/6 tests fixed)
- `ISSUE.md` - Original M15 specification (if archived)

**Status:** ✅ Milestone completed and released

---

### `m14-testing/` - Testing Infrastructure Plans (FUTURE)
Planning documents for M14 Testing Infrastructure milestone (not yet started).

**Files:**
- `M14_TS_IMPLEMENTATION_OVERVIEW.md` - Testing overview
- `M14_TS_P1_IMPLEMENTATION_UNIT.md` - Unit testing plan
- `M14_TS_P2_IMPLEMENTATION_E2E.md` - E2E testing plan
- `M14_VALIDITY_ANALYSIS.md` - Implementation validity check
- `M14_TS_IMPLEMENTATION_ORIGINAL.md` - Original implementation plan

**Status:** 📋 Future milestone - not yet in active MILESTONES.md

---

### `future-milestones/` - Unimplemented Milestone Plans
Planning documents for future milestones that haven't been started yet.

**Files:**
- `M20_IMPLEMENTATION.md` - M20 Project List & Search implementation plan
- `DEPENDENCIES.md` - M23 Project Dependency Management specification

**Status:** 📋 Backlog - awaiting prioritization

---

### `design-docs/` - Design Specifications & Analysis
Design documents, analysis reports, and technical specifications from various features.

**Files:**
- `DATES.md` - Date input design document (Phase 1 implemented v0.21.0, Phase 2-3 deferred)
- `ICONS.md` - Icon handling documentation & bug fix plan
- `ICON_VALIDATION_VERIFICATION_REPORT.md` - M14.6 verification report (Oct 2025)
- `OPTIMIZE.md` - GraphQL query optimization proposals
- `API_DATE_VALIDATION.md` - API validation technical documentation

**Status:** 📚 Reference material - mix of implemented and proposed features

---

### `milestones/` - Completed Milestone Documentation
Historical milestone tracking documents that have been superseded by current MILESTONES.md.

**Files:**
- `MILESTONES_01.md` - M01-M11, M13 (v0.1.0 through v0.13.1)
- `MILESTONES_02.md` - M12, M14-M15 milestone history
- `MILESTONES_03.md` - M20-M23 planning history

**Status:** 📜 Historical record

---

### `bugs/` - Bug Analysis Archives
Historical bug tracking and analysis documents.

**Files:**
- `BUGS_01.md` - Original bug tracking document

**Status:** 📜 Historical record

---

### `test-scripts/` - Archived Test Scripts
Deprecated or superseded test scripts.

**Files:**
- `test-api-bidirectional-simple.js` - Simple bidirectional API test

**Status:** 🗄️ Deprecated

---

## Accessing Archived Content

All archived files are preserved with full git history. To view the content:

```bash
# Read archived file
cat archive/m15-issue-commands/BUGS_M15-1.md

# View git history of archived file
git log --follow archive/design-docs/DATES.md

# Search across all archived files
grep -r "search term" archive/
```

## Archive Policy

Files are archived when they meet one of these criteria:

1. **Completed Work** - Milestone is released and bugs are fixed
2. **Superseded Documentation** - Planning docs replaced by implementation
3. **Future Planning** - Milestone plans not in active development
4. **Historical Reference** - Design docs for context but not active work

## See Also

- Current active milestones: `../MILESTONES.md`
- Project documentation: `../README.md`
- Version history: `../CHANGELOG.md`
