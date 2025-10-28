import { readFileSync } from 'fs';
import { resolveProject } from '../../lib/project-resolver.js';
import { updateProject } from '../../lib/linear-client.js';
import { showEntityNotFound, showError, showSuccess } from '../../lib/output.js';

interface UpdateOptions {
  status?: string;
  name?: string;
  description?: string;
  content?: string;
  contentFile?: string;
  priority?: string;
  targetDate?: string;
  startDate?: string;
  // M15 Phase 1: Visual & Ownership Fields
  color?: string;
  icon?: string;  // NOTE: No client-side validation - passed directly to Linear API
                  // See src/commands/project/create.tsx:208 for rationale
                  // See README.md "Icon Usage" and MILESTONES.md M14.6 for context
  lead?: string;
  // M15 Phase 2: Collaboration & Organization Fields
  members?: string;
  labels?: string;
  // M15 Phase 3: Date Resolutions
  startDateResolution?: 'month' | 'quarter' | 'halfYear' | 'year';
  targetDateResolution?: 'month' | 'quarter' | 'halfYear' | 'year';
}

function validateDateFormat(date: string, fieldName: string): void {
  // ISO 8601 date format: YYYY-MM-DD
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!isoDateRegex.test(date)) {
    showError(
      `Invalid ${fieldName} format`,
      `Date must be in ISO format (YYYY-MM-DD), e.g., 2025-01-15\n` +
      `   You provided: ${date}`
    );
    process.exit(1);
  }

  // Validate it's a valid date
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    showError(
      `Invalid ${fieldName}`,
      `"${date}" is not a valid date`
    );
    process.exit(1);
  }
}

