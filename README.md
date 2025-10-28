# linear-create

Command-line tool for creating Linear issues and projects with support for initiatives.

## Installation

```bash
npm install
npm run build
```

## Configuration

Set your Linear API key as an environment variable:

```bash
export LINEAR_API_KEY=lin_api_xxxxxxxxxxxx
```

## Usage

```bash
# Show help
linear-create --help

# List initiatives (interactive)
linear-create initiatives list

# Set default initiative
linear-create initiatives set <id>

# Create a project (interactive)
linear-create project create

# Create a project (non-interactive)
linear-create project create --title "My Project" --description "Description" --state planned

# Show configuration
linear-create config show
```

## Project List & Search

List and search projects with smart defaults and extensive filtering. The `project list` command provides intelligent defaults for common workflows while supporting comprehensive filtering options.

### Smart Defaults

By default, `project list` filters to show projects where **you are the lead**, in your **default team and initiative** (if configured):

```bash
# Smart defaults: projects I lead in my default team/initiative
linear-create project list

# Equivalent to (if you have defaults configured):
# --lead <current-user-id> --team <default-team> --initiative <default-initiative>
```

### Override Flags

Use these flags to bypass smart defaults and see more projects:

```bash
# Show ALL projects (any lead) in default team/initiative
linear-create project list --all-leads

# Show projects I lead across ALL teams
linear-create project list --all-teams

# Show projects I lead across ALL initiatives
linear-create project list --all-initiatives

# Override everything - show ALL projects everywhere
linear-create project list --all-leads --all-teams --all-initiatives
```

### Filter Options

**Core Filters:**
```bash
# Filter by team
linear-create project list --team backend
linear-create project list -t backend

# Filter by initiative
linear-create project list --initiative q1-goals
linear-create project list -i q1-goals

# Filter by project status
linear-create project list --status planned
linear-create project list -s started

# Filter by priority (0-4)
linear-create project list --priority 1
linear-create project list -p 2

# Filter by specific project lead
linear-create project list --lead alice@company.com
linear-create project list -l alice

# Filter by member (projects where someone is assigned)
linear-create project list --member bob
linear-create project list -m alice,bob  # Multiple members

# Filter by label
linear-create project list --label urgent
linear-create project list --label urgent,critical  # Multiple labels

# Search in project name, description, or content
linear-create project list --search "API"
linear-create project list --search "mobile redesign"
```

**Date Range Filters:**
```bash
# Projects starting in Q1 2025
linear-create project list --start-after 2025-01-01 --start-before 2025-03-31

# Projects targeting after June 2025
linear-create project list --target-after 2025-06-01

# Projects targeting before end of year
linear-create project list --target-before 2025-12-31
```

### Output Formats

**Table Format (default):**
```bash
linear-create project list
```
Output:
```
ID           Title                          Status      Team           Lead                 Preview
-----------------------------------------------------------------------------------------------------------------------
bf2e1a8a9b   Mobile App Redesign            Started     Mobile         Alice Johnson        Complete redesign of iOS...
a9c3d4e5f6   API v2 Migration               Planned     Backend        Bob Smith            Migrate all endpoints...
c1d2e3f4g5   Customer Dashboard             Completed   Frontend       Carol Davis          New dashboard for customer...

Total: 3 projects
```

**JSON Format:**
```bash
# Machine-readable format for scripting
linear-create project list --format json
linear-create project list -f json

# Example with filtering
linear-create project list --team backend --status started --format json
```

**TSV Format:**
```bash
# Tab-separated values for data processing
linear-create project list --format tsv
linear-create project list -f tsv > projects.tsv
```

**Interactive Mode:**
```bash
# Ink UI with rich formatting
linear-create project list --interactive
linear-create project list -I
```

### Complex Filter Examples

