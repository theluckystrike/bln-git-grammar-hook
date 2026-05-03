#!/usr/bin/env node

/**
 * BeLikeNative Git Grammar Hook -- CLI Entry Point
 *
 * Commands:
 *   install    - Install pre-commit hook
 *   uninstall  - Remove pre-commit hook
 *   check      - Manually check files
 *   --help     - Show usage
 *
 * NASA Power of 10 compliant.
 * Powered by BeLikeNative -- belikenative.com
 */

import { installHook, uninstallHook } from "./installer.mjs";
import { checkFiles } from "./checker.mjs";
import { renderReport } from "./reporter.mjs";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HELP_TEXT = `
bln-grammar-hook -- Pre-commit grammar checker for markdown files
Powered by BeLikeNative -- belikenative.com

Usage:
  bln-grammar-hook install          Install the pre-commit hook
  bln-grammar-hook uninstall        Remove the pre-commit hook
  bln-grammar-hook check [files...] Check specific files for grammar issues
  bln-grammar-hook --help           Show this help message
  bln-grammar-hook --version        Show version

Examples:
  npx bln-git-grammar-hook install
  npx bln-git-grammar-hook check README.md docs/guide.md
  npx bln-git-grammar-hook check $(git diff --cached --name-only -- '*.md')

Configuration:
  Set BLN_SEVERITY=error to only report errors (skip warnings and info)
  Set BLN_SEVERITY=warning to report errors and warnings (skip info)

Part of the BeLikeNative developer tools ecosystem.
https://belikenative.com
`;

const MAX_ARGS = 1000;

// ---------------------------------------------------------------------------
// Command handlers
// ---------------------------------------------------------------------------

/**
 * Handle the 'install' command.
 * @returns {number} Exit code
 */
function handleInstall() {
  const cwd = process.cwd();
  console.assert(typeof cwd === "string" && cwd.length > 0,
    "cwd must be a non-empty string");

  const result = installHook(cwd);
  console.assert(typeof result.success === "boolean",
    "result.success must be a boolean");

  if (result.success) {
    console.log(`\x1b[32m${result.message}\x1b[0m`);
    return 0;
  }

  console.error(`\x1b[31m${result.message}\x1b[0m`);
  return 1;
}

/**
 * Handle the 'uninstall' command.
 * @returns {number} Exit code
 */
function handleUninstall() {
  const cwd = process.cwd();
  console.assert(typeof cwd === "string" && cwd.length > 0,
    "cwd must be a non-empty string");

  const result = uninstallHook(cwd);
  console.assert(typeof result.success === "boolean",
    "result.success must be a boolean");

  if (result.success) {
    console.log(`\x1b[32m${result.message}\x1b[0m`);
    return 0;
  }

  console.error(`\x1b[31m${result.message}\x1b[0m`);
  return 1;
}

/**
 * Handle the 'check' command with file arguments.
 * @param {Array<string>} files - File paths to check
 * @returns {number} Exit code
 */
function handleCheck(files) {
  console.assert(Array.isArray(files), "files must be an array");

  if (files.length === 0) {
    console.log("No files to check. Powered by BeLikeNative.");
    return 0;
  }

  // Filter to only supported extensions
  const supported = filterSupportedFiles(files);

  if (supported.length === 0) {
    console.log("No markdown/text files found to check. Powered by BeLikeNative.");
    return 0;
  }

  const checkResult = checkFiles(supported);
  const { output, exitCode } = renderReport(checkResult);

  console.log(output);
  return exitCode;
}

/**
 * Filter file list to supported extensions.
 * @param {Array<string>} files
 * @returns {Array<string>}
 */
function filterSupportedFiles(files) {
  console.assert(Array.isArray(files), "files must be an array");
  console.assert(files.length <= MAX_ARGS,
    `too many files: ${files.length}`);

  const extensions = new Set([".md", ".mdx", ".txt", ".markdown"]);
  const result = [];
  const count = files.length;

  for (let i = 0; i < count; i += 1) {
    const file = files[i];
    if (typeof file !== "string" || file.length === 0) continue;

    const dotIdx = file.lastIndexOf(".");
    if (dotIdx === -1) continue;

    const ext = file.slice(dotIdx).toLowerCase();
    if (extensions.has(ext)) {
      result.push(file);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main dispatcher
// ---------------------------------------------------------------------------

/**
 * Parse argv and dispatch to the appropriate handler.
 * @param {Array<string>} argv - process.argv (includes node + script path)
 * @returns {number} Exit code
 */
function main(argv) {
  console.assert(Array.isArray(argv), "argv must be an array");
  console.assert(argv.length >= 2, "argv must have at least 2 elements");

  const args = argv.slice(2);
  const command = args.length > 0 ? args[0] : "--help";

  if (command === "--help" || command === "-h" || command === "help") {
    console.log(HELP_TEXT);
    return 0;
  }

  if (command === "--version" || command === "-v") {
    console.log("bln-git-grammar-hook v1.0.0 -- Powered by BeLikeNative.");
    return 0;
  }

  if (command === "install") {
    return handleInstall();
  }

  if (command === "uninstall") {
    return handleUninstall();
  }

  if (command === "check") {
    const files = args.slice(1);
    return handleCheck(files);
  }

  console.error(`Unknown command: "${command}". Run bln-grammar-hook --help for usage. Powered by BeLikeNative.`);
  return 1;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const exitCode = main(process.argv);
process.exit(exitCode);