export async function updateProjectCommand(nameOrId: string, options: UpdateOptions) {
  try {
    // Validate mutual exclusivity of --content and --content-file
    if (options.content && options.contentFile) {
      showError(
        'Cannot use both --content and --content-file',
        'Choose one:\n' +
        '  --content "markdown text"  (inline content)\n' +
        '  --content-file path/to/file.md  (file content)'
      );
      process.exit(1);
    }

    // Read content from file if --content-file is provided
    let content = options.content;
    if (options.contentFile) {
      try {
        content = readFileSync(options.contentFile, 'utf-8');
        console.log(`📄 Read content from: ${options.contentFile}`);
      } catch (error) {
        console.error(`❌ Error reading file: ${options.contentFile}\n`);
        if (error instanceof Error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            console.error('   File not found. Please check the path and try again.');
          } else if ((error as NodeJS.ErrnoException).code === 'EACCES') {
            console.error('   Permission denied. Please check file permissions.');
          } else {
            console.error(`   ${error.message}`);
          }
        }
        process.exit(1);
      }
    }

    // Validate at least one field provided
    // Note: content === undefined (not !content) to allow empty string for clearing content
    if (!options.status && !options.name && !options.description && content === undefined &&
        options.priority === undefined && !options.targetDate && !options.startDate &&
        !options.color && !options.icon && !options.lead && !options.members && !options.labels &&
        !options.startDateResolution && !options.targetDateResolution) {
      showError(
        'No update fields provided',
        'Specify at least one field to update:\n' +
        '  --status, --name, --description, --content, --content-file, --priority,\n' +
        '  --target-date, --start-date, --color, --icon, --lead, --members, --labels,\n' +
        '  --start-date-resolution, --target-date-resolution'
      );
      process.exit(1);
    }

    // Prewarm cache for potentially needed entities (reduces API calls by 40-50%)
    // Note: Only prewarm if we're updating fields that need validation
    if (options.status) {
      console.log('🔄 Loading workspace data...');
      const { prewarmProjectUpdate } = await import('../../lib/batch-fetcher.js');
      await prewarmProjectUpdate();
    }

    // Resolve project
    console.log(`🔍 Resolving project "${nameOrId}"...`);
    const resolved = await resolveProject(nameOrId);

    if (!resolved) {
      showEntityNotFound('project', nameOrId);
      console.error('   Tip: Use exact project name, project ID, or create an alias');
      process.exit(1);
    }

    const projectId = resolved.projectId;
    console.log(`   ✓ Found project: "${resolved.project?.name}"`);

    // Prepare updates
    const updates: {
      statusId?: string;
      name?: string;
      description?: string;
      content?: string;
      priority?: number;
      startDate?: string;
      targetDate?: string;
      color?: string;
      icon?: string;
      leadId?: string;
      memberIds?: string[];
      labelIds?: string[];
      startDateResolution?: 'month' | 'quarter' | 'halfYear' | 'year';
      targetDateResolution?: 'month' | 'quarter' | 'halfYear' | 'year';
    } = {};
    const changes: string[] = [];

    // Resolve status if provided
    if (options.status) {
      const { resolveStatusOrThrow } = await import('../../lib/resolution.js');
      const statusId = await resolveStatusOrThrow(options.status, 'project-status');
      updates.statusId = statusId;
      changes.push(`Status → ${options.status}`);
    }

    // Other fields
    if (options.name) {
      updates.name = options.name;
      changes.push(`Name → "${options.name}"`);
    }

    if (options.description) {
      updates.description = options.description;
      changes.push(`Description updated`);
    }

    if (content !== undefined) {
      updates.content = content;
      changes.push(content === '' ? `Content cleared` : `Content updated`);
    }

    if (options.priority !== undefined) {
      const { validatePriority } = await import('../../lib/validators.js');
      const result = validatePriority(options.priority);
      if (!result.valid) {
        showError('Invalid priority value', result.error || 'Unknown error');
        process.exit(1);
      }
      updates.priority = result.value;
      changes.push(`Priority → ${result.value}`);
    }

    if (options.targetDate) {
      validateDateFormat(options.targetDate, 'target date');
      updates.targetDate = options.targetDate;
      changes.push(`Target Date → ${options.targetDate}`);
    }

    if (options.startDate) {
      validateDateFormat(options.startDate, 'start date');
      updates.startDate = options.startDate;
      changes.push(`Start Date → ${options.startDate}`);
    }

    // M15 Phase 1: Visual & Ownership Fields

    // Color validation and normalization
    if (options.color) {
      const { validateAndNormalizeColor } = await import('../../lib/validators.js');
      const colorResult = validateAndNormalizeColor(options.color);
      if (!colorResult.valid) {
        showError('Invalid color value', colorResult.error || 'Unknown error');
        process.exit(1);
      }
      updates.color = colorResult.value;
      changes.push(`Color → ${colorResult.value}`);
    }

    // Icon handling (no client-side validation per M14.6)
    if (options.icon) {
      if (!options.icon.trim()) {
        showError('Invalid icon', 'Icon cannot be empty');
        process.exit(1);
      }
      updates.icon = options.icon;
      changes.push(`Icon → ${options.icon}`);
    }

    // Lead resolution
    if (options.lead) {
      console.log(`🔍 Validating lead member...`);
      const { resolveMemberIdentifier } = await import('../../lib/linear-client.js');
      const { resolveAlias } = await import('../../lib/aliases.js');

      const member = await resolveMemberIdentifier(options.lead, resolveAlias);

      if (!member) {
        const { formatEntityNotFoundError } = await import('../../lib/validators.js');
        console.error(formatEntityNotFoundError('lead member', options.lead, 'members list'));
        console.error(`   Note: Tried alias lookup, ID lookup, and email lookup`);
        process.exit(1);
      }

      // Show what was resolved
      if (options.lead !== member.id) {
        if (options.lead.includes('@')) {
          console.log(`   📎 Resolved email "${options.lead}" to ${member.name}`);
        } else {
          console.log(`   📎 Resolved "${options.lead}" to ${member.name}`);
        }
      }

      console.log(`   ✓ Lead found: ${member.name} (${member.email})`);

      updates.leadId = member.id;
      changes.push(`Lead → ${member.name}`);
    }

    // M15 Phase 2: Collaboration & Organization Fields

    // Members resolution
    if (options.members) {
      console.log(`🔍 Validating ${options.members.split(',').length} member(s)...`);
      const { parseCommaSeparated } = await import('../../lib/parsers.js');
      const { resolveMemberIdentifier } = await import('../../lib/linear-client.js');
      const { resolveAlias } = await import('../../lib/aliases.js');

      const rawMembers = parseCommaSeparated(options.members);
      const resolvedMembers: string[] = [];

      for (const identifier of rawMembers) {
        const member = await resolveMemberIdentifier(identifier, resolveAlias);

        if (!member) {
          const { formatEntityNotFoundError } = await import('../../lib/validators.js');
          console.error(formatEntityNotFoundError('member', identifier, 'members list'));
          console.error(`   Note: Tried alias lookup, ID lookup, and email lookup`);
          process.exit(1);
        }

        // Show what was resolved
        if (identifier !== member.id) {
          if (identifier.includes('@')) {
            console.log(`   📎 Resolved email "${identifier}" to ${member.name}`);
          } else {
            console.log(`   📎 Resolved "${identifier}" to ${member.name}`);
          }
        }

        console.log(`   ✓ Member found: ${member.name} (${member.email})`);
        resolvedMembers.push(member.id);
      }

      updates.memberIds = resolvedMembers;
      changes.push(`Members → ${resolvedMembers.length} member(s)`);
    }

    // Labels resolution
    if (options.labels) {
      const { parseCommaSeparated } = await import('../../lib/parsers.js');
      const { resolveAlias } = await import('../../lib/aliases.js');

      const rawLabels = parseCommaSeparated(options.labels);
      const resolvedLabels: string[] = [];

      for (const labelIdOrAlias of rawLabels) {
        const resolvedLabel = resolveAlias('project-label', labelIdOrAlias);

        // Log if alias was resolved
        if (resolvedLabel !== labelIdOrAlias) {
          console.log(`   📎 Resolved label alias "${labelIdOrAlias}" to ${resolvedLabel}`);
        }

        resolvedLabels.push(resolvedLabel);
      }

      updates.labelIds = resolvedLabels;
      changes.push(`Labels → ${resolvedLabels.length} label(s)`);
    }

    // M15 Phase 3: Date Resolutions

    // Start date resolution
    if (options.startDateResolution) {
      updates.startDateResolution = options.startDateResolution;
      changes.push(`Start Date Resolution → ${options.startDateResolution}`);
    }

    // Target date resolution
    if (options.targetDateResolution) {
      updates.targetDateResolution = options.targetDateResolution;
      changes.push(`Target Date Resolution → ${options.targetDateResolution}`);
    }

    // Update project
    console.log(`\n📝 Updating project...`);
    for (const change of changes) {
      console.log(`   ${change}`);
    }

    const result = await updateProject(projectId, updates);

    console.log('');
    showSuccess('Project updated successfully!', {
      'Name': result.name,
      'ID': result.id,
      'URL': result.url,
    });

  } catch (error) {
    showError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}
