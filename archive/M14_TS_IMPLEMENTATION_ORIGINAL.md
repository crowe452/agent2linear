# ⚠️ DEPRECATED - This Document Has Been Split

**This comprehensive document has been reorganized into three focused documents for better clarity and maintainability.**

## 📚 Please Use These Documents Instead:

1. **[M14_TS_IMPLEMENTATION_OVERVIEW.md](../M14_TS_IMPLEMENTATION_OVERVIEW.md)** ⭐ **Start Here**
   - Strategy and integration guide
   - Complete 5-week timeline
   - Combined success criteria
   - CI/CD pipeline examples
   - Development workflow recommendations

2. **[M14_TS_P1_IMPLEMENTATION_UNIT.md](../M14_TS_P1_IMPLEMENTATION_UNIT.md)**
   - Phase 1: Unit test implementation details
   - Vitest setup and configuration
   - Test specifications for all modules
   - Coverage targets and execution

3. **[M14_TS_P2_IMPLEMENTATION_E2E.md](../M14_TS_P2_IMPLEMENTATION_E2E.md)**
   - Phase 2: E2E test implementation details
   - Real Linear API test setup
   - Configuration system (interactive + random)
   - Performance validation

## Why Was This Document Split?

This original document was comprehensive but **too long** (2355 lines). The split improves:
- ✅ **Easier navigation** - Find what you need quickly
- ✅ **Better focus** - Each document has a clear purpose
- ✅ **Clearer structure** - Overview → Phase 1 → Phase 2
- ✅ **Maintainability** - Update one phase without touching others

## Historical Reference

This file is **kept for historical reference only**. All content has been preserved and reorganized into the three new documents listed above.

**Last Updated**: 2025-01-27
**Superseded By**: M14_TS_IMPLEMENTATION_OVERVIEW.md, M14_TS_P1_IMPLEMENTATION_UNIT.md, M14_TS_P2_IMPLEMENTATION_E2E.md

---

# ⚠️ ORIGINAL CONTENT BELOW (ARCHIVED)

---

# M14 Testing Implementation Plan - Two Comprehensive Designs

## Overview

This document provides two detailed testing implementation designs for Milestone M14:
1. **Unit Test Implementation** - Fast, isolated component tests using Vitest
2. **E2E Test Implementation** - Real Linear API tests with dynamic data lookup

Both designs work together to provide comprehensive test coverage: fast feedback during development (unit) and real-world validation (E2E).

---

## Design 1: Unit Test Implementation (TypeScript + Vitest)

### Overview
Modern TypeScript unit testing using **Vitest** (faster, better ESM support than Jest) with mocking for Linear API calls. Tests run in milliseconds with no production pollution.

### Why Vitest?
- ⚡ 10-20x faster than Jest
- 📦 Native ESM support (matches our project)
- 🔧 Compatible with Jest APIs (easy migration)
- 📊 Built-in coverage with c8/v8
- 🎨 Beautiful UI with `@vitest/ui`

### Architecture