```bash
# Backend team projects, started status, high priority
linear-create project list --team backend --status started --priority 1

# Projects led by specific person in any team
linear-create project list --lead alice@company.com --all-teams

# Projects where Bob is assigned (as member)
linear-create project list --member bob --all-leads

# Search for "API" projects in backend team (any lead)
linear-create project list --search "API" --team backend --all-leads

# Urgent projects targeting Q1 2025
linear-create project list --label urgent --target-after 2025-01-01 --target-before 2025-03-31

# All projects with multiple filters
linear-create project list \
  --team backend \
  --status started \
  --priority 1 \
  --lead alice \
  --label critical

# Export all projects to JSON
linear-create project list --all-teams --all-leads --all-initiatives --format json > all-projects.json
```

### Alias Support

All entity filters support aliases:

```bash
# Use team alias instead of ID
linear-create project list --team backend

# Use initiative alias
linear-create project list --initiative q1-goals

# Use member alias
linear-create project list --lead alice

# Use label alias
linear-create project list --label urgent,critical
```

### Setting Defaults

Configure default values to streamline your workflow:

```bash
# Set default team
linear-create config set defaultTeam backend

# Set default initiative
linear-create config set defaultInitiative q1-goals

# Now simple list uses your defaults:
linear-create project list
# Shows: projects you lead in 'backend' team within 'q1-goals' initiative
```

## Milestone Templates

Milestone templates allow you to quickly set up project milestones using predefined templates. Templates are stored locally in JSON files and can be customized for your workflows.

### Creating Templates

You can create milestone templates using the CLI (recommended) or by manually editing JSON files.

**Using the CLI (Interactive):**
```bash
# Interactive mode - guided wizard
linear-create milestone-templates create --interactive
linear-create mtmpl create -I

# Interactive mode with project scope
linear-create milestone-templates create --project --interactive
```

**Using the CLI (Non-Interactive):**
```bash
# Create a template with milestones
linear-create milestone-templates create my-sprint \
  --description "Custom 2-week sprint" \
  --milestone "Planning:+1d:Define sprint goals and tasks" \
  --milestone "Development:+10d:Implementation phase" \
  --milestone "Review:+14d:Code review and deployment"

# Create in project scope
linear-create milestone-templates create team-workflow \
  --project \
  --milestone "Kickoff::Team alignment meeting" \
  --milestone "Execution:+7d:Complete assigned tasks" \
  --milestone "Retrospective:+14d:Review and improve"
```

**Milestone Spec Format:** `name:targetDate:description`
- `name` - Required
- `targetDate` - Optional (+7d, +2w, +1m, or ISO date)
- `description` - Optional (supports markdown)

**Manual Template File Creation:**

Templates are stored at:
- **Global**: `~/.config/linear-create/milestone-templates.json` - Available across all projects
- **Project**: `.linear-create/milestone-templates.json` - Project-specific templates

**Example Template File:**
```json
{
  "templates": {
    "basic-sprint": {
      "name": "Basic Sprint Template",
      "description": "Simple 2-week sprint structure",
      "milestones": [
        {
          "name": "Sprint Planning",
          "description": "Define sprint goals and tasks",
          "targetDate": "+1d"
        },
        {
          "name": "Development",
          "description": "Implementation phase",
          "targetDate": "+10d"
        },
        {
          "name": "Review & Deploy",
          "description": "Code review and deployment",
          "targetDate": "+14d"
        }
      ]
    }
  }
}
```

**Managing Templates:**
```bash
# Edit a template (interactive)
linear-create milestone-templates edit basic-sprint

# Remove a template
linear-create milestone-templates remove basic-sprint
linear-create mtmpl rm old-template --yes  # Skip confirmation
```

### Using Milestone Templates

```bash
# List all templates
linear-create milestone-templates list
linear-create mtmpl ls                # Short alias

# View template details
linear-create milestone-templates view basic-sprint

# Add milestones to a project
linear-create project add-milestones PRJ-123 --template basic-sprint

# Set default template
linear-create config set defaultMilestoneTemplate basic-sprint

# Use default when creating milestones
linear-create project add-milestones PRJ-123  # Uses default template
```

