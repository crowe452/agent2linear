# Project Date Input - Design Document

## Overview

This document defines the comprehensive date input system for Linear projects, supporting flexible date formats, smart parsing, and interactive guidance while maintaining full manual control.

**Status:**
- ✅ **Phase 1 IMPLEMENTED (v0.21.0)**: Basic date formats (quarters, months, years, half-years, ISO dates) - See M22 in MILESTONES.md
- 🚧 **Phase 2 PENDING**: Relative shortcuts (this-quarter, next-month, +1q) - Deferred to M23
- 🚧 **Phase 3 PENDING**: Interactive date picker - Deferred to M23

**Implementation:** `src/lib/date-parser.ts` with 98%+ test coverage (93 unit tests)

## Linear's Date System

### How It Works

Linear uses a **two-field system** for project dates:

1. **Date field** (`startDate`, `targetDate`): Always stores an **ISO 8601 date** (YYYY-MM-DD)
2. **Resolution field** (`startDateResolution`, `targetDateResolution`): Controls **display and precision**

**Key principle**: The date is always a specific day internally, but resolution determines how Linear displays and interprets it.

### Resolution Types

| Resolution | Description | ISO Date Example | Linear Display |
|------------|-------------|------------------|----------------|
| **None** (undefined) | Specific day precision (default) | `2025-01-15` | "Jan 15, 2025" |
| **`month`** | Month-level precision | `2025-01-01` | "January 2025" |
| **`quarter`** | Quarter precision (Q1-Q4) | `2025-01-01` | "Q1 2025" |
| **`halfYear`** | Half-year precision (H1-H2) | `2025-01-01` | "H1 2025" |
| **`year`** | Year precision | `2025-01-01` | "2025" |

### Quarter & Half-Year Mapping

**Quarters** (resolution: `quarter`):
- **Q1**: January 1 (`YYYY-01-01`) - Covers Jan, Feb, Mar
- **Q2**: April 1 (`YYYY-04-01`) - Covers Apr, May, Jun
- **Q3**: July 1 (`YYYY-07-01`) - Covers Jul, Aug, Sep
- **Q4**: October 1 (`YYYY-10-01`) - Covers Oct, Nov, Dec

**Half-Years** (resolution: `halfYear`):
- **H1**: January 1 (`YYYY-01-01`) - First half of year (Jan-Jun)
- **H2**: July 1 (`YYYY-07-01`) - Second half of year (Jul-Dec)

**Months** (resolution: `month`):
- Always use the 1st day of the month: `YYYY-MM-01`

**Years** (resolution: `year`):
- Always use January 1st: `YYYY-01-01`

### Why ISO 8601?

The `YYYY-MM-DD` format is used because:
- ✅ **Unambiguous**: No confusion between US (MM/DD/YYYY) vs European (DD/MM/YYYY)
- ✅ **Sortable**: Alphabetical order = chronological order
- ✅ **Universal**: Standard across APIs, databases, and programming languages
- ✅ **Linear API requirement**: The GraphQL API expects this format

### Previously Considered Approaches

- **Option 1 – Strict manual input:** Keep today’s ISO-only fields with optional resolution flags. Low engineering effort but offers no improvement for users who struggle with formatting.
- **Option 2 – Fully interactive flow:** Require the guided picker for all input, ensuring correctness but slowing down power users and automation.

## Option 3: Hybrid Approach (Implementation Plan)

### Three Input Modes

1. **Smart Parser Mode** (non-interactive): Flexible, human-friendly formats
2. **Interactive Mode**: Guided picker with examples and validation
3. **Manual Override**: Explicit flags for full control

---

## Mode 1: Smart Parser (Non-Interactive)

### Supported Input Formats

Users can provide dates in natural formats, and the system auto-detects the resolution:

#### Quarter Formats
```bash
--start-date "2025-Q1"       # → date: 2025-01-01, resolution: quarter
--start-date "Q1 2025"       # → date: 2025-01-01, resolution: quarter
--start-date "2025-q1"       # → date: 2025-01-01, resolution: quarter (case-insensitive)
--start-date "q1-2025"       # → date: 2025-01-01, resolution: quarter

--target-date "2025-Q2"      # → date: 2025-04-01, resolution: quarter
--target-date "Q3 2025"      # → date: 2025-07-01, resolution: quarter
--target-date "2025-Q4"      # → date: 2025-10-01, resolution: quarter
```

**Validation**: Only Q1, Q2, Q3, Q4 accepted (case-insensitive)

#### Half-Year Formats
```bash
--start-date "2025-H1"       # → date: 2025-01-01, resolution: halfYear
--start-date "H1 2025"       # → date: 2025-01-01, resolution: halfYear
--start-date "2025-h1"       # → date: 2025-01-01, resolution: halfYear (case-insensitive)

--target-date "2025-H2"      # → date: 2025-07-01, resolution: halfYear
--target-date "H2 2025"      # → date: 2025-07-01, resolution: halfYear
```

**Validation**: Only H1, H2 accepted (case-insensitive)

#### Month Formats
```bash
--start-date "2025-01"       # → date: 2025-01-01, resolution: month
--start-date "2025-12"       # → date: 2025-12-01, resolution: month

--start-date "Jan 2025"      # → date: 2025-01-01, resolution: month
--start-date "January 2025"  # → date: 2025-01-01, resolution: month
--start-date "2025-Jan"      # → date: 2025-01-01, resolution: month

--start-date "Dec 2025"      # → date: 2025-12-01, resolution: month
--start-date "December 2025" # → date: 2025-12-01, resolution: month
```

**Validation**: Month number (01-12) or name (Jan-Dec, January-December), case-insensitive

#### Year Format
```bash
--start-date "2025"          # → date: 2025-01-01, resolution: year
--start-date "2026"          # → date: 2026-01-01, resolution: year
```

**Validation**: 4-digit year (reasonable range: 2000-2100)

#### Specific Date Format (Existing)
```bash
--start-date "2025-01-15"    # → date: 2025-01-15, resolution: none
--start-date "2025-03-31"    # → date: 2025-03-31, resolution: none
```

