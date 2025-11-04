# M14 Unit Testing Implementation - Vitest & TypeScript

## Document Navigation

📚 **Start with the overview** if you haven't already:
- **[M14_TS_IMPLEMENTATION_OVERVIEW.md](./M14_TS_IMPLEMENTATION_OVERVIEW.md)** - Strategy, timeline, and how Unit + E2E tests work together

📖 **Related documents**:
- **[MILESTONES.md](./MILESTONES.md#milestone-m14)** - Master task tracking (M14-UT01 through M14-UT10)
- **[M14_TS_P2_IMPLEMENTATION_E2E.md](./M14_TS_P2_IMPLEMENTATION_E2E.md)** - Phase 2: E2E test implementation

**Task IDs in this document**: M14-UT01 through M14-UT10 (unit tests)

---

## Overview

This document provides a detailed implementation plan for **Phase 1 of M14 Testing**: Unit Test implementation using Vitest and TypeScript. Unit tests provide fast, isolated component tests with mocking for Linear API calls, enabling rapid development feedback.

**Before starting**: Read [M14_TS_IMPLEMENTATION_OVERVIEW.md](./M14_TS_IMPLEMENTATION_OVERVIEW.md) to understand how this phase fits into the complete M14 testing strategy.

**After completing this phase**: Proceed to [M14_TS_P2_IMPLEMENTATION_E2E.md](./M14_TS_P2_IMPLEMENTATION_E2E.md) for E2E testing implementation.

---

## Design: Unit Test Implementation (TypeScript + Vitest)

### Why Vitest?
- ⚡ **10-20x faster than Jest**
- 📦 **Native ESM support** (matches our project)
- 🔧 **Compatible with Jest APIs** (easy migration)
- 📊 **Built-in coverage with c8/v8**
- 🎨 **Beautiful UI with `@vitest/ui`**

### Architecture

#### Directory Structure
```
tests/
├── unit/
│   ├── lib/
│   │   ├── validators.test.ts       # M14-UT01
│   │   ├── parsers.test.ts          # M14-UT02
│   │   ├── file-utils.test.ts       # M14-UT03
│   │   ├── resolution.test.ts       # M14-UT04
│   │   ├── entity-cache.test.ts     # M14-UT05
│   │   ├── batch-fetcher.test.ts    # M14-UT06
│   │   ├── status-cache.test.ts     # M14-UT07
│   │   ├── config.test.ts           # M14-UT08 (optional)
│   │   └── linear-client.test.ts    # M14-UT10 (optional)
│   ├── commands/
│   │   └── cache/
│   │       ├── stats.test.ts        # M14-UT09 (optional)
│   │       └── clear.test.ts        # M14-UT09 (optional)
│   ├── fixtures/
│   │   ├── mock-teams.ts            # Mock team data
│   │   ├── mock-initiatives.ts      # Mock initiative data
│   │   ├── mock-members.ts          # Mock member data
│   │   ├── mock-projects.ts         # Mock project data
│   │   └── mock-linear-client.ts    # Mock Linear SDK
│   └── helpers/
│       ├── test-utils.ts            # Shared test utilities
│       └── matchers.ts              # Custom matchers
├── setup.ts                          # Vitest global setup
├── vitest.config.ts                  # Test configuration
└── README-UNIT-TESTS.md              # Documentation (optional)
```

#### Dependencies to Add

```json
{
  "devDependencies": {
    "vitest": "^2.0.0",
    "@vitest/ui": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "@types/node": "^20.0.0"
  }
}
```

### Configuration Files

#### `tests/vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.test.ts',
        '**/*.config.ts'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80
      }
    },
    include: ['tests/unit/**/*.test.ts'],
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
      '@tests': resolve(__dirname, '.')
    }
  }
});
```

#### `tests/setup.ts`
```typescript
import { beforeAll, afterAll, vi } from 'vitest';

// Global setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.LINEAR_API_KEY = 'test_key_mock';
});

// Global teardown
afterAll(() => {
  vi.clearAllMocks();
});