#### Directory Structure
```
tests/
├── unit/
│   ├── lib/
│   │   ├── validators.test.ts       # M14-TS01, M14-TS02
│   │   ├── parsers.test.ts          # M14-TS03, M14-TS04, M14-TS05
│   │   ├── file-utils.test.ts       # M14-TS06
│   │   ├── resolution.test.ts       # M14-TS07
│   │   ├── entity-cache.test.ts     # M14-TS08
│   │   ├── batch-fetcher.test.ts    # M14-TS09
│   │   └── status-cache.test.ts     # M14-TS10
│   ├── commands/
│   │   ├── project-create.test.ts   # M14-TS11 (unit version)
│   │   └── project-update.test.ts   # M14-TS12 (unit version)
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
└── README-UNIT-TESTS.md              # Documentation
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

### Implementation Tasks

#### Phase 1: Infrastructure Setup (2 hours)

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

#### Phase 2: Validators Tests (3 hours) - M14-TS01, M14-TS02

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

#### Phase 3: Parsers Tests (3 hours) - M14-TS03, M14-TS04, M14-TS05

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

#### Phase 4: File Utils Tests (2 hours) - M14-TS06

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

#### Phase 5: Resolution Tests (2 hours) - M14-TS07

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

#### Phase 6: Caching Tests (4 hours) - M14-TS08, M14-TS09, M14-TS10

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

#### Phase 7: Command Integration Tests (4 hours) - M14-TS11, M14-TS12, M14-TS13

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

### NPM Scripts Summary

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

### Execution Examples

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

### Pros & Cons

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

## Design 2: E2E Test Implementation (TypeScript/Bash Hybrid)

### Overview
End-to-end tests using **real Linear API** with dynamic data lookup and isolated test configuration. Zero hardcoded values, safe for any workspace, includes API call tracking for performance validation.

### Why E2E Tests?
- ✅ Tests real Linear API behavior
- ✅ Catches integration issues unit tests miss
- ✅ Validates actual API call reduction
- ✅ Provides confidence for releases

### Architecture

#### Directory Structure
```
tests/
├── e2e/
│   ├── setup/
│   │   ├── e2e-config.ts            # Config manager
│   │   ├── interactive-setup.ts     # Interactive team/initiative selector
│   │   ├── random-selector.ts       # Random fallback
│   │   └── preflight-check.ts       # Pre-test validation
│   ├── lib/
│   │   ├── test-runner.ts           # E2E test framework
│   │   ├── cleanup-tracker.ts       # Track created entities
│   │   ├── api-call-tracker.ts      # Count API calls
│   │   ├── assertions.ts            # E2E assertions
│   │   └── test-data-generator.ts   # Generate test content
│   ├── specs/
│   │   ├── project-create.e2e.ts    # M14-TS11
│   │   ├── project-update.e2e.ts    # M14-TS12
│   │   ├── caching-performance.e2e.ts # M14-TS14, M14-TS15
│   │   └── regression.e2e.ts        # M14-TS13
│   ├── fixtures/
│   │   └── test-templates.ts        # Reusable test patterns
│   └── runner.ts                     # Main test entry point
├── e2e-config.json                   # Local config (gitignored)
├── e2e-config.example.json           # Example template (checked in)
└── README-E2E-TESTS.md               # Documentation
```

#### Config Files

**`tests/e2e-config.json`** (gitignored, created by setup)
```json
{
  "teamId": "team_abc123",
  "teamName": "Engineering",
  "initiativeId": "init_xyz789",
  "initiativeName": "Q1 2025",
  "mode": "configured",
  "createdAt": "2025-01-15T10:30:00Z",
  "createdBy": "steve@example.com"
}
```

**`tests/e2e-config.example.json`** (checked into git)
```json
{
  "teamId": "YOUR_TEAM_ID",
  "teamName": "YOUR_TEAM_NAME",
  "initiativeId": "YOUR_INITIATIVE_ID",
  "initiativeName": "YOUR_INITIATIVE_NAME",
  "mode": "configured",
  "createdAt": "ISO_TIMESTAMP",
  "createdBy": "YOUR_EMAIL"
}
```

**`.gitignore`** (add these lines)
```
tests/e2e-config.json
tests/e2e/cleanup-*.sh
```

### Implementation Tasks

#### Phase 1: Setup Infrastructure (4 hours)

**Task 1.1: Config Manager** (`tests/e2e/setup/e2e-config.ts`)

```typescript
import fs from 'fs/promises';
import path from 'path';

export interface E2EConfig {
  teamId: string;
  teamName: string;
  initiativeId: string;
  initiativeName: string;
  mode: 'configured' | 'random';
  createdAt: string;
  createdBy: string;
}

const CONFIG_PATH = path.join(__dirname, '../e2e-config.json');

export async function loadE2EConfig(): Promise<E2EConfig | null> {
  try {
    const content = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw err;
  }
}

export async function saveE2EConfig(config: E2EConfig): Promise<void> {
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  console.log(`✅ E2E config saved to ${CONFIG_PATH}`);
}

export async function configExists(): Promise<boolean> {
  try {
    await fs.access(CONFIG_PATH);
    return true;
  } catch {
    return false;
  }
}

export async function deleteConfig(): Promise<void> {
  try {
    await fs.unlink(CONFIG_PATH);
    console.log('✅ E2E config deleted');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err;
    }
  }
}
```

**Task 1.2: Interactive Setup** (`tests/e2e/setup/interactive-setup.ts`)

```typescript
import React, { useState, useEffect } from 'react';
import { render, Text, Box } from 'ink';
import SelectInput from 'ink-select-input';
import { getAllTeams, getAllInitiatives } from '../../../src/lib/linear-client.js';
import { saveE2EConfig } from './e2e-config.js';

interface Team {
  id: string;
  name: string;
}

interface Initiative {
  id: string;
  name: string;
}

const SetupUI: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [fetchedTeams, fetchedInitiatives] = await Promise.all([
          getAllTeams(),
          getAllInitiatives()
        ]);
        setTeams(fetchedTeams);
        setInitiatives(fetchedInitiatives);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <Text>Loading workspace data...</Text>;
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">❌ Error: {error}</Text>
        <Text>Please check your LINEAR_API_KEY</Text>
      </Box>
    );
  }

  if (!selectedTeam) {
    return (
      <Box flexDirection="column">
        <Text bold>Select a team for E2E testing:</Text>
        <Text dimColor>Use ↑↓ arrows and Enter to select</Text>
        <Text></Text>
        <SelectInput
          items={teams.map(t => ({ label: `${t.name} (${t.id})`, value: t }))}
          onSelect={item => setSelectedTeam(item.value)}
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold>Select an initiative for E2E testing:</Text>
      <Text dimColor>Use ↑↓ arrows and Enter to select</Text>
      <Text></Text>
      <SelectInput
        items={initiatives.map(i => ({ label: `${i.name} (${i.id})`, value: i }))}
        onSelect={async item => {
          const config = {
            teamId: selectedTeam.id,
            teamName: selectedTeam.name,
            initiativeId: item.value.id,
            initiativeName: item.value.name,
            mode: 'configured' as const,
            createdAt: new Date().toISOString(),
            createdBy: process.env.USER || 'unknown'
          };

          await saveE2EConfig(config);

          console.log('\n✅ E2E Configuration Complete!\n');
          console.log('Team:', selectedTeam.name);
          console.log('Initiative:', item.value.name);
          console.log('\nRun tests with: npm run test:e2e\n');

          process.exit(0);
        }}
      />
    </Box>
  );
};

