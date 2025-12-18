import { createIssueComment } from '../../lib/linear-client.js';
import { resolveIssueIdentifier } from '../../lib/issue-resolver.js';
import { openInBrowser } from '../../lib/browser.js';
import { handleLinearError, isLinearError } from '../../lib/error-handler.js';
import { readFileSync } from 'fs';

interface CommentOptions {
  web?: boolean;
  bodyFile?: string;
  quiet?: boolean;
}

/**
 * Add a comment to an issue
 */
export async function commentIssue(
  identifier: string,
  body: string | undefined,
  options: CommentOptions = {}
) {
  try {
    // Handle --body-file option
    let commentBody = body;
    if (options.bodyFile) {
      if (body) {
        console.error('❌ Error: Cannot use both body argument and --body-file');
        console.error('   Use either inline body or --body-file, not both');
        process.exit(1);
      }
      try {
        commentBody = readFileSync(options.bodyFile, 'utf-8');
      } catch (err) {
        console.error(`❌ Error: Could not read file: ${options.bodyFile}`);
        console.error(`   ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    }

    if (!commentBody || commentBody.trim() === '') {
      console.error('❌ Error: Comment body is required');
      console.error('\nUsage:');
      console.error('  $ a2l issue comment ENG-123 "Your comment here"');
      console.error('  $ a2l issue comment ENG-123 --body-file notes.md');
      process.exit(1);
    }

    // Resolve identifier to UUID (handles both ENG-123 and UUID formats)
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
      console.log(`💬 Adding comment to ${identifier}...`);
    }

    const comment = await createIssueComment(issueId, commentBody);

    if (!options.quiet) {
      console.log(`\n✅ Comment added successfully!`);
      console.log(`   Comment ID: ${comment.id.substring(0, 8)}...`);
      console.log(`   Created: ${new Date(comment.createdAt).toLocaleString()}`);
    }

    // Handle --web flag - open the issue in browser
    if (options.web) {
      // We need to get the issue URL - use a simple approach
      const { getFullIssueById } = await import('../../lib/linear-client.js');
      const issue = await getFullIssueById(issueId);
      if (issue?.url) {
        console.log(`\n🌐 Opening issue in browser...`);
        await openInBrowser(issue.url);
      }
    }
  } catch (error) {
    if (isLinearError(error)) {
      console.error(`\n${handleLinearError(error, 'comment')}\n`);
    } else {
      console.error(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }
    process.exit(1);
  }
}