// Extend expect with custom matchers
expect.extend({
  toBeValidLinearId(received: string) {
    const pass = /^[a-f0-9-]+$/.test(received);
    return {
      pass,
      message: () => `Expected ${received} to be a valid Linear ID`
    };
  }
});
```

---

## Implementation Tasks

### Phase 1: Infrastructure Setup (2 hours)

**Task 1.1: Install Dependencies**
```bash
npm install -D vitest @vitest/ui @vitest/coverage-v8
```

**Task 1.2: Create Configuration**
- Create `tests/vitest.config.ts`
- Create `tests/setup.ts`
- Add test scripts to `package.json`

**Task 1.3: Update package.json Scripts**
```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:e2e",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:unit:ui": "vitest --ui",
    "test:unit:coverage": "vitest run --coverage",
    "test:e2e": "cd tests/scripts && ./run-all-tests.sh"
  }
}
```

**Task 1.4: Create Test Fixtures**
Create mock data files in `tests/unit/fixtures/`:
- `mock-teams.ts`: Sample team objects
- `mock-initiatives.ts`: Sample initiative objects
- `mock-members.ts`: Sample member objects
- `mock-linear-client.ts`: Mock Linear SDK client

---

### Phase 2: Validators Tests (3 hours) - M14-TS01, M14-TS02

**File: `tests/unit/lib/validators.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import {
  validatePriority,
  validateAndNormalizeColor,
  validateEnumValue,
  validateISODate,
  validateNonEmpty
} from '@/lib/validators';

