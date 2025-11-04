# M14 E2E Testing Implementation - Real Linear API Tests

## Document Navigation

📚 **Start with the overview** if you haven't already:
- **[M14_TS_IMPLEMENTATION_OVERVIEW.md](./M14_TS_IMPLEMENTATION_OVERVIEW.md)** - Strategy, timeline, and how Unit + E2E tests work together

📖 **Related documents**:
- **[MILESTONES.md](./MILESTONES.md#milestone-m14)** - Master task tracking (M14-E2E01 through M14-E2E05)
- **[M14_TS_P1_IMPLEMENTATION_UNIT.md](./M14_TS_P1_IMPLEMENTATION_UNIT.md)** - Phase 1: Unit test implementation (complete this first)

**Task IDs in this document**: M14-E2E01 through M14-E2E05 (E2E tests)

---

## Overview

This document provides a detailed implementation plan for **Phase 2 of M14 Testing**: End-to-End (E2E) test implementation using real Linear API with dynamic data lookup and isolated test configuration.

**Before starting**:
1. Read [M14_TS_IMPLEMENTATION_OVERVIEW.md](./M14_TS_IMPLEMENTATION_OVERVIEW.md) to understand the complete testing strategy
2. Complete [M14_TS_P1_IMPLEMENTATION_UNIT.md](./M14_TS_P1_IMPLEMENTATION_UNIT.md) - Phase 1 should be finished before starting E2E tests

---

## Design: E2E Test Implementation (TypeScript/Bash Hybrid)

### Why E2E Tests?
- ✅ **Tests real Linear API behavior** - No mocks, catches actual API issues
- ✅ **Validates integration** - Tests how components work together
- ✅ **Performance validation** - Measures actual API call reduction
- ✅ **Release confidence** - High confidence for production deployments
- ✅ **Dynamic data** - No hardcoded values, safe for any workspace

### Architecture

#### Directory Structure
```
tests/
├── e2e/
│   ├── setup/
│   │   ├── e2e-config.ts            # Config manager
│   │   ├── interactive-setup.ts     # Interactive team/initiative selector
│   │   ├── random-selector.ts       # Random fallback for CI
│   │   └── preflight-check.ts       # Pre-test validation
│   ├── lib/
│   │   ├── test-runner.ts           # E2E test framework
│   │   ├── cleanup-tracker.ts       # Track created entities
│   │   ├── api-call-tracker.ts      # Count API calls
│   │   ├── assertions.ts            # E2E assertions
│   │   └── test-data-generator.ts   # Generate test content
│   ├── specs/
│   │   ├── project-create.e2e.ts    # M14-E2E01
│   │   ├── project-update.e2e.ts    # M14-E2E02 (optional)
│   │   ├── regression.e2e.ts        # M14-E2E03
│   │   └── caching-performance.e2e.ts # M14-E2E04, M14-E2E05
│   ├── fixtures/
│   │   └── test-templates.ts        # Reusable test patterns
│   └── runner.ts                     # Main test entry point
├── e2e-config.json                   # Local config (gitignored)
├── e2e-config.example.json           # Example template (checked in)
└── README-E2E-TESTS.md               # Documentation (optional)
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

---

## Implementation Tasks

### Phase 1: Setup Infrastructure (4 hours)

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

### Phase 2: Test Framework (3 hours)

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

### Phase 3: Test Specs (8 hours)

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

### Phase 4: NPM Scripts & Documentation (2 hours)

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

**Task 4.3: Create Example Config** (`tests/e2e-config.example.json`)

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

---

## Execution Examples

### Setup (First Time)

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

### Run Tests (Configured Mode)

```bash
$ npm run test:e2e

🔧 E2E Configuration:
   Team: Engineering (team_abc123)
   Initiative: Q1 2025 Goals (init_xyz789)
   Mode: configured

Running 7 E2E tests...

  Project create with 5 members (verify API call reduction) ... ✅
    (6 API calls, target: ≤8)
  Project create without cache (baseline) ... ✅
    (18 API calls, baseline)
  API call reduction: 60-70% for project create ... ✅
    (66.7% reduction: 18 → 6 calls)
  Wall-clock time reduction: 50-70% ... ✅
    (58.3% faster: 2400ms → 1000ms)
  Project create still works with all fields ... ✅
  Project update still works identically ... ✅

============================================================
E2E Test Summary
============================================================
Passed: 6
Failed: 0
Total:  6

Created 10 entities

📋 Cleanup script generated: tests/e2e/cleanup-generated.sh

Run cleanup with:
  npm run test:e2e:cleanup
```

### Run Tests (Random Mode)

```bash
$ E2E_RANDOM=true npm run test:e2e

⚠️  RANDOM MODE SELECTED:
   Team: Design (team_def456)
   Initiative: Q2 Planning (init_random123)

⚠️  Tests will create real entities in this team/initiative!
   Consider running: npm run test:e2e:setup

Running 6 E2E tests...

  [... tests run ...]
```

---

## Pros & Cons

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

## Development Workflow

### First Time Setup
```bash
# Configure test workspace
npm run test:e2e:setup

# Select team and initiative interactively
# Config saved to tests/e2e-config.json (gitignored)
```

### Running Tests
```bash
# Run all E2E tests
npm run test:e2e

# View current config
npm run test:e2e:show-config

# Reset config (to reconfigure)
npm run test:e2e:reset
npm run test:e2e:setup
```

### After Tests
```bash
# Review created entities
cat tests/e2e/cleanup-generated.sh

# Run cleanup (currently shows manual steps)
npm run test:e2e:cleanup
```

---

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
          LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY_TEST }}
          E2E_RANDOM: true
        run: npm run test:e2e
```

**Important**: Use a dedicated test workspace in CI, not production!

---

## Implementation Timeline

### Week 3: Setup Infrastructure
- **Day 1-2**: Config manager + Interactive setup (8 hours)
- **Day 3**: Preflight + Random selector (4 hours)
- **Day 4**: Test runner + Trackers (6 hours)

### Week 4: Test Specs & Documentation
- **Day 1-2**: Project create E2E (6 hours)
- **Day 3**: Caching performance E2E (4 hours)
- **Day 4**: Regression tests (4 hours)
- **Day 5**: Documentation + Polish (4 hours)

**Total: ~36 hours over 2 weeks**

---

## Success Criteria

### E2E Test Quality
- ✅ Zero hardcoded values (all dynamic lookups)
- ✅ Safe configuration system works (interactive + random modes)
- ✅ API call reduction validated (60-70% target met)
- ✅ Cleanup tracking generates scripts
- ✅ Clear error messages and failure modes

### Test Coverage
- ✅ M14-E2E01: Project create E2E with caching (basic validation)
- ✅ M14-E2E02: Project update E2E with caching (optional)
- ✅ M14-E2E03: Regression tests (behavior unchanged)
- ✅ M14-E2E04: API call reduction measurement (60-70% target)
- ✅ M14-E2E05: Wall-clock time reduction measurement (50-70% target)

### User Experience
- ✅ Setup process is clear and guided
- ✅ Configuration is reusable
- ✅ Random mode works for CI
- ✅ Cleanup is tracked and documented
- ✅ Tests run in 2-5 minutes

---

## Integration with Unit Tests

E2E tests complement unit tests to provide comprehensive coverage:

### Unit Tests (Phase 1)
- **When**: During development, on every commit
- **Purpose**: Fast feedback, catch logic errors
- **Speed**: Milliseconds
- **Scope**: Individual functions with mocks

**For complete integration strategy**, see:
- [M14_TS_IMPLEMENTATION_OVERVIEW.md](./M14_TS_IMPLEMENTATION_OVERVIEW.md) - Testing strategy, CI/CD pipeline, development workflow
- [M14_TS_P1_IMPLEMENTATION_UNIT.md](./M14_TS_P1_IMPLEMENTATION_UNIT.md) - Unit test implementation details

### E2E Tests (This Phase)
- **When**: Before releases, on PRs to main
- **Purpose**: Validate real integration, performance
- **Speed**: 2-5 minutes
- **Scope**: Full workflows with real API

### Recommended Testing Strategy

```bash
# 1. During development (fast feedback)
npm run test:unit:watch

# 2. Before committing
npm run test:unit

# 3. Before releasing (both)
npm run test:unit
npm run test:e2e
npm run test:e2e:cleanup

# 4. In CI: Unit on every push, E2E on PRs only
```

---

## Best Practices

1. **Use configured mode** for local development
   ```bash
   npm run test:e2e:setup  # Once
   npm run test:e2e        # Many times
   ```

2. **Use random mode** only in CI with test workspace
   ```bash
   E2E_RANDOM=true npm run test:e2e  # CI only
   ```

3. **Run cleanup** after tests to avoid clutter
   ```bash
   npm run test:e2e:cleanup
   ```

4. **Review config** before running if unsure
   ```bash
   npm run test:e2e:show-config
   ```

5. **Don't commit** `e2e-config.json` (already gitignored)

---

## Troubleshooting

### Error: "E2E tests require configuration"
**Solution**: Run `npm run test:e2e:setup` or use `E2E_RANDOM=true`

### Error: "LINEAR_API_KEY not set"
**Solution**:
```bash
export LINEAR_API_KEY=lin_api_xxx...
```
Get key from: https://linear.app/settings/api

### Error: "No teams found"
**Solution**: Check API key has correct permissions

### Tests creating wrong projects
**Solution**:
```bash
npm run test:e2e:show-config  # Check current config
npm run test:e2e:reset        # Reset if wrong
npm run test:e2e:setup        # Reconfigure
```

---

## Next Steps

1. **Complete Phase 1 (Unit Tests)** first
   - See [M14_TS_P1_IMPLEMENTATION_UNIT.md](./M14_TS_P1_IMPLEMENTATION_UNIT.md)

2. **Create E2E infrastructure**
   - Config manager
   - Interactive setup
   - Preflight checks

3. **Build test framework**
   - API call tracker
   - Cleanup tracker
   - Test runner

4. **Write test specs**
   - Project create E2E
   - Caching performance
   - Regression tests

5. **Document and integrate**
   - Update README
   - Add CI/CD examples
   - Test in real workspace

6. **Verify both phases work together**
   ```bash
   npm run test  # Should run both unit and E2E
   ```

---

*Document Version: 1.0*
*Created: 2025-01-27*
*Phase: E2E Testing (Phase 2 of M14)*