// Entry point
if (process.env.LINEAR_API_KEY) {
  render(<SetupUI />);
} else {
  console.error('❌ LINEAR_API_KEY environment variable not set');
  process.exit(1);
}
```

**Task 1.3: Random Selector** (`tests/e2e/setup/random-selector.ts`)

```typescript
import { getAllTeams, getAllInitiatives } from '../../../src/lib/linear-client.js';
import type { E2EConfig } from './e2e-config.js';

export async function selectRandomTeamAndInitiative(): Promise<E2EConfig> {
  const [teams, initiatives] = await Promise.all([
    getAllTeams(),
    getAllInitiatives()
  ]);

  if (teams.length === 0) {
    throw new Error('No teams found in workspace');
  }

  if (initiatives.length === 0) {
    throw new Error('No initiatives found in workspace');
  }

  const randomTeam = teams[Math.floor(Math.random() * teams.length)];
  const randomInitiative = initiatives[Math.floor(Math.random() * initiatives.length)];

  console.log('\n⚠️  RANDOM MODE SELECTED:');
  console.log(`   Team: ${randomTeam.name} (${randomTeam.id})`);
  console.log(`   Initiative: ${randomInitiative.name} (${randomInitiative.id})`);
  console.log('\n⚠️  Tests will create real entities in this team/initiative!');
  console.log('   Consider running: npm run test:e2e:setup\n');

  return {
    teamId: randomTeam.id,
    teamName: randomTeam.name,
    initiativeId: randomInitiative.id,
    initiativeName: randomInitiative.name,
    mode: 'random',
    createdAt: new Date().toISOString(),
    createdBy: process.env.USER || 'unknown'
  };
}
```

**Task 1.4: Preflight Check** (`tests/e2e/setup/preflight-check.ts`)

```typescript
import { configExists } from './e2e-config.js';

export async function preflightCheck(): Promise<void> {
  const hasConfig = await configExists();
  const hasRandomFlag = process.env.E2E_RANDOM === 'true';

  if (!hasConfig && !hasRandomFlag) {
    console.error(`
╔═══════════════════════════════════════════════════════════════╗
║  ❌ E2E Tests Require Configuration                           ║
╚═══════════════════════════════════════════════════════════════╝

E2E tests create REAL Linear entities. You must specify where to run them.

Please choose ONE of the following options:

┌───────────────────────────────────────────────────────────────┐
│  A) Configure Test Workspace (RECOMMENDED)                    │
└───────────────────────────────────────────────────────────────┘

   npm run test:e2e:setup

   This will:
   • Show your teams and initiatives interactively
   • Let you select which to use for testing
   • Save config to tests/e2e-config.json
   • Can be re-run anytime to change selection

┌───────────────────────────────────────────────────────────────┐
│  B) Use Random Selection (RISKY - may select production)      │
└───────────────────────────────────────────────────────────────┘

   E2E_RANDOM=true npm run test:e2e

   This will:
   • Pick a random team and initiative
   • Use them for this test run only
   • NOT save the selection
   • Show which were selected before running

╔═══════════════════════════════════════════════════════════════╗
║  Why is configuration needed?                                 ║
╚═══════════════════════════════════════════════════════════════╝

E2E tests create real projects with names like:
  • E2E_20250115_103045_TestProject_1
  • E2E_20250115_103045_TestProject_2

These need to be created somewhere safe, not in your production data.

╔═══════════════════════════════════════════════════════════════╗
║  Get Started                                                  ║
╚═══════════════════════════════════════════════════════════════╝

Recommended:
  npm run test:e2e:setup

Quick (risky):
  E2E_RANDOM=true npm run test:e2e
`);
    process.exit(1);
  }

  // Check LINEAR_API_KEY
  if (!process.env.LINEAR_API_KEY) {
    console.error(`
❌ LINEAR_API_KEY environment variable not set

Please set your Linear API key:
  export LINEAR_API_KEY=lin_api_xxx...

Get your key from: https://linear.app/settings/api
`);
    process.exit(1);
  }
}
```

---

#### Phase 2: Test Framework (3 hours)

**Task 2.1: API Call Tracker** (`tests/e2e/lib/api-call-tracker.ts`)

```typescript
import { LinearClient } from '@linear/sdk';

/**
 * Wraps LinearClient to track API calls
 */
export class TrackedLinearClient extends LinearClient {
  private callCount = 0;
  private calls: Array<{ method: string; timestamp: number }> = [];