**Validation**: Valid ISO 8601 date

### Example Commands

```bash
# Quarter planning
linear-create proj create --title "Q1 Initiative" \
  --start-date "2025-Q1" \
  --target-date "2025-Q1"

# Half-year roadmap
linear-create proj create --title "H1 Goals" \
  --start-date "H1 2025" \
  --target-date "H1 2025"

# Month-level planning
linear-create proj create --title "January Sprint" \
  --start-date "Jan 2025" \
  --target-date "Jan 2025"

# Year-level strategy
linear-create proj create --title "2025 Strategy" \
  --start-date "2025" \
  --target-date "2025"

# Specific dates (existing behavior)
linear-create proj create --title "Feature Launch" \
  --start-date "2025-01-15" \
  --target-date "2025-03-31"

# Mixed precision (common in real planning)
linear-create proj create --title "Q1 Feature" \
  --start-date "2025-Q1" \
  --target-date "2025-02-15"
```

### Parser Output

The date parser returns:

```typescript
interface ParsedDate {
  success: true;
  date: string;                // ISO 8601: "2025-01-01"
  resolution?: 'month' | 'quarter' | 'halfYear' | 'year';  // undefined = specific day
  displayText: string;         // "Q1 2025" (for confirmation messages)
  inputFormat: 'quarter' | 'halfYear' | 'month' | 'year' | 'specific';
}
```

### Parser Priority & Precedence

When parsing date input, the parser applies patterns in the following priority order to handle ambiguous inputs:

**Priority 1: Relative Shortcuts** (Exact matches, case-insensitive)
- `this-quarter`, `this-q`, `next-month`, `today`, etc.
- Example: `"this-quarter"` → Always treated as shortcut

**Priority 2: Named Shortcuts** (Exact matches, case-insensitive)
- `q1`, `q2`, `h1`, `h2`, `jan`, `feb`, etc.
- Example: `"q1"` → Q1 of current year (not a typo for "Q1 2025")
- Example: `"jan"` → January of current year

**Priority 3: Offset Patterns** (Regex: `^[+-]\d+[qhmywd]$`)
- `+1q`, `-2m`, `+7d`, etc.
- Example: `"+1q"` → 1 quarter from now
- Example: `"-1m"` → 1 month before start of current month

**Priority 4: Explicit Format Patterns** (Order matters)
1. **Quarter with Year:** `2025-Q1`, `Q1 2025`, `q1-2025`
2. **Half-Year with Year:** `2025-H1`, `H1 2025`, `h1-2025`
3. **Month with Year:** `2025-01`, `Jan 2025`, `January 2025`, `2025-Jan`
4. **Year Only:** `2025`, `2026` (4-digit number)
5. **ISO Date:** `2025-01-15` (YYYY-MM-DD)

**Ambiguity Resolution Examples:**

| Input | Matches Multiple? | Resolution | Result |
|-------|-------------------|------------|--------|
| `"q1"` | Named shortcut (P2) vs. typo for "Q1 2025" | Named shortcut (P2) | Q1 of current year |
| `"2025"` | Year (P4.4) vs. part of "2025-Q1" | Year (P4.4) | Year 2025 (2025-01-01) |
| `"2025-01"` | Month (P4.3) vs. partial ISO date | Month (P4.3) | January 2025 |
| `"+1q"` | Offset (P3) | Offset (P3) | 1 quarter from now |
| `"jan"` | Named month (P2) vs. "Jan 2025" | Named month (P2) | January of current year |

**Implementation Pattern:**
```typescript
export function parseProjectDate(input: string): DateParseResult {
  const trimmed = input.trim();

  // P1: Check relative shortcuts (exact match)
  if (RELATIVE_SHORTCUTS.has(trimmed.toLowerCase())) {
    return resolveRelativeShortcut(trimmed);
  }

  // P2: Check named shortcuts (exact match)
  if (NAMED_SHORTCUTS.has(trimmed.toLowerCase())) {
    return resolveNamedShortcut(trimmed);
  }

  // P3: Check offset patterns (regex)
  const offsetMatch = trimmed.match(/^([+-]\d+)([qhmywd])$/i);
  if (offsetMatch) {
    return calculateOffset(offsetMatch);
  }

  // P4: Try explicit format patterns in order
  // P4.1: Quarter with year
  const quarterMatch = trimmed.match(/^(?:(\d{4})-?q(\d)|q(\d)[\s-]?(\d{4}))$/i);
  if (quarterMatch) { /* ... */ }

  // P4.2: Half-year with year
  const halfMatch = trimmed.match(/^(?:(\d{4})-?h(\d)|h(\d)[\s-]?(\d{4}))$/i);
  if (halfMatch) { /* ... */ }

  // P4.3: Month with year (multiple formats)
  // ... continue pattern matching

  // No match - return error with suggestions
  return {
    success: false,
    error: `Invalid date format: "${input}"`,
    suggestion: '...'
  };
}
```

**Case Sensitivity:**
- All patterns are case-insensitive
- `"Q1"`, `"q1"`, and `"Q1"` all work
- `"Jan"`, `"jan"`, and `"JAN"` all work

### Error Messages

When parsing fails, provide helpful guidance:

```
❌ Invalid date format: "2025-Q5"

Quarter must be Q1, Q2, Q3, or Q4. Examples:
  --start-date "2025-Q1"     → Q1 2025 (Jan 1 - Mar 31)
  --start-date "Q2 2025"     → Q2 2025 (Apr 1 - Jun 30)
  --start-date "Q3 2025"     → Q3 2025 (Jul 1 - Sep 30)
  --start-date "Q4 2025"     → Q4 2025 (Oct 1 - Dec 31)
```

```
❌ Invalid date format: "2025-H3"

Half-year must be H1 or H2. Examples:
  --start-date "2025-H1"     → H1 2025 (Jan 1 - Jun 30)
  --start-date "H2 2025"     → H2 2025 (Jul 1 - Dec 31)
```

