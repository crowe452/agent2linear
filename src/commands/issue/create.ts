import {
  createIssue,
  getCurrentUser,
  resolveMemberIdentifier,
  getTemplateById,
  validateTeamExists,
} from '../../lib/linear-client.js';
import type { IssueCreateInput } from '../../lib/types.js';
import { getConfig } from '../../lib/config.js';
import { openInBrowser } from '../../lib/browser.js';
import { resolveAlias } from '../../lib/aliases.js';
import { resolveIssueId } from '../../lib/issue-resolver.js';
import { readContentFile } from '../../lib/file-utils.js';

interface CreateOptions {
  // Required
  title?: string;
  team?: string;

  // Content (mutual exclusivity)
  description?: string;
  descriptionFile?: string;

  // Priority & Estimation
  priority?: number; // 0=None, 1=Urgent, 2=High, 3=Normal, 4=Low
  estimate?: number;

  // Workflow
  state?: string; // Workflow state ID or alias

  // Dates
  dueDate?: string; // YYYY-MM-DD

  // Assignment
  assignee?: string; // ID, alias, email, or display name
  noAssignee?: boolean; // Override auto-assignment
  subscribers?: string; // Comma-separated

  // Organization
  project?: string; // ID, alias, or name
  cycle?: string; // UUID or alias
  parent?: string; // Issue identifier (ENG-123) or UUID
  labels?: string; // Comma-separated IDs or aliases

  // Template
  template?: string; // ID or alias

  // Mode
  web?: boolean; // Open in browser after creation
}

/**
 * Create an issue non-interactively
 */