  async query(...args: any[]): Promise<any> {
    this.callCount++;
    this.calls.push({
      method: 'query',
      timestamp: Date.now()
    });
    return super.query(...args);
  }

  getCallCount(): number {
    return this.callCount;
  }

  getCalls(): Array<{ method: string; timestamp: number }> {
    return [...this.calls];
  }

  resetCallCount(): void {
    this.callCount = 0;
    this.calls = [];
  }

  getCallSummary(): string {
    return `Total API calls: ${this.callCount}`;
  }
}

/**
 * Create tracked client for testing
 */
export function createTrackedClient(): TrackedLinearClient {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    throw new Error('LINEAR_API_KEY not set');
  }
  return new TrackedLinearClient({ apiKey });
}
```

**Task 2.2: Cleanup Tracker** (`tests/e2e/lib/cleanup-tracker.ts`)

```typescript
import fs from 'fs/promises';
import path from 'path';

interface CreatedEntity {
  type: string;
  id: string;
  name: string;
  createdAt: string;
}

export class CleanupTracker {
  private entities: CreatedEntity[] = [];
  private testRunId: string;

  constructor() {
    this.testRunId = `e2e_${Date.now()}`;
  }

  track(type: string, id: string, name: string): void {
    this.entities.push({
      type,
      id,
      name,
      createdAt: new Date().toISOString()
    });
  }

  async generateCleanupScript(): Promise<void> {
    const scriptPath = path.join(__dirname, '../cleanup-generated.sh');

    const lines = [
      '#!/bin/bash',
      '#',
      '# Generated E2E Cleanup Script',
      `# Run ID: ${this.testRunId}`,
      `# Generated: ${new Date().toISOString()}`,
      '#',
      '# WARNING: These entities were created by E2E tests',
      '# Review carefully before deleting!',
      '#',
      '',
      'echo "=================================================="',
      'echo "  E2E Test Cleanup"',
      'echo "=================================================="',
      'echo ""',
      `echo "Found ${this.entities.length} entities to review:"`,
      'echo ""',
      ''
    ];

    for (const entity of this.entities) {
      lines.push(`# ${entity.type}: ${entity.name}`);
      lines.push(`echo "  ${entity.type}: ${entity.name} (${entity.id})"`);
      lines.push(`# TODO: Implement delete command when available`);
      lines.push(`# node dist/index.js ${entity.type} delete ${entity.id} --yes`);
      lines.push('');
    }

    lines.push('echo ""');
    lines.push('echo "Note: Delete commands not yet implemented"');
    lines.push('echo "Please delete manually via Linear UI"');
    lines.push('echo ""');

    await fs.writeFile(scriptPath, lines.join('\n'), { mode: 0o755 });
    console.log(`\n📋 Cleanup script generated: ${scriptPath}`);
  }

  getSummary(): string {
    return `Created ${this.entities.length} entities`;
  }

  getEntities(): CreatedEntity[] {
    return [...this.entities];
  }
}
```

**Task 2.3: Test Runner** (`tests/e2e/lib/test-runner.ts`)

```typescript
import { E2EConfig, loadE2EConfig } from '../setup/e2e-config.js';
import { selectRandomTeamAndInitiative } from '../setup/random-selector.js';
import { preflightCheck } from '../setup/preflight-check.js';
import { CleanupTracker } from './cleanup-tracker.js';

export class E2ETestRunner {
  private config!: E2EConfig;
  private cleanupTracker: CleanupTracker;
  private passed = 0;
  private failed = 0;
  private tests: Array<{ name: string; fn: () => Promise<void> }> = [];

  constructor() {
    this.cleanupTracker = new CleanupTracker();
  }

  async setup(): Promise<void> {
    await preflightCheck();

    // Load or generate config
    if (process.env.E2E_RANDOM === 'true') {
      this.config = await selectRandomTeamAndInitiative();
    } else {
      const config = await loadE2EConfig();
      if (!config) {
        throw new Error('Config not found (should have been caught by preflight)');
      }
      this.config = config;
    }

    console.log('\n🔧 E2E Configuration:');
    console.log(`   Team: ${this.config.teamName} (${this.config.teamId})`);
    console.log(`   Initiative: ${this.config.initiativeName} (${this.config.initiativeId})`);
    console.log(`   Mode: ${this.config.mode}`);
    console.log('');
  }

  test(name: string, fn: () => Promise<void>): void {
    this.tests.push({ name, fn });
  }

  async run(): Promise<void> {
    await this.setup();

    console.log(`Running ${this.tests.length} E2E tests...\n`);

    for (const test of this.tests) {
      try {
        process.stdout.write(`  ${test.name} ... `);
        await test.fn();
        console.log('✅');
        this.passed++;
      } catch (err) {
        console.log('❌');
        console.error(`    Error: ${err instanceof Error ? err.message : err}`);
        this.failed++;
      }
    }

    await this.cleanup();
  }