```
❌ Invalid month: "2025-13"

Month must be 01-12 or name (Jan-Dec). Examples:
  --start-date "2025-01"     → January 2025
  --start-date "Jan 2025"    → January 2025
  --start-date "2025-12"     → December 2025
```

---

## Mode 2: Interactive Mode

### Date Selection Flow

When using `--interactive`, add date selection steps:

#### Step 1: Choose Precision
```
? Select date precision for Start Date:
  ○ Specific day (e.g., Jan 15, 2025)
  ○ Month (e.g., January 2025)
  ● Quarter (e.g., Q1 2025)          ← Selected
  ○ Half-year (e.g., H1 2025)
  ○ Year (e.g., 2025)
  ○ Skip (no start date)
```

#### Step 2: Enter Date (Based on Precision)

**If "Quarter" selected:**
```
? Enter start date:
  Examples: 2025-Q1, Q1 2025, 2025-q1

  Quarter reference:
    Q1 = Jan-Mar (starts Jan 1)
    Q2 = Apr-Jun (starts Apr 1)
    Q3 = Jul-Sep (starts Jul 1)
    Q4 = Oct-Dec (starts Oct 1)

  › 2025-Q1
```

**If "Half-year" selected:**
```
? Enter start date:
  Examples: 2025-H1, H1 2025, 2025-h1

  Half-year reference:
    H1 = Jan-Jun (starts Jan 1)
    H2 = Jul-Dec (starts Jul 1)

  › H1 2025
```

**If "Month" selected:**
```
? Enter start date:
  Examples: 2025-01, Jan 2025, January 2025

  › Jan 2025
```

**If "Year" selected:**
```
? Enter start date:
  Examples: 2025, 2026

  › 2025
```

**If "Specific day" selected:**
```
? Enter start date (YYYY-MM-DD):
  Examples: 2025-01-15, 2025-03-31

  › 2025-01-15
```

#### Step 3: Confirmation
```
✓ Start date parsed: Q1 2025
  → Stored as: 2025-01-01 (resolution: quarter)
  → Linear will display as: "Q1 2025"
```

### Interactive Mode Benefits

- **Guided**: Step-by-step with examples at each stage
- **Validated**: Real-time validation with helpful errors
- **Educational**: Users learn available formats
- **Preview**: Show how date will appear in Linear

---

## Mode 3: Manual Override

### Explicit Resolution Flags (Backward Compatible)

Users can still manually specify resolution for full control:

```bash
# Override auto-detection
linear-create proj create --title "Project" \
  --start-date "2025-01-01" \
  --start-date-resolution quarter \
  --target-date "2025-03-31" \
  --target-date-resolution month
```

### Resolution Precedence

When both smart format AND explicit resolution provided:

1. **Explicit `--*-resolution` flag takes precedence** (manual override)
2. If no explicit flag, **auto-detect from format**
3. If neither, **no resolution** (specific day)

Example:
```bash
# Smart parser would detect "quarter", but explicit flag overrides to "month"
--start-date "2025-Q1" --start-date-resolution month
# Result: date=2025-01-01, resolution=month (displays as "January 2025")
```

### Warning on Mismatch

Warn user if override doesn't match input format:
```
⚠️  Date format "2025-Q1" suggests quarter resolution, but you specified "month"
   Using month resolution as requested.
   Linear will display as: "January 2025"
```

---

## Implementation Structure

### 1. Date Parser Utility (`src/lib/date-parser.ts`)

```typescript
/**
 * Smart date parser for Linear project dates
 * Supports quarters (Q1-Q4), half-years (H1-H2), months, years, and specific dates
 */

export interface ParsedDate {
  success: true;
  date: string;                // ISO 8601 format: YYYY-MM-DD
  resolution?: 'month' | 'quarter' | 'halfYear' | 'year';  // undefined = specific day
  displayText: string;         // Human-readable: "Q1 2025"
  inputFormat: 'quarter' | 'halfYear' | 'month' | 'year' | 'specific';
}

export interface DateParseError {
  success: false;
  error: string;               // Error message describing what went wrong
  suggestion: string;          // Helpful examples showing correct format
}

export type DateParseResult = ParsedDate | DateParseError;

/**
 * Parse flexible date input formats
 */
export function parseProjectDate(input: string): DateParseResult;

/**
 * Validate explicit ISO date
 */
export function validateISODate(date: string): boolean;

/**
 * Get quarter start date (1-4 → ISO date)
 * Note: Runtime validation should ensure quarter is 1-4 when dynamically calculated
 */
export function getQuarterStartDate(year: number, quarter: number): string;

/**
 * Get half-year start date (1-2 → ISO date)
 * Note: Runtime validation should ensure half is 1 or 2 when dynamically calculated
 */
export function getHalfYearStartDate(year: number, half: number): string;

/**
 * Get month start date
 */
export function getMonthStartDate(year: number, month: number): string;

/**
 * Parse month name to number (Jan → 1, December → 12)
 */
export function parseMonthName(monthName: string): number | null;

/**
 * Format parsed date for display confirmation
 * Note: ParsedDate.displayText already contains formatted text. This function
 * is for additional formatting contexts (e.g., adding icons, colors, or other metadata).
 */
export function formatDateDisplay(parsed: ParsedDate): string;
```

### 2. Update Commands

#### `src/commands/project/create.tsx`

```typescript
// Modify createProjectNonInteractive function:

// Parse smart date formats
let parsedStartDate: ParsedDate | undefined;
let parsedTargetDate: ParsedDate | undefined;

if (options.startDate) {
  const result = parseProjectDate(options.startDate);
  if (!result.success) {
    console.error(`❌ Invalid start date: ${result.error}`);
    console.error(result.suggestion);
    process.exit(1);
  }
  parsedStartDate = result;

  // Check for manual override (warn if mismatch, but use explicit flag)
  if (options.startDateResolution && options.startDateResolution !== parsedStartDate.resolution) {
    console.warn(`⚠️  Date format "${options.startDate}" suggests ${parsedStartDate.inputFormat} resolution,`);
    console.warn(`   but you specified "${options.startDateResolution}"`);
    console.warn(`   Using ${options.startDateResolution} resolution as requested.`);
  }

  console.log(`📅 Start date: ${parsedStartDate.displayText}`);
}

// Similar for targetDate...

// Pass to API (explicit resolution flag takes precedence over parsed resolution)
const projectData: ProjectCreateInput = {
  // ...
  startDate: parsedStartDate?.date,
  startDateResolution: options.startDateResolution ?? parsedStartDate?.resolution,
  targetDate: parsedTargetDate?.date,
  targetDateResolution: options.targetDateResolution ?? parsedTargetDate?.resolution,
};
```