describe('validators', () => {
  describe('validatePriority', () => {
    it('should accept valid priority values (0-4)', () => {
      expect(validatePriority(0)).toEqual({ valid: true, value: 0 });
      expect(validatePriority(1)).toEqual({ valid: true, value: 1 });
      expect(validatePriority(2)).toEqual({ valid: true, value: 2 });
      expect(validatePriority(3)).toEqual({ valid: true, value: 3 });
      expect(validatePriority(4)).toEqual({ valid: true, value: 4 });
    });

    it('should accept string priority values', () => {
      expect(validatePriority('2')).toEqual({ valid: true, value: 2 });
    });

    it('should reject negative values', () => {
      const result = validatePriority(-1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('between 0 and 4');
    });

    it('should reject values greater than 4', () => {
      const result = validatePriority(5);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('between 0 and 4');
    });

    it('should reject non-numeric strings', () => {
      const result = validatePriority('abc');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be a number');
    });

    it('should include priority legend in error message', () => {
      const result = validatePriority(10);
      expect(result.error).toContain('0 = None');
      expect(result.error).toContain('1 = Urgent');
      expect(result.error).toContain('4 = Low');
    });
  });

  describe('validateAndNormalizeColor', () => {
    it('should accept valid hex with #', () => {
      const result = validateAndNormalizeColor('#FF6B6B');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('#FF6B6B');
    });

    it('should add # prefix if missing', () => {
      const result = validateAndNormalizeColor('FF6B6B');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('#FF6B6B');
    });

    it('should accept lowercase hex', () => {
      const result = validateAndNormalizeColor('ff6b6b');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('#ff6b6b');
    });

    it('should reject invalid hex characters', () => {
      const result = validateAndNormalizeColor('ZZZZZZ');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('valid hex color');
    });

    it('should reject short hex codes', () => {
      const result = validateAndNormalizeColor('#FFF');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('6 characters');
    });

    it('should reject empty strings', () => {
      const result = validateAndNormalizeColor('');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateEnumValue', () => {
    const allowedValues = ['month', 'quarter', 'halfYear', 'year'];

    it('should accept valid enum values', () => {
      expect(validateEnumValue('month', allowedValues)).toEqual({ valid: true });
      expect(validateEnumValue('quarter', allowedValues)).toEqual({ valid: true });
    });

    it('should reject invalid enum values', () => {
      const result = validateEnumValue('weekly', allowedValues);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('month');
      expect(result.error).toContain('quarter');
    });

    it('should be case sensitive', () => {
      const result = validateEnumValue('MONTH', allowedValues);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateISODate', () => {
    it('should accept valid ISO dates', () => {
      expect(validateISODate('2025-01-15')).toEqual({ valid: true });
      expect(validateISODate('2025-12-31')).toEqual({ valid: true });
    });

    it('should reject invalid formats', () => {
      const result = validateISODate('01/15/2025');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('YYYY-MM-DD');
    });

    it('should reject invalid dates', () => {
      const result = validateISODate('2025-13-45');
      expect(result.valid).toBe(false);
    });

    it('should reject partial dates', () => {
      const result = validateISODate('2025-01');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateNonEmpty', () => {
    it('should accept non-empty strings', () => {
      expect(validateNonEmpty('hello')).toEqual({ valid: true });
    });

    it('should reject empty strings', () => {
      const result = validateNonEmpty('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });

    it('should reject whitespace-only strings', () => {
      const result = validateNonEmpty('   ');
      expect(result.valid).toBe(false);
    });

    it('should include field name in error', () => {
      const result = validateNonEmpty('', 'Title');
      expect(result.error).toContain('Title');
    });
  });
});
```

**Coverage Target**: 100% for validators module

---

### Phase 3: Parsers Tests (3 hours) - M14-TS03, M14-TS04, M14-TS05

**File: `tests/unit/lib/parsers.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import {
  parseCommaSeparated,
  parsePipeDelimited,
  parseLifecycleDate,
  parsePipeDelimitedArray,
  parseCommaSeparatedUnique
} from '@/lib/parsers';

describe('parsers', () => {
  describe('parseCommaSeparated', () => {
    it('should split simple comma-separated values', () => {
      expect(parseCommaSeparated('a,b,c')).toEqual(['a', 'b', 'c']);
    });

    it('should trim whitespace', () => {
      expect(parseCommaSeparated('a, b , c')).toEqual(['a', 'b', 'c']);
    });

    it('should filter empty segments', () => {
      expect(parseCommaSeparated('a,,c')).toEqual(['a', 'c']);
      expect(parseCommaSeparated('a, , c')).toEqual(['a', 'c']);
    });

    it('should handle single value', () => {
      expect(parseCommaSeparated('single')).toEqual(['single']);
    });

    it('should handle empty string', () => {
      expect(parseCommaSeparated('')).toEqual([]);
    });

    it('should handle trailing commas', () => {
      expect(parseCommaSeparated('a,b,c,')).toEqual(['a', 'b', 'c']);
    });

    it('should handle leading commas', () => {
      expect(parseCommaSeparated(',a,b,c')).toEqual(['a', 'b', 'c']);
    });
  });

  describe('parseCommaSeparatedUnique', () => {
    it('should remove duplicates', () => {
      expect(parseCommaSeparatedUnique('a,b,a,c,b')).toEqual(['a', 'b', 'c']);
    });

    it('should preserve order of first occurrence', () => {
      expect(parseCommaSeparatedUnique('c,a,b,a')).toEqual(['c', 'a', 'b']);
    });
  });

  describe('parsePipeDelimited', () => {
    it('should parse URL|Label format', () => {
      const result = parsePipeDelimited('https://example.com|Example Site');
      expect(result).toEqual({
        key: 'https://example.com',
        value: 'Example Site'
      });
    });

    it('should handle URL without label', () => {
      const result = parsePipeDelimited('https://example.com');
      expect(result).toEqual({
        key: 'https://example.com',
        value: 'https://example.com'
      });
    });

    it('should handle multiple pipes (use first split)', () => {
      const result = parsePipeDelimited('https://example.com|Label|Extra');
      expect(result).toEqual({
        key: 'https://example.com',
        value: 'Label|Extra'
      });
    });

    it('should trim whitespace', () => {
      const result = parsePipeDelimited(' https://example.com | Label ');
      expect(result).toEqual({
        key: 'https://example.com',
        value: 'Label'
      });
    });

    it('should handle empty value after pipe', () => {
      const result = parsePipeDelimited('https://example.com|');
      expect(result).toEqual({
        key: 'https://example.com',
        value: 'https://example.com'
      });
    });
  });

  describe('parsePipeDelimitedArray', () => {
    it('should parse array of pipe-delimited strings', () => {
      const result = parsePipeDelimitedArray([
        'https://github.com|GitHub',
        'https://linear.app|Linear'
      ]);
      expect(result).toEqual([
        { key: 'https://github.com', value: 'GitHub' },
        { key: 'https://linear.app', value: 'Linear' }
      ]);
    });

    it('should handle mixed formats', () => {
      const result = parsePipeDelimitedArray([
        'https://github.com|GitHub',
        'https://linear.app'
      ]);
      expect(result).toEqual([
        { key: 'https://github.com', value: 'GitHub' },
        { key: 'https://linear.app', value: 'https://linear.app' }
      ]);
    });
  });

  describe('parseLifecycleDate', () => {
    it('should convert "now" to current ISO DateTime', () => {
      const result = parseLifecycleDate('now');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should convert YYYY-MM-DD to ISO DateTime', () => {
      const result = parseLifecycleDate('2025-01-15');
      expect(result).toBe('2025-01-15T00:00:00.000Z');
    });

    it('should handle different dates', () => {
      expect(parseLifecycleDate('2025-12-31')).toBe('2025-12-31T00:00:00.000Z');
      expect(parseLifecycleDate('2025-06-15')).toBe('2025-06-15T00:00:00.000Z');
    });

    it('should throw on invalid format', () => {
      expect(() => parseLifecycleDate('01/15/2025')).toThrow();
      expect(() => parseLifecycleDate('invalid')).toThrow();
    });

    it('should throw on invalid date', () => {
      expect(() => parseLifecycleDate('2025-13-45')).toThrow();
    });
  });
});
```

**Coverage Target**: 100% for parsers module

---

### Phase 4: File Utils Tests (2 hours) - M14-TS06

**File: `tests/unit/lib/file-utils.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readContentFile } from '@/lib/file-utils';
import * as fs from 'fs/promises';

// Mock fs module
vi.mock('fs/promises');

describe('file-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('readContentFile', () => {
    it('should read file successfully', async () => {
      const mockContent = 'File content here';
      vi.mocked(fs.readFile).mockResolvedValue(mockContent);

      const result = await readContentFile('/path/to/file.txt');

      expect(result.success).toBe(true);
      expect(result.content).toBe(mockContent);
      expect(result.error).toBeUndefined();
    });

    it('should handle ENOENT error (file not found)', async () => {
      const error: any = new Error('File not found');
      error.code = 'ENOENT';
      vi.mocked(fs.readFile).mockRejectedValue(error);

      const result = await readContentFile('/path/to/missing.txt');

      expect(result.success).toBe(false);
      expect(result.content).toBeUndefined();
      expect(result.error).toContain('not found');
      expect(result.error).toContain('/path/to/missing.txt');
    });

    it('should handle EACCES error (permission denied)', async () => {
      const error: any = new Error('Permission denied');
      error.code = 'EACCES';
      vi.mocked(fs.readFile).mockRejectedValue(error);

      const result = await readContentFile('/path/to/protected.txt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('permission');
    });

    it('should handle generic errors', async () => {
      const error = new Error('Disk error');
      vi.mocked(fs.readFile).mockRejectedValue(error);

      const result = await readContentFile('/path/to/file.txt');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Disk error');
    });

    it('should handle empty files', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('');

      const result = await readContentFile('/path/to/empty.txt');

      expect(result.success).toBe(true);
      expect(result.content).toBe('');
    });

    it('should preserve file content exactly', async () => {
      const content = 'Line 1\nLine 2\n\nLine 4';
      vi.mocked(fs.readFile).mockResolvedValue(content);

      const result = await readContentFile('/path/to/file.txt');

      expect(result.content).toBe(content);
    });
  });
});
```

**Coverage Target**: 100% for file-utils module

---

### Phase 5: Resolution Tests (2 hours) - M14-TS07

**File: `tests/unit/lib/resolution.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveStatus, resolveStatusOrThrow } from '@/lib/resolution';
import * as aliases from '@/lib/aliases';
import * as linearClient from '@/lib/linear-client';

vi.mock('@/lib/aliases');
vi.mock('@/lib/linear-client');

describe('resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('resolveStatus', () => {
    it('should resolve alias to ID', async () => {
      vi.mocked(aliases.resolveAlias).mockResolvedValue('status_abc123');
      vi.mocked(linearClient.resolveProjectStatusId).mockResolvedValue('status_abc123');

      const result = await resolveStatus('planned-alias', 'project-status');

      expect(result.success).toBe(true);
      expect(result.id).toBe('status_abc123');
      expect(aliases.resolveAlias).toHaveBeenCalledWith('project-status', 'planned-alias');
    });

    it('should use ID directly if it looks like Linear ID', async () => {
      vi.mocked(aliases.resolveAlias).mockResolvedValue('status_abc123');
      vi.mocked(linearClient.resolveProjectStatusId).mockResolvedValue('status_abc123');

      const result = await resolveStatus('status_abc123', 'project-status');

      expect(result.success).toBe(true);
      expect(result.id).toBe('status_abc123');
    });

    it('should lookup by name if not an alias or ID', async () => {
      vi.mocked(aliases.resolveAlias).mockResolvedValue('Planned');
      vi.mocked(linearClient.resolveProjectStatusId).mockResolvedValue('status_found123');

      const result = await resolveStatus('Planned', 'project-status');

      expect(result.success).toBe(true);
      expect(result.id).toBe('status_found123');
    });

    it('should return error if status not found', async () => {
      vi.mocked(aliases.resolveAlias).mockResolvedValue('not-found');
      vi.mocked(linearClient.resolveProjectStatusId).mockResolvedValue(null);

      const result = await resolveStatus('not-found', 'project-status');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle workflow-state entity type', async () => {
      vi.mocked(aliases.resolveAlias).mockResolvedValue('state_abc123');
      vi.mocked(linearClient.resolveWorkflowStateId).mockResolvedValue('state_abc123');

      const result = await resolveStatus('backlog', 'workflow-state');

      expect(result.success).toBe(true);
      expect(aliases.resolveAlias).toHaveBeenCalledWith('workflow-state', 'backlog');
    });
  });

  describe('resolveStatusOrThrow', () => {
    it('should return ID on success', async () => {
      vi.mocked(aliases.resolveAlias).mockResolvedValue('status_abc123');
      vi.mocked(linearClient.resolveProjectStatusId).mockResolvedValue('status_abc123');

      const id = await resolveStatusOrThrow('planned', 'project-status');

      expect(id).toBe('status_abc123');
    });

    it('should throw on failure', async () => {
      vi.mocked(aliases.resolveAlias).mockResolvedValue('not-found');
      vi.mocked(linearClient.resolveProjectStatusId).mockResolvedValue(null);

      await expect(
        resolveStatusOrThrow('not-found', 'project-status')
      ).rejects.toThrow();
    });
  });
});
```

**Coverage Target**: 100% for resolution module

---

### Phase 6: Caching Tests (4 hours) - M14-TS08, M14-TS09, M14-TS10

**File: `tests/unit/lib/entity-cache.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EntityCache, getEntityCache } from '@/lib/entity-cache';
import * as linearClient from '@/lib/linear-client';

vi.mock('@/lib/linear-client');

describe('entity-cache', () => {
  let cache: EntityCache;

  beforeEach(() => {
    cache = new EntityCache();
    vi.clearAllMocks();
  });

  describe('getTeams', () => {
    it('should fetch teams on first call', async () => {
      const mockTeams = [
        { id: 'team_1', name: 'Engineering' },
        { id: 'team_2', name: 'Design' }
      ];
      vi.mocked(linearClient.getAllTeams).mockResolvedValue(mockTeams);

      const teams = await cache.getTeams();

      expect(teams).toEqual(mockTeams);
      expect(linearClient.getAllTeams).toHaveBeenCalledTimes(1);
    });

    it('should use cache on second call (no API)', async () => {
      const mockTeams = [{ id: 'team_1', name: 'Engineering' }];
      vi.mocked(linearClient.getAllTeams).mockResolvedValue(mockTeams);

      await cache.getTeams();
      const teams = await cache.getTeams();

      expect(teams).toEqual(mockTeams);
      expect(linearClient.getAllTeams).toHaveBeenCalledTimes(1);
    });

    it('should refetch if cache expired', async () => {
      const mockTeams = [{ id: 'team_1', name: 'Engineering' }];
      vi.mocked(linearClient.getAllTeams).mockResolvedValue(mockTeams);

      // First call
      await cache.getTeams();

      // Manually expire cache
      cache.clearEntity('teams');

      // Second call should refetch
      await cache.getTeams();

      expect(linearClient.getAllTeams).toHaveBeenCalledTimes(2);
    });
  });

  describe('findTeamById', () => {
    it('should find team by ID', async () => {
      const mockTeams = [
        { id: 'team_1', name: 'Engineering' },
        { id: 'team_2', name: 'Design' }
      ];
      vi.mocked(linearClient.getAllTeams).mockResolvedValue(mockTeams);

      const team = await cache.findTeamById('team_2');

      expect(team).toEqual({ id: 'team_2', name: 'Design' });
    });

    it('should return undefined if not found', async () => {
      vi.mocked(linearClient.getAllTeams).mockResolvedValue([]);

      const team = await cache.findTeamById('team_999');

      expect(team).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should clear all caches', async () => {
      const mockTeams = [{ id: 'team_1', name: 'Engineering' }];
      vi.mocked(linearClient.getAllTeams).mockResolvedValue(mockTeams);

      await cache.getTeams();
      cache.clear();
      await cache.getTeams();

      expect(linearClient.getAllTeams).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearEntity', () => {
    it('should clear specific entity cache', async () => {
      const mockTeams = [{ id: 'team_1', name: 'Engineering' }];
      const mockInits = [{ id: 'init_1', name: 'Q1' }];
      vi.mocked(linearClient.getAllTeams).mockResolvedValue(mockTeams);
      vi.mocked(linearClient.getAllInitiatives).mockResolvedValue(mockInits);

      await cache.getTeams();
      await cache.getInitiatives();

      cache.clearEntity('teams');

      await cache.getTeams();
      await cache.getInitiatives();

      expect(linearClient.getAllTeams).toHaveBeenCalledTimes(2);
      expect(linearClient.getAllInitiatives).toHaveBeenCalledTimes(1);
    });
  });

  describe('singleton pattern', () => {
    it('should return same instance', () => {
      const cache1 = getEntityCache();
      const cache2 = getEntityCache();

      expect(cache1).toBe(cache2);
    });
  });
});
```

**File: `tests/unit/lib/batch-fetcher.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prewarmProjectCreation, prewarmProjectUpdate } from '@/lib/batch-fetcher';
import { getEntityCache } from '@/lib/entity-cache';
import * as linearClient from '@/lib/linear-client';

vi.mock('@/lib/linear-client');

describe('batch-fetcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getEntityCache().clear();
  });

  describe('prewarmProjectCreation', () => {
    it('should fetch all entities in parallel', async () => {
      vi.mocked(linearClient.getAllTeams).mockResolvedValue([]);
      vi.mocked(linearClient.getAllInitiatives).mockResolvedValue([]);
      vi.mocked(linearClient.getAllMembers).mockResolvedValue([]);
      vi.mocked(linearClient.getAllTemplates).mockResolvedValue([]);

      await prewarmProjectCreation();

      expect(linearClient.getAllTeams).toHaveBeenCalled();
      expect(linearClient.getAllInitiatives).toHaveBeenCalled();
      expect(linearClient.getAllMembers).toHaveBeenCalled();
      expect(linearClient.getAllTemplates).toHaveBeenCalled();
    });

    it('should handle individual fetch failures gracefully', async () => {
      vi.mocked(linearClient.getAllTeams).mockResolvedValue([]);
      vi.mocked(linearClient.getAllInitiatives).mockRejectedValue(new Error('API error'));
      vi.mocked(linearClient.getAllMembers).mockResolvedValue([]);

      // Should not throw
      await expect(prewarmProjectCreation()).resolves.not.toThrow();
    });

    it('should populate entity cache', async () => {
      const mockTeams = [{ id: 'team_1', name: 'Eng' }];
      vi.mocked(linearClient.getAllTeams).mockResolvedValue(mockTeams);
      vi.mocked(linearClient.getAllInitiatives).mockResolvedValue([]);
      vi.mocked(linearClient.getAllMembers).mockResolvedValue([]);
      vi.mocked(linearClient.getAllTemplates).mockResolvedValue([]);

      await prewarmProjectCreation();

      const cache = getEntityCache();
      const teams = await cache.getTeams();

      expect(teams).toEqual(mockTeams);
      // Should not call API again (cache hit)
      expect(linearClient.getAllTeams).toHaveBeenCalledTimes(1);
    });
  });

  describe('prewarmProjectUpdate', () => {
    it('should fetch fewer entities than creation', async () => {
      vi.mocked(linearClient.getAllTeams).mockResolvedValue([]);
      vi.mocked(linearClient.getAllMembers).mockResolvedValue([]);

      await prewarmProjectUpdate();

      expect(linearClient.getAllTeams).toHaveBeenCalled();
      expect(linearClient.getAllMembers).toHaveBeenCalled();
      // Should NOT fetch templates or initiatives
      expect(linearClient.getAllInitiatives).not.toHaveBeenCalled();
      expect(linearClient.getAllTemplates).not.toHaveBeenCalled();
    });
  });
});
```

**Coverage Target**: 85%+ for caching modules

---

### Phase 7: Command Integration Tests (4 hours) - M14-TS11, M14-TS12, M14-TS13

**File: `tests/unit/commands/project-create.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as linearClient from '@/lib/linear-client';
import * as entityCache from '@/lib/entity-cache';
import * as batchFetcher from '@/lib/batch-fetcher';