  async cleanup(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('E2E Test Summary');
    console.log('='.repeat(60));
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log(`Total:  ${this.tests.length}`);
    console.log('');
    console.log(this.cleanupTracker.getSummary());

    await this.cleanupTracker.generateCleanupScript();

    if (this.failed > 0) {
      process.exit(1);
    }
  }

  getConfig(): E2EConfig {
    return this.config;
  }

  getCleanupTracker(): CleanupTracker {
    return this.cleanupTracker;
  }
}
```

---

#### Phase 3: Test Specs (8 hours)

**Task 3.1: Project Create E2E** (`tests/e2e/specs/project-create.e2e.ts`)

```typescript
import { E2ETestRunner } from '../lib/test-runner.js';
import { createTrackedClient } from '../lib/api-call-tracker.js';
import { createProject } from '../../../src/lib/linear-client.js';
import { getAllMembers } from '../../../src/lib/linear-client.js';
import { prewarmProjectCreation } from '../../../src/lib/batch-fetcher.js';

const runner = new E2ETestRunner();

runner.test('Project create with 5 members (verify API call reduction)', async () => {
  const config = runner.getConfig();
  const tracker = runner.getCleanupTracker();
  const client = createTrackedClient();

  // Get 5 members dynamically
  const members = await getAllMembers();
  if (members.length < 5) {
    throw new Error('Workspace needs at least 5 members for this test');
  }
  const selectedMembers = members.slice(0, 5);

  // Reset call counter
  client.resetCallCount();

  // Prewarm cache
  await prewarmProjectCreation();
  const prewarmCalls = client.getCallCount();

  // Create project
  const timestamp = Date.now();
  const project = await createProject({
    teamId: config.teamId,
    name: `E2E_${timestamp}_Members`,
    memberIds: selectedMembers.map(m => m.id)
  });

  const totalCalls = client.getCallCount();

  // Track for cleanup
  tracker.track('project', project.id, project.name);

  // Assertions
  if (totalCalls > 8) {
    throw new Error(`Expected ≤8 API calls, got ${totalCalls}`);
  }

  console.log(`    (${totalCalls} API calls, target: ≤8)`);
});

runner.test('Project create without cache (baseline)', async () => {
  const config = runner.getConfig();
  const tracker = runner.getCleanupTracker();
  const client = createTrackedClient();

  // Clear cache
  const { getEntityCache } = await import('../../../src/lib/entity-cache.js');
  getEntityCache().clear();

  // Reset counter
  client.resetCallCount();

  // Create project WITHOUT prewarm
  const timestamp = Date.now();
  const project = await createProject({
    teamId: config.teamId,
    name: `E2E_${timestamp}_NoCache`
  });

  const totalCalls = client.getCallCount();

  tracker.track('project', project.id, project.name);

  // Should be more calls without cache
  if (totalCalls < 8) {
    throw new Error(`Expected more calls without cache, got ${totalCalls}`);
  }

  console.log(`    (${totalCalls} API calls, baseline)`);
});

// Run tests
runner.run();
```

**Task 3.2: Caching Performance E2E** (`tests/e2e/specs/caching-performance.e2e.ts`)

```typescript
import { E2ETestRunner } from '../lib/test-runner.js';
import { createTrackedClient } from '../lib/api-call-tracker.js';
import { prewarmProjectCreation } from '../../../src/lib/batch-fetcher.js';
import { createProject } from '../../../src/lib/linear-client.js';
import { getEntityCache } from '../../../src/lib/entity-cache.js';

const runner = new E2ETestRunner();

runner.test('API call reduction: 60-70% for project create', async () => {
  const config = runner.getConfig();
  const tracker = runner.getCleanupTracker();
  const client = createTrackedClient();

  // First: baseline without cache
  getEntityCache().clear();
  client.resetCallCount();

  const project1 = await createProject({
    teamId: config.teamId,
    name: `E2E_${Date.now()}_Baseline`
  });
  const baselineCalls = client.getCallCount();
  tracker.track('project', project1.id, project1.name);

  // Second: with cache prewarm
  getEntityCache().clear();
  client.resetCallCount();

  await prewarmProjectCreation();
  const project2 = await createProject({
    teamId: config.teamId,
    name: `E2E_${Date.now()}_Cached`
  });
  const cachedCalls = client.getCallCount();
  tracker.track('project', project2.id, project2.name);

  // Calculate reduction
  const reduction = ((baselineCalls - cachedCalls) / baselineCalls) * 100;

  if (reduction < 60) {
    throw new Error(`Expected ≥60% reduction, got ${reduction.toFixed(1)}%`);
  }

  console.log(`    (${reduction.toFixed(1)}% reduction: ${baselineCalls} → ${cachedCalls} calls)`);
});