#### `src/commands/project/update.ts`

Add date parsing to update command (currently missing resolution support):

```typescript
interface UpdateOptions {
  status?: string;
  name?: string;
  description?: string;
  priority?: number;
  targetDate?: string;
  targetDateResolution?: 'month' | 'quarter' | 'halfYear' | 'year';  // ADD
  startDate?: string;
  startDateResolution?: 'month' | 'quarter' | 'halfYear' | 'year';   // ADD
}

// Parse dates using smart parser
// Support resolution updates
```

### 3. Interactive Components

#### `src/ui/components/DateInput.tsx`

New component for interactive date selection:

```typescript
interface DateInputProps {
  label: string;
  value?: { date: string; resolution?: string };
  onChange: (parsed: ParsedDate) => void;
  allowSkip?: boolean;
}

export function DateInput(props: DateInputProps) {
  // Step 1: Choose precision
  // Step 2: Enter date with examples
  // Step 3: Validate and confirm
  // Show preview of how it will display in Linear
}
```

### 4. Help Text Updates

#### CLI Help (`src/cli.ts`)

Update help text to show new formats:

```
Options:
  --start-date <date>
    Planned start date. Supports multiple formats:
      Specific day:  2025-01-15
      Month:         2025-01, Jan 2025, January 2025
      Quarter:       2025-Q1, Q1 2025
      Half-year:     2025-H1, H1 2025
      Year:          2025

  --start-date-resolution <resolution>
    Manual override for date resolution (optional)
    Choices: "month", "quarter", "halfYear", "year"
    Note: Usually auto-detected from date format

  --target-date <date>
    Target completion date (same formats as --start-date)

  --target-date-resolution <resolution>
    Manual override for target date resolution (optional)

Examples:
  # Quarter planning
  $ linear-create proj create --title "Q1 Goals" --start-date "2025-Q1" --target-date "Q1 2025"

  # Half-year roadmap
  $ linear-create proj create --title "H1 Strategy" --start-date "H1 2025" --target-date "2025-H2"

  # Month precision
  $ linear-create proj create --title "Jan Sprint" --start-date "Jan 2025"

  # Specific dates
  $ linear-create proj create --title "Launch" --start-date "2025-01-15" --target-date "2025-03-31"

  # Mixed precision (common)
  $ linear-create proj create --title "Feature" --start-date "2025-Q1" --target-date "2025-02-15"

  # Manual override
  $ linear-create proj create --title "Project" \
      --start-date "2025-01-01" --start-date-resolution quarter
```

---

## Validation Rules

### Quarter Validation
- Must be Q1, Q2, Q3, or Q4 (case-insensitive)
- Year must be valid (2000-2100)
- Maps to correct start month:
  - Q1 → January (01)
  - Q2 → April (04)
  - Q3 → July (07)
  - Q4 → October (10)

### Half-Year Validation
- Must be H1 or H2 (case-insensitive)
- Year must be valid (2000-2100)
- Maps to correct start month:
  - H1 → January (01)
  - H2 → July (07)

### Month Validation
- Number: 01-12 (with or without leading zero)
- Name: Jan-Dec, January-December (case-insensitive)
- Year must be valid (2000-2100)

### Year Validation
- 4-digit year
- Reasonable range: 2000-2100

### Specific Date Validation
- Valid ISO 8601: YYYY-MM-DD
- Must be a real date (no Feb 30, etc.)

---

## Testing Strategy

### Unit Tests (`src/lib/date-parser.test.ts`)

Test all input formats:

```typescript
describe('parseProjectDate', () => {
  describe('Quarter formats', () => {
    it('parses "2025-Q1"', () => {
      const result = parseProjectDate('2025-Q1');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.date).toBe('2025-01-01');
        expect(result.resolution).toBe('quarter');
        expect(result.displayText).toBe('Q1 2025');
        expect(result.inputFormat).toBe('quarter');
      }
    });

    it('parses "Q2 2025"', () => {
      const result = parseProjectDate('Q2 2025');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.date).toBe('2025-04-01');
        expect(result.resolution).toBe('quarter');
        expect(result.displayText).toBe('Q2 2025');
        expect(result.inputFormat).toBe('quarter');
      }
    });

    it('is case-insensitive', () => {
      const result = parseProjectDate('2025-q1');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.date).toBe('2025-01-01');
        expect(result.resolution).toBe('quarter');
        expect(result.displayText).toBe('Q1 2025');
        expect(result.inputFormat).toBe('quarter');
      }
    });

    it('rejects invalid quarters', () => {
      const result = parseProjectDate('2025-Q5');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Q1, Q2, Q3, or Q4');
        expect(result.suggestion).toBeDefined();
      }
    });
  });

  describe('Half-year formats', () => {
    // Similar tests for H1, H2
  });

  describe('Month formats', () => {
    // Tests for YYYY-MM, "Jan 2025", "January 2025"
  });

  describe('Year format', () => {
    // Tests for "2025"
  });

  describe('Specific date format', () => {
    // Tests for ISO 8601
  });
});
```

### Integration Tests

Test end-to-end CLI commands:

```bash
# Test quarter input
linear-create proj create --title "Q1 Test" --start-date "2025-Q1" --team test_team

# Verify: date=2025-01-01, resolution=quarter

# Test interactive mode
linear-create proj create --interactive
# Manually select "Quarter", enter "Q1 2025"
# Verify correct parsing

# Test manual override
linear-create proj create --title "Override" --start-date "2025-Q1" --start-date-resolution month
# Verify warning, uses "month" resolution
```