vi.mock('@/lib/linear-client');
vi.mock('@/lib/entity-cache');
vi.mock('@/lib/batch-fetcher');

describe('project create command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reduce API calls with caching', async () => {
    // Mock prewarm to populate cache
    vi.mocked(batchFetcher.prewarmProjectCreation).mockResolvedValue();

    // Mock cached data
    const mockCache = {
      getTeams: vi.fn().mockResolvedValue([{ id: 'team_1', name: 'Eng' }]),
      getMembers: vi.fn().mockResolvedValue([
        { id: 'user_1', email: 'a@example.com' },
        { id: 'user_2', email: 'b@example.com' }
      ])
    };
    vi.mocked(entityCache.getEntityCache).mockReturnValue(mockCache as any);

    // Mock project creation
    vi.mocked(linearClient.createProject).mockResolvedValue({
      id: 'proj_123',
      name: 'Test'
    } as any);

    // Simulate command with 2 members
    // ... command simulation code ...

    // Assertions
    expect(batchFetcher.prewarmProjectCreation).toHaveBeenCalledTimes(1);
    expect(mockCache.getMembers).toHaveBeenCalledTimes(1); // Cache hit

    // With caching: 1 prewarm batch + 1 create = 2 API calls
    // Without: 1 team + 1 initiative + 2 member lookups + 1 create = 5+ calls
  });

  it('should work identically with or without cache', async () => {
    // Test that output is same regardless of cache
    // This is regression test for M14-TS13
  });
});
```

**Coverage Target**: 70%+ for command files (harder to test, many side effects)

---

## NPM Scripts Summary

```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:e2e",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:unit:ui": "vitest --ui",
    "test:unit:coverage": "vitest run --coverage",
    "test:e2e": "cd tests/scripts && ./run-all-tests.sh"
  }
}
```

## Execution Examples

```bash
# Run all unit tests
npm run test:unit