runner.test('Wall-clock time reduction: 50-70%', async () => {
  const config = runner.getConfig();
  const tracker = runner.getCleanupTracker();

  // Baseline timing
  getEntityCache().clear();
  const start1 = Date.now();
  const project1 = await createProject({
    teamId: config.teamId,
    name: `E2E_${Date.now()}_TimingBaseline`
  });
  const baselineTime = Date.now() - start1;
  tracker.track('project', project1.id, project1.name);

  // Cached timing
  getEntityCache().clear();
  await prewarmProjectCreation();
  const start2 = Date.now();
  const project2 = await createProject({
    teamId: config.teamId,
    name: `E2E_${Date.now()}_TimingCached`
  });
  const cachedTime = Date.now() - start2;
  tracker.track('project', project2.id, project2.name);

  // Calculate reduction
  const reduction = ((baselineTime - cachedTime) / baselineTime) * 100;

  if (reduction < 50) {
    throw new Error(`Expected ≥50% time reduction, got ${reduction.toFixed(1)}%`);
  }

  console.log(`    (${reduction.toFixed(1)}% faster: ${baselineTime}ms → ${cachedTime}ms)`);
});

runner.run();
```

**Task 3.3: Regression Tests** (`tests/e2e/specs/regression.e2e.ts`)

```typescript
import { E2ETestRunner } from '../lib/test-runner.js';
import { createProject, updateProject } from '../../../src/lib/linear-client.js';

const runner = new E2ETestRunner();

runner.test('Project create still works with all fields', async () => {
  const config = runner.getConfig();
  const tracker = runner.getCleanupTracker();

  const project = await createProject({
    teamId: config.teamId,
    name: `E2E_${Date.now()}_AllFields`,
    description: 'Test description',
    priority: 2,
    startDate: '2025-01-15',
    targetDate: '2025-03-31',
    color: '#FF6B6B',
    icon: '🚀'
  });

  tracker.track('project', project.id, project.name);

  // Verify fields
  if (project.priority !== 2) {
    throw new Error(`Priority mismatch: expected 2, got ${project.priority}`);
  }
  if (project.color !== '#FF6B6B') {
    throw new Error(`Color mismatch: expected #FF6B6B, got ${project.color}`);
  }
});

runner.test('Project update still works identically', async () => {
  const config = runner.getConfig();
  const tracker = runner.getCleanupTracker();

  // Create project
  const project = await createProject({
    teamId: config.teamId,
    name: `E2E_${Date.now()}_Update`
  });
  tracker.track('project', project.id, project.name);

  // Update it
  const updated = await updateProject(project.id, {
    name: `${project.name}_Updated`,
    priority: 1
  });

  // Verify
  if (!updated.name.endsWith('_Updated')) {
    throw new Error('Name update failed');
  }
  if (updated.priority !== 1) {
    throw new Error('Priority update failed');
  }
});

runner.run();
```

---

#### Phase 4: NPM Scripts & Documentation (2 hours)

**Task 4.1: Update package.json**

```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:e2e",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:unit:coverage": "vitest run --coverage",
    "test:e2e": "tsx tests/e2e/runner.ts",
    "test:e2e:setup": "tsx tests/e2e/setup/interactive-setup.ts",
    "test:e2e:reset": "rm -f tests/e2e-config.json && echo 'Config reset. Run: npm run test:e2e:setup'",
    "test:e2e:cleanup": "bash tests/e2e/cleanup-generated.sh || echo 'No cleanup script found'",
    "test:e2e:show-config": "cat tests/e2e-config.json 2>/dev/null || echo 'No config found. Run: npm run test:e2e:setup'"
  }
}
```

**Task 4.2: Create Main Runner** (`tests/e2e/runner.ts`)

```typescript
#!/usr/bin/env tsx

// Import all test specs
import './specs/project-create.e2e.js';
import './specs/project-update.e2e.js';
import './specs/caching-performance.e2e.js';
import './specs/regression.e2e.js';

// Tests will run automatically via their runner.run() calls
```

**Task 4.3: Documentation** (`tests/README-E2E-TESTS.md`)

```markdown
# E2E Testing Guide

## Quick Start

### First Time Setup (Required)

npm run test:e2e:setup


This will:
1. Fetch your Linear teams and initiatives
2. Let you select which to use for testing
3. Save config to `tests/e2e-config.json` (gitignored)
4. Can be re-run anytime to change selection

### Run Tests

npm run test:e2e


### View Current Config

npm run test:e2e:show-config


### Reset Config

npm run test:e2e:reset


## Configuration Modes

### Mode A: Configured (Recommended)

**Setup:**
npm run test:e2e:setup


**Benefits:**
- ✅ You control where tests run
- ✅ Safe for repeated use
- ✅ Config persists across runs
- ✅ Shows clearly which team/initiative

**Config Location:**
- File: `tests/e2e-config.json`
- Gitignored: Yes
- Sharable: No (contains your workspace IDs)

### Mode B: Random (Risky)

**Usage:**
E2E_RANDOM=true npm run test:e2e


**Benefits:**
- ⚡ No setup required
- 🔄 Different selection each time

**Risks:**
- ⚠️ May select production team/initiative
- ⚠️ No control over selection
- ⚠️ Config not saved

