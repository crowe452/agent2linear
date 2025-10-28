export interface Config {
  apiKey?: string;
  defaultInitiative?: string;
  defaultTeam?: string;
  defaultIssueTemplate?: string;
  defaultProjectTemplate?: string;
  defaultMilestoneTemplate?: string;
  projectCacheMinTTL?: number; // Cache TTL in minutes (default: 60)
  defaultAutoAssignLead?: boolean; // Auto-assign project lead to creator (default: true)

  // Entity cache configuration (M14 caching system)
  entityCacheMinTTL?: number; // Entity cache TTL in minutes (default: 60)
  enableEntityCache?: boolean; // Enable/disable entity caching (default: true)
  enablePersistentCache?: boolean; // Enable/disable file-based cache (default: true)
  enableSessionCache?: boolean; // Enable/disable in-memory cache (default: true)
  enableBatchFetching?: boolean; // Enable/disable batch API calls (default: true)
  prewarmCacheOnCreate?: boolean; // Auto-prewarm cache on project create (default: true)
}

export interface ConfigLocation {
  type: 'global' | 'project' | 'env' | 'none';
  path?: string;
}

export interface ResolvedConfig extends Config {
  locations: {
    apiKey: ConfigLocation;
    defaultInitiative: ConfigLocation;
    defaultTeam: ConfigLocation;
    defaultIssueTemplate: ConfigLocation;
    defaultProjectTemplate: ConfigLocation;
    defaultMilestoneTemplate: ConfigLocation;
    projectCacheMinTTL: ConfigLocation;
    defaultAutoAssignLead: ConfigLocation;
    entityCacheMinTTL: ConfigLocation;
    enableEntityCache: ConfigLocation;
    enablePersistentCache: ConfigLocation;
    enableSessionCache: ConfigLocation;
    enableBatchFetching: ConfigLocation;
    prewarmCacheOnCreate: ConfigLocation;
  };
}

export type AliasEntityType = 'initiative' | 'team' | 'project' | 'project-status' | 'issue-template' | 'project-template' | 'member' | 'issue-label' | 'project-label' | 'workflow-state';

export interface AliasMap {
  [alias: string]: string; // alias -> Linear ID
}

export interface Aliases {
  initiatives: AliasMap;
  teams: AliasMap;
  projects: AliasMap;
  projectStatuses: AliasMap;
  issueTemplates: AliasMap;
  projectTemplates: AliasMap;
  members: AliasMap;
  issueLabels: AliasMap;
  projectLabels: AliasMap;
  workflowStates: AliasMap;
}

export interface AliasLocation {
  type: 'global' | 'project';
  path: string;
}

export interface ResolvedAliases extends Aliases {
  locations: {
    [type in AliasEntityType]: {
      [alias: string]: AliasLocation;
    };
  };
}

/**
 * Template data structure
 */
export interface Template {
  id: string;
  name: string;
  type: 'issue' | 'project';
  description?: string;
}

/**
 * Milestone template data structures
 */
export interface MilestoneDefinition {
  name: string;
  description?: string;
  targetDate?: string; // Relative format: "+7d", "+2w", "+1m" or ISO date
}

export interface MilestoneTemplate {
  name: string;
  description?: string;
  milestones: MilestoneDefinition[];
}

export interface MilestoneTemplates {
  templates: {
    [templateName: string]: MilestoneTemplate;
  };
}

/**
 * Workflow State (Issue Status) data structure
 */
export interface WorkflowState {
  id: string;
  name: string;
  type: 'triage' | 'backlog' | 'unstarted' | 'started' | 'completed' | 'canceled';
  color: string;
  description?: string;
  position: number;
  teamId: string;
}

/**
 * Issue Label data structure
 */
export interface IssueLabel {
  id: string;
  name: string;
  description?: string;
  color: string;
  teamId?: string; // undefined for workspace-level labels
}

/**
 * Project Label data structure
 */
export interface ProjectLabel {
  id: string;
  name: string;
  description?: string;
  color: string;
}

/**
 * Color definition
 */
export interface Color {
  hex: string;
  name?: string;
  usageCount?: number; // For extracted colors
}

/**
 * Icon definition
 */
export interface Icon {
  name: string;
  emoji?: string;
  unicode?: string;
  category?: string;
}

/**
 * Project list filters (M20)
 */
export interface ProjectListFilters {
  teamId?: string;
  initiativeId?: string;
  statusId?: string;
  priority?: number;
  leadId?: string;
  memberIds?: string[];
  labelIds?: string[];
  startDateAfter?: string;
  startDateBefore?: string;
  targetDateAfter?: string;
  targetDateBefore?: string;
  search?: string;
}

/**
 * Project list item with comprehensive fields (M20)
 */
export interface ProjectListItem {
  id: string;
  name: string;
  description?: string;
  content?: string;
  icon?: string;
  color?: string;
  state: string;
  priority?: number;
  status?: {
    id: string;
    name: string;
    type: string;
  };
  lead?: {
    id: string;
    name: string;
    email: string;
  };
  team?: {
    id: string;
    name: string;
    key: string;
  };
  initiative?: {
    id: string;
    name: string;
  };
  labels: Array<{
    id: string;
    name: string;
    color?: string;
  }>;
  members: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  startDate?: string;
  targetDate?: string;
  completedAt?: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}