---

## Documentation Updates

### Update Existing Docs

1. **README.md**: Add examples with new date formats
2. **test.md**: Add test cases for date parsing
3. **CLAUDE.md**: Update milestone templates to use smart dates

### New Documentation Section

Add "Working with Dates" section to README:

```markdown
## Working with Project Dates

Linear projects support flexible date precision from specific days to entire years.

### Date Input Formats

**Quarters** (Q1-Q4):
```bash
--start-date "2025-Q1"     # Q1 2025 (Jan-Mar)
--start-date "Q2 2025"     # Q2 2025 (Apr-Jun)
```

**Half-years** (H1-H2):
```bash
--start-date "2025-H1"     # H1 2025 (Jan-Jun)
--start-date "H2 2025"     # H2 2025 (Jul-Dec)
```

**Months**:
```bash
--start-date "2025-01"     # January 2025
--start-date "Jan 2025"    # January 2025
```

**Years**:
```bash
--start-date "2025"        # 2025
```

**Specific dates**:
```bash
--start-date "2025-01-15"  # Jan 15, 2025
```

See DATES.md for complete documentation.
```

---

## Migration & Backward Compatibility

### Existing Commands Keep Working

All existing commands continue to function:

```bash
# Explicit resolution (existing)
linear-create proj create --title "Project" \
  --start-date "2025-01-01" \
  --start-date-resolution quarter
```

### No Breaking Changes

- Smart parsing is additive
- Explicit flags still supported
- ISO dates still work
- Manual resolution override preserved

### Deprecation Timeline

No deprecations needed - all modes coexist.

---

## Relative Date Shortcuts (Recommended Addition)

### Overview

Inspired by tools like Superhuman, add relative date shortcuts that calculate dates based on "now" (current date). These make planning faster and more intuitive.

### Why Relative Shortcuts?

**Use Cases:**
- **Quick planning**: "Start this quarter, end next quarter"
- **Rolling planning**: Commands stay relevant (no need to update "2025-Q1" to "2025-Q2")
- **Natural workflow**: Think in terms of "this month" vs specific dates
- **Reduced errors**: No need to calculate quarter start dates manually

### Recommended Shortcuts

#### Quarter Shortcuts

**Current Period:**
```bash
--start-date "this-quarter"      # Current quarter (e.g., if today is Feb 2025 → Q1 2025)
--start-date "this-q"            # Alias
--start-date "current-quarter"   # Alias
```

**Relative:**
```bash
--start-date "next-quarter"      # Next quarter from today
--start-date "next-q"            # Alias

--start-date "last-quarter"      # Previous quarter from today
--start-date "prev-quarter"      # Alias
--start-date "previous-quarter"  # Alias
```

**Offset:**
```bash
--start-date "+1q"               # 1 quarter from now
--start-date "+2q"               # 2 quarters from now
--start-date "-1q"               # 1 quarter ago
```

**Named (from start of year):**
```bash
--start-date "q1"                # Q1 of current year
--start-date "q2"                # Q2 of current year
--start-date "q3"                # Q3 of current year
--start-date "q4"                # Q4 of current year
```

#### Half-Year Shortcuts

**Current Period:**
```bash
--start-date "this-half"         # Current half-year (e.g., if today is Mar 2025 → H1 2025)
--start-date "this-h"            # Alias
--start-date "current-half"      # Alias
```

**Relative:**
```bash
--start-date "next-half"         # Next half-year from today
--start-date "next-h"            # Alias

--start-date "last-half"         # Previous half-year
--start-date "prev-half"         # Alias
```

**Offset:**
```bash
--start-date "+1h"               # 1 half-year from now
--start-date "-1h"               # 1 half-year ago
```

**Named (from start of year):**
```bash
--start-date "h1"                # H1 of current year
--start-date "h2"                # H2 of current year
```

#### Month Shortcuts

**Current Period:**
```bash
--start-date "this-month"        # Current month (e.g., if today is Feb 15 → February 2025)
--start-date "this-m"            # Alias
--start-date "current-month"     # Alias
```

**Relative:**
```bash
--start-date "next-month"        # Next month from today
--start-date "next-m"            # Alias

--start-date "last-month"        # Previous month
--start-date "prev-month"        # Alias
```

**Offset:**
```bash
--start-date "+1m"               # 1 month from start of current month (resolution: month)
--start-date "+3m"               # 3 months from start of current month (resolution: month)
--start-date "-1m"               # 1 month before start of current month (resolution: month)
```

**Important:** Month offsets calculate from the **start of the current month** and return the **1st day of the target month** with `resolution: month`. This ensures consistent behavior:
- Today is Feb 15, 2025
- `+1m` → March 1, 2025 (not March 15)
- `-1m` → January 1, 2025 (not January 15)

For day-specific offsets (e.g., Feb 15 → March 15), use the day offset shortcuts instead (`+30d`).

**Named (from start of year):**
```bash
--start-date "jan"               # January of current year
--start-date "feb"               # February of current year
--start-date "mar"               # March of current year
# ... through dec
```

#### Year Shortcuts

**Current Period:**
```bash
--start-date "this-year"         # Current year (e.g., 2025)
--start-date "this-y"            # Alias
--start-date "current-year"      # Alias
```

**Relative:**
```bash
--start-date "next-year"         # Next year from today
--start-date "next-y"            # Alias

--start-date "last-year"         # Previous year
--start-date "prev-year"         # Alias
```

**Offset:**
```bash
--start-date "+1y"               # 1 year from now (snaps to Jan 1 of target year)
--start-date "-1y"               # 1 year ago (snaps to Jan 1 of previous year)
```

Year offsets intentionally snap to the first day of the resulting year for consistency with other coarse resolutions. Use month (`+12m`) or day offsets when you need exact month/day preservation.

#### Day/Week Shortcuts (For Specific Dates)