**When to use:**
- CI/CD pipelines with test workspaces
- Quick one-off test runs
- When you understand the risks

## What E2E Tests Do

E2E tests create **real** Linear entities:
- Projects with names like `E2E_20250115_103045_TestName`
- Real API calls (counts API usage)
- Real data in your workspace

### Cleanup

After tests run, a cleanup script is generated:

bash tests/e2e/cleanup-generated.sh


Or via npm:

npm run test:e2e:cleanup


**Note:** Delete commands not yet implemented. Script shows entities to delete manually.

## Test Suites

### 1. Project Create E2E
- Tests project creation with caching
- Validates API call reduction
- Uses 5 members dynamically

### 2. Project Update E2E
- Tests project updates with caching
- Validates API call reduction
- Tests multiple field updates

### 3. Caching Performance
- Measures API call reduction (target: 60-70%)
- Measures wall-clock time reduction (target: 50-70%)
- Compares baseline vs cached

### 4. Regression Tests
- Ensures behavior unchanged
- Tests all fields still work
- Validates output consistency

## Troubleshooting

### Error: "E2E tests require configuration"

**Solution:** Run `npm run test:e2e:setup`

### Error: "LINEAR_API_KEY not set"

**Solution:**
export LINEAR_API_KEY=lin_api_xxx...


Get key from: https://linear.app/settings/api

### Error: "No teams found"

**Solution:** Check API key has correct permissions

### Tests creating wrong projects

**Solution:**
1. Check config: `npm run test:e2e:show-config`
2. Reset if wrong: `npm run test:e2e:reset`
3. Reconfigure: `npm run test:e2e:setup`

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - name: Run E2E (random mode)
        env:
          LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}
          E2E_RANDOM: true
        run: npm run test:e2e
```

**Note:** Use dedicated test workspace, not production!

## Best Practices

1. **Use configured mode** for local development
2. **Use random mode** only in CI with test workspace
3. **Run cleanup** after tests to avoid clutter
4. **Review config** before running if unsure
5. **Don't commit** `e2e-config.json` (gitignored)

## FAQ

**Q: Will tests pollute my production data?**
A: Only if you select production team/initiative. Use test workspace or dedicated team.

**Q: Can I run tests in parallel?**
A: Not recommended. Tests may conflict if creating same entities.

**Q: How long do tests take?**
A: ~2-5 minutes depending on API latency.

**Q: Can I skip certain tests?**
A: Yes, comment out imports in `tests/e2e/runner.ts`

**Q: Do tests count against API rate limits?**
A: Yes. Expect ~50-100 API calls per full test run.
```

---

### Execution Examples

#### Setup (First Time)

```bash
$ npm run test:e2e:setup

┌─────────────────────────────────────┐
│  E2E Test Configuration Setup       │
└─────────────────────────────────────┘

Loading workspace data...

Select a team for E2E testing:
  Use ↑↓ arrows and Enter to select

❯ Engineering (team_abc123)
  Design (team_def456)
  Marketing (team_ghi789)

[Press Enter]

Select an initiative for E2E testing:
  Use ↑↓ arrows and Enter to select

❯ Q1 2025 Goals (init_xyz789)
  Website Redesign (init_abc123)
  Mobile App Launch (init_def456)

[Press Enter]

✅ E2E Configuration Complete!

Team: Engineering
Initiative: Q1 2025 Goals

Run tests with: npm run test:e2e

To reconfigure later: npm run test:e2e:setup
```

#### Run Tests (Configured Mode)

```bash
$ npm run test:e2e

🔧 E2E Configuration:
   Team: Engineering (team_abc123)
   Initiative: Q1 2025 Goals (init_xyz789)
   Mode: configured

Running 8 E2E tests...

  Project create with 5 members (verify API call reduction) ... ✅
    (6 API calls, target: ≤8)
  Project create without cache (baseline) ... ✅
    (18 API calls, baseline)
  Project update with status change ... ✅
    (3 API calls, target: ≤4)
  API call reduction: 60-70% for project create ... ✅
    (66.7% reduction: 18 → 6 calls)
  Wall-clock time reduction: 50-70% ... ✅
    (58.3% faster: 2400ms → 1000ms)
  Project create still works with all fields ... ✅
  Project update still works identically ... ✅

============================================================
E2E Test Summary
============================================================
Passed: 7
Failed: 0
Total:  7

Created 12 entities

📋 Cleanup script generated: tests/e2e/cleanup-generated.sh

Run cleanup with:
  npm run test:e2e:cleanup
```

#### Run Tests (Random Mode)

```bash
$ E2E_RANDOM=true npm run test:e2e

⚠️  RANDOM MODE SELECTED:
   Team: Design (team_def456)
   Initiative: Q2 Planning (init_random123)

⚠️  Tests will create real entities in this team/initiative!
   Consider running: npm run test:e2e:setup

Running 7 E2E tests...

  [... tests run ...]
```

#### Run Tests (No Config, No Random)