# Watch mode (run tests on file change)
npm run test:unit:watch

# Visual UI (browser-based)
npm run test:unit:ui

# Coverage report
npm run test:unit:coverage

# Run specific test file
npm run test:unit -- validators

# Run specific test case
npm run test:unit -- validators -t "should accept valid priority"
```

## Pros & Cons

**Pros:**
- ⚡ **Fast**: Runs in milliseconds
- 🔒 **Safe**: No production pollution
- 📊 **Coverage**: Detailed metrics
- 🔄 **TDD**: Watch mode for development
- 🎯 **Isolated**: Tests one component at a time
- 💻 **CI-friendly**: Quick feedback in pipelines

**Cons:**
- ❌ **Not real**: Mocks don't catch real API issues
- 🔧 **Maintenance**: Mocks need updates when API changes
- 🤔 **Complexity**: Mock setup can be verbose
- 🚫 **Integration gaps**: Misses interaction bugs

---

## Development Workflow

### During Development (Fast Feedback)
```bash
# Start watch mode
npm run test:unit:watch

# In another terminal, make changes to code
# Tests auto-run on save
```

### Before Committing
```bash
# Run all unit tests
npm run test:unit

# Check coverage
npm run test:unit:coverage

# Ensure meets thresholds (80% lines, 80% functions, 75% branches)
```

### CI/CD Integration

```yaml
name: Unit Tests