**Relative Days:**
```bash
--start-date "today"             # Today (no resolution)
--start-date "tomorrow"          # Tomorrow
--start-date "yesterday"         # Yesterday

--start-date "+7d"               # 7 days from now
--start-date "+14d"              # 14 days from now
--start-date "-7d"               # 7 days ago
```

**Relative Weeks:**
```bash
--start-date "this-week"         # Start of current week (Monday per ISO 8601)
--start-date "next-week"         # Start of next week (Monday)
--start-date "last-week"         # Start of last week (Monday)

--start-date "+1w"               # 7 days from now (day-specific, not week-start)
--start-date "+2w"               # 14 days from now (day-specific)
--start-date "-1w"               # 7 days ago (day-specific)
```

**Week Start Day Convention:**
- Uses **ISO 8601** standard: Week starts on **Monday**
- `this-week` returns the Monday of the current week
- If today is Monday, `this-week` returns today
- If today is Sunday, `this-week` returns the previous Monday (6 days ago)

**Note:** Week offsets (`+1w`, `-1w`) are day-specific shortcuts (equivalent to `+7d`, `-7d`) and do NOT snap to week boundaries.

**Named Days (Upcoming):**
```bash
--start-date "monday"            # Next Monday (or today if Monday)
--start-date "mon"               # Alias
--start-date "next-monday"       # Explicit next Monday (never today)
--start-date "tuesday"           # Next Tuesday
--start-date "tue"               # Alias
--start-date "next-tuesday"      # Explicit next Tuesday (never today)
# ... through sunday/sun and next-sunday/next-sun
```

When the `next-` prefix is used, the parser always advances at least one week, even if the specified weekday is today.

### Shortcut Reference Table

| Category | Example | Resolves To (if today is Feb 15, 2025) | Resolution |
|----------|---------|----------------------------------------|------------|
| **Quarter - Current** | `this-quarter`, `this-q` | `2025-01-01` (Q1 2025) | `quarter` |
| **Quarter - Relative** | `next-quarter`, `next-q` | `2025-04-01` (Q2 2025) | `quarter` |
| **Quarter - Offset** | `+1q`, `+2q`, `-1q` | `2025-04-01`, `2025-07-01`, `2024-10-01` | `quarter` |
| **Quarter - Named** | `q1`, `q2`, `q3`, `q4` | `2025-01-01`, `2025-04-01`, etc. | `quarter` |
| **Half - Current** | `this-half`, `this-h` | `2025-01-01` (H1 2025) | `halfYear` |
| **Half - Relative** | `next-half`, `next-h` | `2025-07-01` (H2 2025) | `halfYear` |
| **Half - Offset** | `+1h`, `-1h` | `2025-07-01`, `2024-07-01` | `halfYear` |
| **Half - Named** | `h1`, `h2` | `2025-01-01`, `2025-07-01` | `halfYear` |
| **Month - Current** | `this-month`, `this-m` | `2025-02-01` (February 2025) | `month` |
| **Month - Relative** | `next-month`, `next-m` | `2025-03-01` (March 2025) | `month` |
| **Month - Offset** | `+1m`, `+3m`, `-1m` | `2025-03-01` (March), `2025-05-01` (May), `2025-01-01` (January) | `month` |
| **Month - Named** | `jan`, `feb`, `mar` | `2025-01-01`, `2025-02-01`, etc. | `month` |
| **Year - Current** | `this-year`, `this-y` | `2025-01-01` | `year` |
| **Year - Relative** | `next-year`, `next-y` | `2026-01-01` | `year` |
| **Year - Offset** | `+1y`, `-1y` | `2026-01-01`, `2024-01-01` | `year` |
| **Day - Relative** | `today`, `tomorrow` | `2025-02-15`, `2025-02-16` | none |
| **Day - Offset** | `+7d`, `+14d`, `-7d` | `2025-02-22` (7 days), `2025-03-01` (14 days), `2025-02-08` (7 days ago) | none |
| **Week - Current** | `this-week` | `2025-02-10` (Monday of current week, ISO 8601) | none |
| **Week - Relative** | `next-week` | `2025-02-17` (Monday of next week) | none |
| **Week - Offset** | `+1w`, `+2w` | `2025-02-22` (same as +7d), `2025-03-01` (same as +14d) | none |
| **Day Name** | `monday`, `mon`, `next-monday` | `2025-02-17` (next Monday; `next-` forces advance) | none |

Year offsets (`+1y`, `-1y`) always resolve to January 1 of the resulting year. Use month or day offsets when you need to preserve the original month/day.

### Example Commands with Shortcuts

#### Quarter Planning
```bash
# Start this quarter, end next quarter
linear-create proj create --title "Q1-Q2 Initiative" \
  --start-date "this-quarter" \
  --target-date "next-quarter"

# Q1 goals (using named shortcut)
linear-create proj create --title "Q1 Goals" \
  --start-date "q1" \
  --target-date "q1"

# Two quarters out
linear-create proj create --title "Future Planning" \
  --start-date "+2q" \
  --target-date "+2q"
```

#### Half-Year Roadmap
```bash
# Current half-year
linear-create proj create --title "H1 Strategy" \
  --start-date "this-half" \
  --target-date "this-half"

# Next half-year
linear-create proj create --title "H2 Planning" \
  --start-date "next-half" \
  --target-date "next-half"
```

#### Month Sprint
```bash
# This month's work
linear-create proj create --title "February Sprint" \
  --start-date "this-month" \
  --target-date "this-month"

# Next month
linear-create proj create --title "March Planning" \
  --start-date "next-month" \
  --target-date "next-month"

# 3 months out
linear-create proj create --title "May Initiative" \
  --start-date "+3m" \
  --target-date "+3m"
```

#### Mixed Precision
```bash
# Start this quarter, specific end date
linear-create proj create --title "Q1 Feature" \
  --start-date "this-quarter" \
  --target-date "+30d"

# Start specific, end next month
linear-create proj create --title "Sprint Work" \
  --start-date "next-monday" \
  --target-date "next-month"
```