```bash
$ npm run test:e2e

╔═══════════════════════════════════════════════════════════════╗
║  ❌ E2E Tests Require Configuration                           ║
╚═══════════════════════════════════════════════════════════════╝

E2E tests create REAL Linear entities. You must specify where to run them.

Please choose ONE of the following options:

┌───────────────────────────────────────────────────────────────┐
│  A) Configure Test Workspace (RECOMMENDED)                    │
└───────────────────────────────────────────────────────────────┘

   npm run test:e2e:setup

   [... full instructions ...]
```

---

### Pros & Cons

**Pros:**
- ✅ **Real API**: Tests actual Linear behavior
- ✅ **No mocks**: Catches real integration issues
- ✅ **Dynamic data**: No hardcoded values
- ✅ **Safe config**: User controls where tests run
- ✅ **Performance validation**: Measures actual API call reduction
- ✅ **Confidence**: High confidence for releases

**Cons:**
- ⏱️ **Slow**: 2-5 minutes (vs milliseconds for unit)
- 🧹 **Cleanup needed**: Creates real entities
- 🔑 **API key required**: Needs valid Linear access
- ⚠️ **Risk**: Can pollute production if misconfigured
- 📊 **No coverage**: Can't measure code coverage easily

---

## Recommended Approach: Use Both Designs Together

### Testing Strategy

1. **Unit Tests** (Design 1)
   - Run during development (watch mode)
   - Run on every commit (CI)
   - Fast feedback loop
   - Coverage metrics

2. **E2E Tests** (Design 2)
   - Run before releases
   - Run on PRs to main
   - Validate integration
   - Performance benchmarks

### CI/CD Pipeline Example

```yaml
name: Tests

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

  e2e:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - name: Run E2E
        env:
          LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY_TEST }}
          E2E_RANDOM: true
        run: npm run test:e2e
```

### Development Workflow

```bash
# During development (fast feedback)
npm run test:unit:watch

# Before committing
npm run test:unit

# Before releasing
npm run test:e2e:setup  # First time only
npm run test:e2e

# After E2E
npm run test:e2e:cleanup
```

---

## Implementation Timeline

### Phase 1: Unit Test Infrastructure (Week 1)
- **Day 1-2**: Setup Vitest, configs, fixtures (8 hours)
- **Day 3-4**: Validators + Parsers tests (6 hours)
- **Day 5**: File utils + Resolution tests (4 hours)

### Phase 2: Unit Test Caching (Week 2)
- **Day 1-2**: Entity cache tests (8 hours)
- **Day 3**: Batch fetcher tests (4 hours)
- **Day 4-5**: Command integration tests (8 hours)

### Phase 3: E2E Infrastructure (Week 3)
- **Day 1-2**: Config manager + Interactive setup (8 hours)
- **Day 3**: Preflight + Random selector (4 hours)
- **Day 4**: Test runner + Trackers (6 hours)

### Phase 4: E2E Test Specs (Week 4)
- **Day 1-2**: Project create E2E (6 hours)
- **Day 3**: Project update E2E (4 hours)
- **Day 4**: Caching performance E2E (4 hours)
- **Day 5**: Regression tests + Polish (4 hours)

### Phase 5: Documentation & Polish (Week 5)
- **Day 1**: README-E2E-TESTS.md (4 hours)
- **Day 2**: CI integration examples (4 hours)
- **Day 3-5**: Bug fixes, refinements (12 hours)

**Total Estimated Time: ~5 weeks** (assuming part-time work, ~4 hours/day)

---

## Success Criteria

### Unit Tests (Design 1)
- ✅ 80%+ code coverage for utility modules
- ✅ 70%+ code coverage for commands
- ✅ All tests run in <10 seconds
- ✅ Watch mode works smoothly
- ✅ CI integration complete

### E2E Tests (Design 2)
- ✅ Zero hardcoded values
- ✅ Safe configuration system works
- ✅ Random mode works for CI
- ✅ API call reduction validated (60-70%)
- ✅ Cleanup tracking works
- ✅ Documentation complete

### Both
- ✅ All M14 test tasks covered (TS01-TS15)
- ✅ npm scripts work correctly
- ✅ Developer experience is smooth
- ✅ Tests catch real bugs
- ✅ Confidence in refactoring

---

## Next Steps

1. **Review this document** with team
2. **Choose testing framework** (recommend: both Vitest + E2E)
3. **Set up infrastructure** (Phase 1)
4. **Write tests iteratively** (Phases 2-4)
5. **Document and polish** (Phase 5)
6. **Integrate into CI/CD**

---

## Questions to Resolve

1. **Coverage thresholds**: 80% good, or aim higher?
2. **E2E frequency**: Every PR, or only releases?
3. **Test workspace**: Create dedicated Linear workspace for CI?
4. **Cleanup automation**: Wait for delete commands, or manual?
5. **Performance benchmarks**: Include in CI, or manual only?

---

*Document Version: 1.0*
*Last Updated: 2025-01-27*
*Author: Claude Code (based on linear-create codebase analysis)*
