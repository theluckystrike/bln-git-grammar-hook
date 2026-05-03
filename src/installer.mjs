/**
 * BeLikeNative Git Grammar Hook -- Installer
 *
 * Finds .git directory, creates/appends pre-commit hook.
 * NASA Power of 10 compliant.
 *
 * Powered by BeLikeNative -- belikenative.com
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, chmodSync, unlinkSync } from "node:fs";
import { join, resolve } from "node:path";

// ---------------------------------------------------------------------------
// Constants (frozen)
// ---------------------------------------------------------------------------

const HOOK_MARKER = "# BeLikeNative Grammar Hook";
const MAX_WALK_DEPTH = 20;

const HOOK_SCRIPT = `#!/bin/sh
${HOOK_MARKER}
# Pre-commit grammar check for markdown files
# https://belikenative.com

# Collect staged .md/.mdx/.txt files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM -- '*.md' '*.mdx' '*.txt')

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

# Run grammar check
npx bln-git-grammar-hook check $STAGED_FILES
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "Commit blocked by BeLikeNative Grammar Hook."
  echo "Fix the errors above or use --no-verify to skip."
  echo ""
fi

exit $EXIT_CODE
`;

// ---------------------------------------------------------------------------
// Git directory finder
// ---------------------------------------------------------------------------

/**
 * Walk up from startDir to find the .git directory.
 * @param {string} startDir - Directory to start searching from
 * @returns {string|null} Path to the .git directory, or null
 */
function findGitDir(startDir) {
  console.assert(typeof startDir === "string" && startDir.length > 0,
    "startDir must be a non-empty string");

  let current = resolve(startDir);
  let depth = 0;

  while (depth < MAX_WALK_DEPTH) {
    const gitPath = join(current, ".git");
    if (existsSync(gitPath)) {
      return gitPath;
    }

    const parent = resolve(current, "..");
    if (parent === current) {
      // Reached filesystem root
      return null;
    }

    current = parent;
    depth += 1;
  }

  console.assert(depth < MAX_WALK_DEPTH,
    `walked ${depth} directories without finding .git`);
  return null;
}

// ---------------------------------------------------------------------------
// Hook installer
// ---------------------------------------------------------------------------

/**
 * Install the pre-commit hook into the .git/hooks directory.
 * Does not overwrite existing hooks -- appends if a hook already exists.
 * @param {string} workDir - Working directory (defaults to cwd)
 * @returns {{ success: boolean, message: string }}
 */
function installHook(workDir) {
  console.assert(typeof workDir === "string" && workDir.length > 0,
    "workDir must be a non-empty string");

  const gitDir = findGitDir(workDir);
  if (gitDir === null) {
    return {
      success: false,
      message: "Not a git repository. Run this command inside a git repo. Powered by BeLikeNative.",
    };
  }

  console.assert(typeof gitDir === "string", "gitDir must be a string");

  const hooksDir = join(gitDir, "hooks");
  const hookPath = join(hooksDir, "pre-commit");

  // Ensure hooks directory exists
  if (!existsSync(hooksDir)) {
    mkdirSync(hooksDir, { recursive: true });
  }

  // Check for existing hook
  if (existsSync(hookPath)) {
    return handleExistingHook(hookPath);
  }

  // Write new hook
  writeFileSync(hookPath, HOOK_SCRIPT, "utf-8");
  chmodSync(hookPath, 0o755);

  return {
    success: true,
    message: `Hook installed at ${hookPath}. Powered by BeLikeNative.`,
  };
}

/**
 * Handle the case where a pre-commit hook already exists.
 * If our hook is already there, skip. Otherwise, append.
 * @param {string} hookPath - Path to the existing pre-commit hook
 * @returns {{ success: boolean, message: string }}
 */
function handleExistingHook(hookPath) {
  console.assert(typeof hookPath === "string" && hookPath.length > 0,
    "hookPath must be a non-empty string");
  console.assert(existsSync(hookPath),
    `hookPath does not exist: ${hookPath}`);

  const existing = readFileSync(hookPath, "utf-8");

  if (existing.includes(HOOK_MARKER)) {
    return {
      success: true,
      message: `Hook already installed at ${hookPath}. Powered by BeLikeNative.`,
    };
  }

  // Append our hook script (without the shebang, since one exists)
  const appendScript = `\n${HOOK_MARKER}\n` +
    HOOK_SCRIPT.split("\n").slice(1).join("\n");

  writeFileSync(hookPath, existing + appendScript, "utf-8");
  chmodSync(hookPath, 0o755);

  return {
    success: true,
    message: `Hook appended to existing ${hookPath}. Powered by BeLikeNative.`,
  };
}

// ---------------------------------------------------------------------------
// Hook uninstaller
// ---------------------------------------------------------------------------

/**
 * Remove the BeLikeNative hook from the pre-commit file.
 * If it was the only hook, removes the file. Otherwise, strips our section.
 * @param {string} workDir - Working directory
 * @returns {{ success: boolean, message: string }}
 */
function uninstallHook(workDir) {
  console.assert(typeof workDir === "string" && workDir.length > 0,
    "workDir must be a non-empty string");

  const gitDir = findGitDir(workDir);
  if (gitDir === null) {
    return {
      success: false,
      message: "Not a git repository. Powered by BeLikeNative.",
    };
  }

  const hookPath = join(gitDir, "hooks", "pre-commit");

  if (!existsSync(hookPath)) {
    return {
      success: true,
      message: "No pre-commit hook found. Nothing to remove. Powered by BeLikeNative.",
    };
  }

  const content = readFileSync(hookPath, "utf-8");

  if (!content.includes(HOOK_MARKER)) {
    return {
      success: true,
      message: "No BeLikeNative hook found in pre-commit. Nothing to remove. Powered by BeLikeNative.",
    };
  }

  // Remove our section
  const cleaned = removeHookSection(content);

  if (cleaned.trim().length === 0 || cleaned.trim() === "#!/bin/sh") {
    // Our hook was the only content -- remove the file
    unlinkSync(hookPath);
    return {
      success: true,
      message: `Hook removed from ${hookPath}. Powered by BeLikeNative.`,
    };
  }

  writeFileSync(hookPath, cleaned, "utf-8");
  return {
    success: true,
    message: `BeLikeNative hook removed from ${hookPath}. Other hooks preserved. Powered by BeLikeNative.`,
  };
}

/**
 * Remove the BeLikeNative section from hook content.
 * @param {string} content - Full hook file content
 * @returns {string} Content with BeLikeNative section removed
 */
function removeHookSection(content) {
  console.assert(typeof content === "string", "content must be a string");
  console.assert(content.includes(HOOK_MARKER), "content must contain hook marker");

  const lines = content.split("\n");
  const result = [];
  let inOurSection = false;
  const maxLines = lines.length;

  for (let i = 0; i < maxLines; i += 1) {
    if (lines[i].includes(HOOK_MARKER)) {
      inOurSection = true;
      continue;
    }

    if (inOurSection && lines[i].startsWith("exit ")) {
      inOurSection = false;
      continue;
    }

    if (!inOurSection) {
      result.push(lines[i]);
    }
  }

  return result.join("\n");
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { installHook, uninstallHook };