on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: npm run test:unit:coverage
      - uses: codecov/codecov-action@v3
```

---

## Implementation Timeline

### Week 1: Infrastructure & Core Tests
- **Day 1-2**: Setup Vitest, configs, fixtures (8 hours)
- **Day 3-4**: Validators + Parsers tests (6 hours)
- **Day 5**: File utils + Resolution tests (4 hours)

### Week 2: Caching & Command Tests
- **Day 1-2**: Entity cache tests (8 hours)
- **Day 3**: Batch fetcher tests (4 hours)
- **Day 4-5**: Command integration tests (8 hours)

**Total: ~38 hours over 2 weeks**

---

## Success Criteria

### Coverage Targets
- ✅ 80%+ code coverage for utility modules (validators, parsers, file-utils)
- ✅ 85%+ code coverage for caching modules (entity-cache, batch-fetcher)
- ✅ 70%+ code coverage for commands
- ✅ All tests run in <10 seconds

### Quality Metrics
- ✅ Watch mode works smoothly
- ✅ CI integration complete
- ✅ No flaky tests
- ✅ Clear, maintainable test code

### Task Coverage (Core)
- ✅ M14-UT01: Validators module tests (~50 tests)
- ✅ M14-UT02: Parsers module tests (~40 tests)
- ✅ M14-UT03: File-utils module tests (~15 tests)
- ✅ M14-UT04: Resolution module tests (~20 tests)
- ✅ M14-UT05: Entity-cache module tests (~60 tests)
- ✅ M14-UT06: Batch-fetcher module tests (~40 tests)
- ✅ M14-UT07: Status-cache module tests (~60 tests)

### Task Coverage (Optional Expansion)
- ✅ M14-UT08: Config module tests (~30 tests)
- ✅ M14-UT09: Cache command tests (~25 tests)
- ✅ M14-UT10: Linear-client validation tests (~40 tests)

---

## Integration with E2E Tests

Unit tests and E2E tests work together to provide comprehensive coverage:

### Unit Tests (This Phase)
- **When**: During development, on every commit
- **Purpose**: Fast feedback, catch logic errors, ensure code quality
- **Speed**: Milliseconds
- **Scope**: Individual functions and modules

### E2E Tests (Phase 2)
- **When**: Before releases, on PRs to main
- **Purpose**: Validate real API integration, catch integration issues
- **Speed**: 2-5 minutes
- **Scope**: Full command workflows with real Linear API

**For complete integration strategy**, see:
- [M14_TS_IMPLEMENTATION_OVERVIEW.md](./M14_TS_IMPLEMENTATION_OVERVIEW.md) - Testing strategy, CI/CD pipeline, development workflow
- [M14_TS_P2_IMPLEMENTATION_E2E.md](./M14_TS_P2_IMPLEMENTATION_E2E.md) - E2E implementation details

### Recommended Development Flow
```bash
# 1. During development (watch mode)
npm run test:unit:watch

# 2. Before committing
npm run test:unit

# 3. Before releasing (run both)
npm run test:unit
npm run test:e2e
```

---

## Next Steps

1. **Install Vitest dependencies**
   ```bash
   npm install -D vitest @vitest/ui @vitest/coverage-v8
   ```

2. **Create configuration files**
   - `tests/vitest.config.ts`
   - `tests/setup.ts`

3. **Update package.json scripts**

4. **Create test fixtures** in `tests/unit/fixtures/`

5. **Implement tests phase by phase** (Validators → Parsers → File Utils → Resolution → Caching → Commands)

6. **Run coverage report**
   ```bash
   npm run test:unit:coverage
   ```

7. **Integrate with CI/CD**

8. **Proceed to E2E implementation** (Phase 2)

---

*Document Version: 1.0*
*Created: 2025-01-27*
*Phase: Unit Testing (Phase 1 of M14)*