async function createIssueNonInteractive(options: CreateOptions) {
  try {
    // ═══════════════════════════════════════════════════════════════════
    // PHASE 1: VALIDATION - Mutual Exclusivity & Required Fields
    // ═══════════════════════════════════════════════════════════════════

    // Validate mutual exclusivity of --description and --description-file
    if (options.description && options.descriptionFile) {
      console.error('❌ Error: Cannot use both --description and --description-file\n');
      console.error('Choose one:');
      console.error('  --description "markdown text"  (inline description)');
      console.error('  --description-file path/to/file.md  (file description)\n');
      process.exit(1);
    }

    // Read description from file if --description-file is provided
    let description = options.description;
    if (options.descriptionFile) {
      const result = await readContentFile(options.descriptionFile);
      if (!result.success) {
        console.error(`❌ Error reading file: ${options.descriptionFile}\n`);
        console.error(`   ${result.error}\n`);
        process.exit(1);
      }
      description = result.content;
      console.log(`📄 Read description from: ${options.descriptionFile}`);
    }

    // Validate required field: title
    if (!options.title) {
      console.error('❌ Error: --title is required\n');
      console.error('Provide the title:');
      console.error('  linear-create issue create --title "Fix bug"\n');
      console.error('For all options, see:');
      console.error('  linear-create issue create --help\n');
      process.exit(1);
    }

    const title = options.title.trim();

    // Validate title length
    if (title.length < 1) {
      console.error('❌ Error: Title cannot be empty');
      process.exit(1);
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 2: CONFIG & DEFAULTS
    // ═══════════════════════════════════════════════════════════════════

    // Get config for defaults
    const config = getConfig();

    // Prewarm cache with all entities needed for validation (reduces API calls)
    // Only if enabled in config (default: true)
    // Note: prewarmIssueCreation is not yet implemented, this is a placeholder for future optimization
    if (config.prewarmCacheOnCreate !== false) {
      // console.log('🔄 Loading workspace data...');
      // Will be implemented in future optimization milestone
    }

    let teamId = options.team || config.defaultTeam;
    let projectId = options.project || config.defaultProject;
    let templateId = options.template;

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 3: ALIAS RESOLUTION
    // ═══════════════════════════════════════════════════════════════════

    // Resolve team alias if provided
    if (teamId) {
      const resolvedTeam = resolveAlias('team', teamId);
      if (resolvedTeam !== teamId) {
        console.log(`📎 Resolved team alias "${teamId}" to ${resolvedTeam}`);
        teamId = resolvedTeam;
      }
    }

    // Resolve template alias if provided
    if (templateId) {
      const resolvedTemplate = resolveAlias('issue-template', templateId);
      if (resolvedTemplate !== templateId) {
        console.log(`📎 Resolved template alias "${templateId}" to ${resolvedTemplate}`);
        templateId = resolvedTemplate;
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 4: REQUIRED FIELD VALIDATION
    // ═══════════════════════════════════════════════════════════════════

    // Validate team is provided (REQUIRED)
    if (!teamId) {
      console.error('❌ Error: Team is required for issue creation\n');
      console.error('Please specify a team using one of these options:\n');
      console.error('  1. Use --team flag:');
      console.error(`     $ linear-create issue create --title "${title}" --team team_xxx\n`);
      console.error('  2. Set a default team:');
      console.error('     $ linear-create config set defaultTeam team_xxx\n');
      console.error('  3. List available teams:');
      console.error('     $ linear-create teams list\n');
      process.exit(1);
    }

    // Validate team exists
    console.log(`🔍 Validating team: ${teamId}...`);
    const teamCheck = await validateTeamExists(teamId);
    if (!teamCheck.valid) {
      console.error(`❌ ${teamCheck.error}`);
      process.exit(1);
    }
    console.log(`   ✓ Team found: ${teamCheck.name}`);

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 5: TEMPLATE VALIDATION
    // ═══════════════════════════════════════════════════════════════════

    // Validate template if provided
    if (templateId) {
      console.log(`🔍 Validating template: ${templateId}...`);
      const template = await getTemplateById(templateId);
      if (!template) {
        const { formatEntityNotFoundError } = await import('../../lib/validators.js');
        console.error(formatEntityNotFoundError('template', templateId, 'templates list issues'));
        process.exit(1);
      }
      // Note: Template type validation (issue vs project) happens in Linear API
      console.log(`   ✓ Template found: ${template.name}`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 6: WORKFLOW STATE (with team validation)
    // ═══════════════════════════════════════════════════════════════════

    let stateId: string | undefined;
    if (options.state) {
      const { resolveStatusOrThrow } = await import('../../lib/resolution.js');
      try {
        stateId = await resolveStatusOrThrow(options.state, 'workflow-state');

        // Validate state belongs to the specified team
        const { getLinearClient } = await import('../../lib/linear-client.js');
        const client = getLinearClient();
        const state = await client.workflowState(stateId);

        if (state) {
          const stateTeam = await state.team;
          if (stateTeam && stateTeam.id !== teamId) {
            console.error(`❌ Error: State validation failed\n`);
            console.error(`   State "${state.name}" belongs to team "${stateTeam.name}"`);
            console.error(`   but issue team is "${teamCheck.name}"`);
            console.error(`\n   Please choose a state from the "${teamCheck.name}" team\n`);
            process.exit(1);
          }
        }
      } catch (error) {
        console.error(`❌ ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 7: PRIORITY & ESTIMATE VALIDATION
    // ═══════════════════════════════════════════════════════════════════

    // Validate priority if provided (0-4)
    if (options.priority !== undefined) {
      const { validatePriority } = await import('../../lib/validators.js');
      const priorityResult = validatePriority(options.priority);
      if (!priorityResult.valid) {
        console.error(`❌ ${priorityResult.error}`);
        process.exit(1);
      }
    }

    // Estimate validation (just ensure it's a positive number)
    if (options.estimate !== undefined && options.estimate < 0) {
      console.error('❌ Error: Estimate must be a non-negative number');
      process.exit(1);
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 8: DATE VALIDATION
    // ═══════════════════════════════════════════════════════════════════

    let dueDate: string | undefined;
    if (options.dueDate) {
      const { validateISODate } = await import('../../lib/validators.js');
      const dateResult = validateISODate(options.dueDate);
      if (!dateResult.valid) {
        console.error(`❌ ${dateResult.error}`);
        process.exit(1);
      }
      dueDate = options.dueDate;
      console.log(`📅 Due date: ${dueDate}`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 9: ASSIGNMENT (Auto-assign by default)
    // ═══════════════════════════════════════════════════════════════════

    let assigneeId: string | undefined;

    if (options.assignee) {
      // Explicit assignee specified - resolve using smart resolution
      console.log(`🔍 Validating assignee...`);
      const member = await resolveMemberIdentifier(options.assignee, resolveAlias);

      if (!member) {
        const { formatEntityNotFoundError } = await import('../../lib/validators.js');
        console.error(formatEntityNotFoundError('member', options.assignee, 'members list'));
        console.error(`   Note: Tried alias lookup, ID lookup, email lookup, and name lookup`);
        process.exit(1);
      }

      // Show what was resolved
      if (options.assignee !== member.id) {
        if (options.assignee.includes('@')) {
          console.log(`📎 Resolved email "${options.assignee}" to ${member.name}`);
        } else {
          console.log(`📎 Resolved "${options.assignee}" to ${member.name}`);
        }
      }

      console.log(`   ✓ Assignee: ${member.name} (${member.email})`);
      assigneeId = member.id;
    } else if (options.noAssignee === true) {
      // Explicit no-assignee specified - don't assign
      console.log(`📋 Creating unassigned issue`);
      assigneeId = undefined;
    } else {
      // Default behavior: Auto-assign to current user
      try {
        const currentUser = await getCurrentUser();
        assigneeId = currentUser.id;
        console.log(`👤 Auto-assigning to: ${currentUser.name}`);
      } catch (error) {
        console.warn(
          `⚠️  Warning: Could not auto-assign: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        console.warn('   Continuing without assignee assignment.');
        assigneeId = undefined;
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 10: SUBSCRIBERS (comma-separated list)
    // ═══════════════════════════════════════════════════════════════════

    let subscriberIds: string[] | undefined;
    if (options.subscribers) {
      const { parseCommaSeparated } = await import('../../lib/parsers.js');
      const rawSubscribers = parseCommaSeparated(options.subscribers);

      console.log(`🔍 Validating ${rawSubscribers.length} subscriber(s)...`);
      const resolvedSubscribers: string[] = [];

      for (const identifier of rawSubscribers) {
        const member = await resolveMemberIdentifier(identifier, resolveAlias);

        if (!member) {
          const { formatEntityNotFoundError } = await import('../../lib/validators.js');
          console.error(formatEntityNotFoundError('subscriber', identifier, 'members list'));
          console.error(`   Note: Tried alias lookup, ID lookup, email lookup, and name lookup`);
          process.exit(1);
        }

        // Show what was resolved
        if (identifier !== member.id) {
          if (identifier.includes('@')) {
            console.log(`📎 Resolved email "${identifier}" to ${member.name}`);
          } else {
            console.log(`📎 Resolved "${identifier}" to ${member.name}`);
          }
        }

        console.log(`   ✓ Subscriber: ${member.name} (${member.email})`);
        resolvedSubscribers.push(member.id);
      }

      subscriberIds = resolvedSubscribers;
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 11: PROJECT (with defaultProject and team compatibility)
    // ═══════════════════════════════════════════════════════════════════

    if (projectId) {
      // Resolve project by ID, alias, or name
      const { getLinearClient, findProjectByName } = await import('../../lib/linear-client.js');
      const client = getLinearClient();

      // Try alias resolution first
      const resolvedProjectId = resolveAlias('project', projectId);
      if (resolvedProjectId !== projectId) {
        console.log(`📎 Resolved project alias "${projectId}" to ${resolvedProjectId}`);
        projectId = resolvedProjectId;
      }

      // Validate project exists and check team compatibility
      try {
        let project = await client.project(projectId);

        // If project not found by ID, try name-based lookup
        if (!project) {
          const projectByName = await findProjectByName(projectId);
          if (projectByName) {
            projectId = projectByName.id;
            project = await client.project(projectId);
            if (options.project) {
              console.log(`📎 Resolved project name "${options.project}" to ${projectByName.name}`);
            }
          }
        }

        // If still not found, error
        if (!project) {
          const { formatEntityNotFoundError } = await import('../../lib/validators.js');
          const searchTerm = options.project || projectId || '';
          console.error(formatEntityNotFoundError('project', searchTerm, 'project list'));
          process.exit(1);
        }

        // Validate team compatibility
        const teams = await project.teams();
        const teamsList = await teams.nodes;
        const projectTeam = teamsList && teamsList.length > 0 ? teamsList[0] : null;

        if (projectTeam && projectTeam.id !== teamId) {
          console.error(`❌ Error: Project-team compatibility validation failed\n`);
          console.error(`   Project "${project.name}" belongs to team "${projectTeam.name}"`);
          console.error(`   but issue team is "${teamCheck.name}"`);

          // Check if this came from defaultProject config
          if (options.project === undefined && config.defaultProject) {
            console.error(`\n   This project came from your defaultProject config setting.`);
            console.error(`   To fix this, either:`);
            console.error(`     1. Use --project to specify a compatible project`);
            console.error(`     2. Update config: linear-create config set defaultProject <project-id>\n`);
          } else {
            console.error(`\n   Please choose a project from the "${teamCheck.name}" team\n`);
          }
          process.exit(1);
        }

        console.log(`   ✓ Project: ${project.name}`);
      } catch (error) {
        if (error instanceof Error && error.message.includes('compatibility')) {
          throw error; // Re-throw our validation errors
        }
        const { formatEntityNotFoundError } = await import('../../lib/validators.js');
        const searchTerm = options.project || projectId || '';
        console.error(formatEntityNotFoundError('project', searchTerm, 'project list'));
        process.exit(1);
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 12: CYCLE (UUID or alias)
    // ═══════════════════════════════════════════════════════════════════

    let cycleId: string | undefined;
    if (options.cycle) {
      // Resolve cycle by alias first, then validate as UUID
      const resolvedCycle = resolveAlias('cycle', options.cycle);
      if (resolvedCycle !== options.cycle) {
        console.log(`📎 Resolved cycle alias "${options.cycle}" to ${resolvedCycle}`);
      }

      // Validate format: must be UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(resolvedCycle)) {
        console.error(`❌ Error: Invalid cycle format: "${options.cycle}"`);
        console.error(`   Cycle must be a valid UUID or alias that resolves to a UUID`);
        console.error(`   Example: --cycle 550e8400-e29b-41d4-a716-446655440000\n`);
        process.exit(1);
      }

      cycleId = resolvedCycle;
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 13: PARENT ISSUE (for sub-issues)
    // ═══════════════════════════════════════════════════════════════════

    let parentId: string | undefined;
    if (options.parent) {
      try {
        console.log(`🔍 Validating parent issue: ${options.parent}...`);
        const resolved = await resolveIssueId(options.parent);
        if (resolved) {
          parentId = resolved;
          console.log(`   ✓ Parent issue found`);
        } else {
          console.error(`❌ Error: Parent issue not found: "${options.parent}"`);
          console.error(`   Expected format: ENG-123 or UUID\n`);
          process.exit(1);
        }
      } catch (error) {
        console.error(`❌ Error: Invalid parent issue identifier: "${options.parent}"`);
        console.error(`   ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error(`   Expected format: ENG-123 or UUID\n`);
        process.exit(1);
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 14: LABELS (comma-separated with alias resolution)
    // ═══════════════════════════════════════════════════════════════════

    let labelIds: string[] | undefined;
    if (options.labels) {
      const { parseCommaSeparated } = await import('../../lib/parsers.js');
      const rawLabels = parseCommaSeparated(options.labels);

      // Resolve all aliases
      labelIds = rawLabels.map(id => {
        const resolved = resolveAlias('issue-label', id);
        if (resolved !== id) {
          console.log(`📎 Resolved label alias "${id}" to ${resolved}`);
        }
        return resolved;
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 15: CREATE THE ISSUE
    // ═══════════════════════════════════════════════════════════════════

    console.log('\n🚀 Creating issue...');

    const issueData: IssueCreateInput = {
      title,
      teamId,
      description,
      priority: options.priority,
      estimate: options.estimate,
      stateId,
      assigneeId,
      subscriberIds,
      projectId,
      cycleId,
      parentId,
      labelIds,
      dueDate,
      templateId,
    };

    const result = await createIssue(issueData);

    // Display success message
    displaySuccess(result, options.noAssignee, assigneeId !== undefined);

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 16: WEB MODE (open in browser)
    // ═══════════════════════════════════════════════════════════════════

    if (options.web) {
      console.log(`🌐 Opening in browser: ${result.identifier} - ${result.title}`);
      await openInBrowser(result.url);
      console.log(`✓ Browser opened to ${result.url}\n`);
      process.exit(0);
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

/**
 * Display success message after issue creation
 */
function displaySuccess(
  result: { id: string; identifier: string; title: string; url: string },
  noAssignee?: boolean,
  hasAssignee?: boolean
) {
  console.log('\n✅ Issue created successfully!');
  console.log(`   Identifier: ${result.identifier}`);
  console.log(`   Title: ${result.title}`);
  console.log(`   ID: ${result.id}`);
  console.log(`   URL: ${result.url}`);

  if (noAssignee) {
    console.log(`   Assignee: (none)`);
  } else if (hasAssignee) {
    console.log(`   (assigned)`);
  }

  console.log('');
}

/**
 * Main entry point for issue create command
 */
export async function createIssueCommand(options: CreateOptions = {}) {
  // Non-interactive mode (interactive mode comes in M15.6)
  await createIssueNonInteractive(options);
}