### Implementation Considerations

#### Date Calculation Logic

**For "this-quarter":**
```typescript
function calculateThisQuarter(): ParsedDate {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();

  // Determine current quarter
  const quarter = Math.floor(month / 3) + 1; // 1-4

  // Get quarter start month (0, 3, 6, 9)
  const quarterStartMonth = (quarter - 1) * 3;
  const date = `${year}-${String(quarterStartMonth + 1).padStart(2, '0')}-01`;
  const displayText = `Q${quarter} ${year}`;

  // Return first day of quarter
  return {
    success: true,
    date,
    resolution: 'quarter',
    displayText,
    inputFormat: 'quarter'
  };
}
```

**For "next-quarter":**
```typescript
function calculateNextQuarter(): ParsedDate {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  let year = now.getFullYear();

  // Current quarter
  const currentQuarter = Math.floor(month / 3) + 1;

  // Next quarter (1-4, wrapping to next year)
  let nextQuarter = currentQuarter + 1;
  if (nextQuarter > 4) {
    nextQuarter = 1;
    year += 1;
  }

  // Get quarter start month
  const quarterStartMonth = (nextQuarter - 1) * 3;
  const date = `${year}-${String(quarterStartMonth + 1).padStart(2, '0')}-01`;
  const displayText = `Q${nextQuarter} ${year}`;

  return {
    success: true,
    date,
    resolution: 'quarter',
    displayText,
    inputFormat: 'quarter'
  };
}
```

**For offset shortcuts (+2q, -1q):**
```typescript
function calculateQuarterOffset(offset: number): ParsedDate {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();

  // Current quarter (1-4)
  const currentQuarter = Math.floor(month / 3) + 1;

  // Calculate total quarters from year 0 to avoid modulo issues with negatives
  // Convert current position to absolute quarters
  const totalQuarters = year * 4 + (currentQuarter - 1) + offset;

  // Extract year and quarter from absolute count
  const quarterIndex = ((totalQuarters % 4) + 4) % 4; // normalise for negatives
  const targetYear = Math.floor((totalQuarters - quarterIndex) / 4);
  const targetQuarter = quarterIndex + 1;

  // Get quarter start month (0, 3, 6, or 9)
  const quarterStartMonth = (targetQuarter - 1) * 3;
  const date = `${targetYear}-${String(quarterStartMonth + 1).padStart(2, '0')}-01`;
  const displayText = `Q${targetQuarter} ${targetYear}`;

  return {
    success: true,
    date,
    resolution: 'quarter',
    displayText,
    inputFormat: 'quarter'
  };
}
```

**Why This Works:**
 - Converts to absolute quarter count from year 0: `year * 4 + (quarter - 1)`
 - Adds offset directly to absolute count (works correctly for both positive and negative)
 - Normalises the modulo so negative offsets still map to quarter indices 0-3
 - Converts back to year/quarter using division and modulo without double-adjustment

Similar logic applies for half-years, months, and weeks.

#### Timezone Considerations

**Design Decision:** All relative dates use the **local timezone** of the user running the command, not UTC. This matches user expectations:
- "today" = today in my timezone
- "this-quarter" = current quarter where I am
- Calculations use `new Date()` which reflects system local time

**Edge Cases & Handling:**

1. **Midnight Boundaries:**
   - User runs command at 11:59 PM local time on March 31 (Q1)
   - `this-quarter` calculates as Q1 using local date
   - Linear API receives ISO date in UTC format
   - The date string (`2025-01-01`) is timezone-agnostic and represents the start of Q1 universally

2. **Date-Only Fields:**
   - Linear's `startDate` and `targetDate` fields are date-only (YYYY-MM-DD), not datetime
   - No time component means no timezone conversion issues
   - The date represents a calendar day, not a specific moment in time

3. **Quarter Boundary Example:**
   ```
   User in PST (UTC-8):
   - Local time: March 31, 11:59 PM PST
   - Local date: March 31, 2025
   - `this-quarter` → Q1 2025 → "2025-01-01"
   - UTC time would be April 1, 7:59 AM (next day)
   - But calculation uses local date (March 31), so Q1 is correct
   ```

4. **Implementation:**
   - Use `new Date()` for current date (local timezone)
   - Extract date components using `.getFullYear()`, `.getMonth()`, `.getDate()` (local)
   - Do NOT use `.toISOString()` which converts to UTC
   - Format date manually: `YYYY-MM-DD` using local date values

**Why This Works:**
- Relative shortcuts ("this-quarter", "next-month") are based on user's mental model
- User thinks in their local calendar
- Linear's date fields have no time/timezone info
- The ISO date format (YYYY-MM-DD) is a calendar date, not a timestamp

#### Display in Confirmation

When using shortcuts, show both the shortcut and resolved value:

```bash
$ linear-create proj create --title "Q1 Goals" --start-date "this-quarter"

📅 Start date: this-quarter
   → Resolved to: Q1 2025 (2025-01-01)
   → Linear will display: "Q1 2025"
```

### Recommended Priority

**Phase 1 - Most Valuable** (High impact, commonly used):
- ✅ `this-quarter`, `next-quarter`, `q1`-`q4`
- ✅ `this-month`, `next-month`
- ✅ `+1q`, `+2q`, `+1m`, `+3m`

**Phase 2 - Nice to Have** (Useful but less critical):
- ⭐ `this-half`, `next-half`, `h1`, `h2`
- ⭐ `this-year`, `next-year`
- ⭐ `today`, `tomorrow`, `+7d`, `+14d`

**Phase 3 - Advanced** (Power user features):
- 🔧 `this-week`, `next-week`
- 🔧 `monday`, `tuesday`, etc.
- 🔧 Negative offsets (`-1q`, `-1m`)

### Parser Updates

Update `src/lib/date-parser.ts` to include:

```typescript
export interface DateShortcut {
  pattern: RegExp;
  resolver: () => ParsedDate;
  description: string;
  examples: string[];
}

// Registry of shortcuts
const DATE_SHORTCUTS: DateShortcut[] = [
  {
    pattern: /^(this-quarter|this-q|current-quarter)$/i,
    resolver: calculateThisQuarter,
    description: 'Current quarter',
    examples: ['this-quarter', 'this-q']
  },
  {
    pattern: /^(next-quarter|next-q)$/i,
    resolver: calculateNextQuarter,
    description: 'Next quarter from today',
    examples: ['next-quarter', 'next-q']
  },
  // ... more shortcuts
];

// Enhanced parser
export function parseProjectDate(input: string): DateParseResult {
  // 1. Check for shortcuts first
  for (const shortcut of DATE_SHORTCUTS) {
    if (shortcut.pattern.test(input)) {
      return shortcut.resolver();
    }
  }

  // 2. Check for offset patterns (+1q, +2m, etc.)
  const offsetMatch = input.match(/^([+-]\d+)(q|h|m|y|w|d)$/i);
  if (offsetMatch) {
    const [, offset, unit] = offsetMatch;
    return calculateOffsetDate(parseInt(offset), unit.toLowerCase());
  }

  // 3. Fall back to existing parsers (Q1 2025, Jan 2025, etc.)
  // ... existing logic
}
```

### Help Text Addition

Add shortcuts section to CLI help:

```
Date Shortcuts:
  Relative shortcuts calculate dates from today:

  Quarters:
    this-quarter, this-q      Current quarter
    next-quarter, next-q      Next quarter
    q1, q2, q3, q4            Specific quarter of current year
    +1q, +2q, -1q             Offset by quarters

  Months:
    this-month, this-m        Current month
    next-month, next-m        Next month
    jan, feb, ..., dec        Specific month of current year
    +1m, +3m, -1m             Offset by months

  Half-years:
    this-half, this-h         Current half-year
    next-half, next-h         Next half-year
    h1, h2                    Specific half of current year

  Years:
    this-year, this-y         Current year
    next-year, next-y         Next year

  Days:
    today, tomorrow           Specific days
    +7d, +14d, -7d            Offset by days
    monday, next-monday       Named weekdays (next occurrence or explicit next)

Examples:
  $ linear-create proj create --title "Q1 Goals" --start-date "this-quarter"
  $ linear-create proj create --title "Next Quarter" --start-date "next-q"
  $ linear-create proj create --title "3 Months Out" --start-date "+3m"
```

### Backward Compatibility

All existing formats continue to work:
- Explicit dates: `2025-Q1`, `Q1 2025`, `2025-01-15`
- Manual resolution flags: `--start-date-resolution quarter`

Shortcuts are purely additive.

---

## Future Enhancements (Beyond Shortcuts)

### Natural Language (Future v2)
```bash
--start-date "next January"
--start-date "first quarter of 2025"
--start-date "end of this year"
```

### Calendar Integration (Future v3)
- Import from calendar apps
- Sync with team calendars
- iCal/Google Calendar export

---

## Summary

The hybrid approach provides:

1. ✅ **Flexibility**: Multiple input formats for different workflows
2. ✅ **Usability**: Smart parsing reduces errors and typing
3. ✅ **Guidance**: Interactive mode teaches available options
4. ✅ **Control**: Manual override for power users
5. ✅ **Compatibility**: Existing commands unchanged
6. ✅ **Clarity**: Clear validation and confirmation messages

Users can choose their preferred workflow while the system handles the complexity of mapping to Linear's API.

---

## Document Revision History

### 2025-10-28: Bug Fixes and Clarifications

**Critical Fixes:**
1. **Quarter Offset Calculation (Implementation Considerations → Date Calculation Logic):** Rewrote `calculateQuarterOffset()` to use absolute quarter counting from year 0, fixing negative offset bugs (e.g., `-2q` from Q1 2025 now correctly returns Q3 2024 instead of Q3 2023)

2. **Type System (Implementation Structure → Date Parser Utility):** Added `success: true` property to `ParsedDate` interface to create proper discriminated union with `DateParseError` (which has `success: false`)

**Major Clarifications:**
3. **Month Offset Behavior (Relative Date Shortcuts → Month Shortcuts):** Explicitly documented that month offsets (`+1m`, `-1m`) calculate from start of current month and return the 1st day of target month with `resolution: month`, not day-specific offsets

4. **Parser Priority & Precedence (Mode 1: Smart Parser → Parser Priority & Precedence):** Added comprehensive section defining parsing order for ambiguous inputs (relative shortcuts → named shortcuts → offset patterns → explicit formats)

5. **Timezone Handling (Implementation Considerations → Timezone Considerations):** Expanded timezone section with edge case examples, implementation guidance, and rationale for using local timezone vs UTC

**Code Example Fixes:**
6. **Type Guards (Implementation Structure → Update Commands):** Updated code examples to use `!result.success` check and proper type narrowing instead of incorrect property access

7. **Mutation Prevention (Implementation Structure → Update Commands):** Removed mutation of `parsedStartDate.resolution` and used nullish coalescing (`??`) for precedence

**Documentation Improvements:**
8. **Resolution Terminology (Linear’s Date System → Resolution Types):** Standardized as "None (undefined)" throughout document

9. **Function Signatures (Implementation Structure → Date Parser Utility):** Changed from strict literal types (`1 | 2 | 3 | 4`) to `number` with runtime validation notes

10. **Week Start Day (Relative Date Shortcuts → Relative Weeks & Reference Table):** Clarified ISO 8601 Monday convention and distinguished between week-start shortcuts (`this-week`) and day-offset shortcuts (`+1w`)

11. **Design Document Status (Overview):** Added note that this is a design document for future implementation

**Table Corrections:**
12. **Shortcut Reference (Relative Date Shortcuts → Shortcut Reference Table):** Fixed month offset table entry to show correct dates with clarifying notes
13. **Shortcut Reference – Week Rows (Relative Date Shortcuts → Shortcut Reference Table):** Updated week-related table entries with ISO 8601 references and explanations

These changes ensure the document is implementation-ready with no critical bugs, clear ambiguity resolution, and comprehensive guidance for developers.
