import { createIssueAttachment } from '../../lib/linear-client.js';
import { resolveIssueIdentifier } from '../../lib/issue-resolver.js';
import { openInBrowser } from '../../lib/browser.js';
import { handleLinearError, isLinearError } from '../../lib/error-handler.js';

interface AttachOptions {
  title?: string;
  subtitle?: string;
  icon?: string;
  web?: boolean;
  quiet?: boolean;
}

/**
 * Attach an external link to an issue
 */
export async function attachToIssue(
  identifier: string,
  url: string,
  options: AttachOptions = {}
) {
  try {
    // Validate URL
    if (!url || url.trim() === '') {
      console.error('❌ Error: URL is required');
      console.error('\nUsage:');
      console.error('  $ a2l issue attach ENG-123 "https://github.com/..." --title "GitHub PR"');
      process.exit(1);
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      console.error(`❌ Error: Invalid URL: ${url}`);
      process.exit(1);
    }

    // Generate title from URL if not provided
    const title = options.title || generateTitleFromUrl(url);

    // Resolve identifier to UUID
    const resolveResult = await resolveIssueIdentifier(identifier);

    if (!resolveResult) {
      console.error(`\n❌ Issue not found: ${identifier}`);
      console.error('\nPlease check:');
      console.error('  - The identifier is correct (e.g., ENG-123 or UUID)');
      console.error('  - You have access to the issue');
      console.error("  - The issue hasn't been deleted\n");
      process.exit(1);
    }

    const { issueId, resolvedBy, originalInput } = resolveResult;

    // Show resolution message if identifier was used
    if (!options.quiet && resolvedBy === 'identifier' && originalInput !== issueId) {
      console.log(`\n📎 Resolved "${originalInput}" to issue ${issueId.substring(0, 8)}...`);
    }

    if (!options.quiet) {
      console.log(`🔗 Attaching link to ${identifier}...`);
    }

    const attachment = await createIssueAttachment(
      issueId,
      url,
      title,
      options.subtitle,
      options.icon
    );

    if (!options.quiet) {
      console.log(`\n✅ Link attached successfully!`);
      console.log(`   Title: ${attachment.title}`);
      console.log(`   URL: ${attachment.url}`);
    }

    // Handle --web flag
    if (options.web) {
      const { getFullIssueById } = await import('../../lib/linear-client.js');
      const issue = await getFullIssueById(issueId);
      if (issue?.url) {
        console.log(`\n🌐 Opening issue in browser...`);
        await openInBrowser(issue.url);
      }
    }
  } catch (error) {
    if (isLinearError(error)) {
      console.error(`\n${handleLinearError(error, 'attachment')}\n`);
    } else {
      console.error(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }
    process.exit(1);
  }
}

/**
 * Generate a readable title from URL
 */
function generateTitleFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace('www.', '');

    // Special handling for common services
    if (hostname.includes('github.com')) {
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      if (pathParts.length >= 4 && pathParts[2] === 'pull') {
        return `GitHub PR #${pathParts[3]}`;
      }
      if (pathParts.length >= 4 && pathParts[2] === 'issues') {
        return `GitHub Issue #${pathParts[3]}`;
      }
      if (pathParts.length >= 2) {
        return `GitHub: ${pathParts[0]}/${pathParts[1]}`;
      }
    }

    if (hostname.includes('figma.com')) {
      return 'Figma Design';
    }

    if (hostname.includes('notion.')) {
      return 'Notion Document';
    }

    if (hostname.includes('docs.google.com')) {
      return 'Google Doc';
    }

    if (hostname.includes('slack.com')) {
      return 'Slack Message';
    }

    // Default: use hostname
    return hostname;
  } catch {
    return 'External Link';
  }
}
