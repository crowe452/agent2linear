/**
 * Shared file utilities for agent2linear CLI
 *
 * These utilities provide safe file operations with comprehensive error handling.
 */

import { readFileSync } from 'fs';

/**
 * File read result type
 */
export interface FileReadResult {
  success: boolean;
  content?: string;
  error?: string;
}

/**
 * Read content from a file with comprehensive error handling
 *
 * Safely reads file contents and provides user-friendly error messages
 * for common failure scenarios (file not found, permission denied, etc.).
 *
 * @param filePath - Absolute or relative path to file
 * @returns Result object with success flag, content, or error message
 *
 * @example
 * ```typescript
 * const result = await readContentFile('./README.md');
 * if (result.success) {
 *   console.log(result.content);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function readContentFile(filePath: string): Promise<FileReadResult> {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return {
      success: true,
      content
    };
  } catch (error) {
    // Handle specific error cases
    if (error instanceof Error) {
      const nodeError = error as NodeJS.ErrnoException;

      if (nodeError.code === 'ENOENT') {
        return {
          success: false,
          error: `File not found: ${filePath}\n` +
                 'Please check the path and try again.'
        };
      }

      if (nodeError.code === 'EACCES') {
        return {
          success: false,
          error: `Permission denied: ${filePath}\n` +
                 'Please check file permissions and try again.'
        };
      }

      if (nodeError.code === 'EISDIR') {
        return {
          success: false,
          error: `Path is a directory: ${filePath}\n` +
                 'Please provide a file path, not a directory.'
        };
      }

      // Generic error with original message
      return {
        success: false,
        error: `Error reading file: ${filePath}\n${nodeError.message}`
      };
    }

    // Unknown error type
    return {
      success: false,
      error: `Unknown error reading file: ${filePath}`
    };
  }
}

/**
 * Synchronous version of readContentFile for compatibility
 *
 * Use this when async/await is not available or when synchronous
 * operation is preferred.
 *
 * @param filePath - Absolute or relative path to file
 * @returns Result object with success flag, content, or error message
 *
 * @example
 * ```typescript
 * const result = readContentFileSync('./package.json');
 * if (result.success) {
 *   const pkg = JSON.parse(result.content!);
 * }
 * ```
 */
export function readContentFileSync(filePath: string): FileReadResult {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return {
      success: true,
      content
    };
  } catch (error) {
    if (error instanceof Error) {
      const nodeError = error as NodeJS.ErrnoException;

      if (nodeError.code === 'ENOENT') {
        return {
          success: false,
          error: `File not found: ${filePath}\n` +
                 'Please check the path and try again.'
        };
      }

      if (nodeError.code === 'EACCES') {
        return {
          success: false,
          error: `Permission denied: ${filePath}\n` +
                 'Please check file permissions and try again.'
        };
      }

      if (nodeError.code === 'EISDIR') {
        return {
          success: false,
          error: `Path is a directory: ${filePath}\n` +
                 'Please provide a file path, not a directory.'
        };
      }

      return {
        success: false,
        error: `Error reading file: ${filePath}\n${nodeError.message}`
      };
    }

    return {
      success: false,
      error: `Unknown error reading file: ${filePath}`
    };
  }
}