### Date Offset Format

Target dates support relative formats:
- `+7d` - 7 days from now
- `+2w` - 2 weeks from now
- `+1m` - 1 month from now
- `2025-12-31` - Absolute ISO date

## Aliases

Aliases allow you to use simple, memorable names instead of long Linear IDs. For example, use "backend" instead of "init_abc123xyz". This is especially useful for AI assistants that have difficulty tracking long IDs.

### Managing Aliases

```bash
# Add an alias
linear-create alias add initiative backend init_abc123xyz
linear-create alias add team frontend team_def456uvw --project
linear-create alias add project api proj_ghi789rst

# List all aliases
linear-create alias list

# List aliases for a specific type
linear-create alias list initiatives
linear-create alias list teams

# Get the ID for an alias
linear-create alias get initiative backend

# Edit aliases interactively
linear-create alias edit           # Interactive mode - select scope, type, and alias to edit
linear-create alias edit --global  # Edit global aliases
linear-create alias edit --project # Edit project aliases

# Remove an alias
linear-create alias remove initiative backend
linear-create alias rm team frontend --project

# Validate all aliases
linear-create alias list --validate
```

### Using Aliases

Once configured, aliases can be used anywhere an ID is accepted:

```bash
# Use initiative alias
linear-create initiatives set backend
linear-create initiatives view backend

# Use team and initiative aliases in project creation
linear-create project create --title "New API" --team backend --initiative backend-init

# Use team alias in selection
linear-create teams select --id frontend
```

### Storage Locations

- **Global aliases**: `~/.config/linear-create/aliases.json` - Available across all projects
- **Project aliases**: `.linear-create/aliases.json` - Project-specific, can be version controlled

Project aliases take precedence over global aliases, allowing you to override global settings per-project.

### Alias Scope

Aliases are scoped by entity type, meaning you can use the same alias name for different types:

```bash
# "backend" can refer to both an initiative and a team
linear-create alias add initiative backend init_abc123
linear-create alias add team backend team_xyz789
```

## Icon Usage

### Supported Icons

linear-create supports Linear's standard icon catalog for projects. Icons can be specified by name (e.g., "Checklist", "Tree", "Joystick") and are validated by Linear's API.

**Note on Icon Validation**: This tool does NOT validate icons client-side. Icons are passed directly to Linear's API for server-side validation. This design decision was made after investigation revealed:

1. **No API catalog endpoint**: Linear's GraphQL API does not expose an endpoint to fetch the complete standard icon catalog
2. **Emojis query limitation**: The `emojis` query only returns custom organization emojis (user-uploaded), not Linear's built-in icons
3. **Maintenance burden**: Maintaining a hardcoded list would be incomplete and quickly outdated

### Icon Discovery

```bash
# View curated icon suggestions (for discovery only, not exhaustive)
linear-create icons list

# Search for specific icons
linear-create icons list --search rocket

# View icons by category
linear-create icons list --category status

# Extract icons currently used in your workspace
linear-create icons extract --type projects
```

### Using Icons

```bash
# Icon names are capitalized (Linear's format)
linear-create project create --title "My Project" --team eng --icon "Checklist"
linear-create project create --title "API" --team backend --icon "Joystick"
linear-create project create --title "Design" --team frontend --icon "Tree"

# If an invalid icon is provided, Linear API will return a helpful error
linear-create project create --title "Test" --team eng --icon "InvalidIcon"
# Error: Icon not found (from Linear API)
```

### Icon Resources

- The `linear-create icons list` command shows ~67 curated icons for discovery
- Linear supports hundreds of standard icons beyond this curated list
- Invalid icons will be rejected by Linear's API with clear error messages

## Development

```bash
# Build the project
npm run build

# Run in development mode (watch)
npm run dev

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run typecheck
```

## Project Status

See [MILESTONES.md](./MILESTONES.md) for detailed project milestones and progress.

**Current Version**: v0.1.0 - Project Foundation

## License

MIT
