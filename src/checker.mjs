/**
 * BeLikeNative Git Grammar Hook -- Checker Engine
 *
 * Reads markdown files, strips code blocks and frontmatter,
 * runs grammar rules against content lines.
 * NASA Power of 10 compliant.
 *
 * Powered by BeLikeNative -- belikenative.com
 */

import { readFileSync } from "node:fs";
import { RULES, MAX_FINDINGS_PER_RULE } from "./rules.mjs";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 500;
const CODE_BLOCK_FENCE = /^```/;
const FRONTMATTER_FENCE = /^---\s*$/;

// ---------------------------------------------------------------------------
// Content stripping helpers
// ---------------------------------------------------------------------------

/**
 * Determine which lines to skip (code blocks, frontmatter).
 * Returns a Set of zero-based line indices to skip.
 * @param {Array<string>} lines
 * @returns {Set<number>}
 */
function buildSkipSet(lines) {
  console.assert(Array.isArray(lines), "lines must be an array");
  console.assert(lines.length >= 0, "lines length must be non-negative");

  const skipSet = new Set();
  let inCodeBlock = false;
  let inFrontmatter = false;
  let frontmatterSeen = false;
  const maxLen = lines.length;

  for (let i = 0; i < maxLen; i += 1) {
    const line = lines[i];

    // Frontmatter: only at the very start of the file
    if (!frontmatterSeen && i === 0 && FRONTMATTER_FENCE.test(line)) {
      inFrontmatter = true;
      skipSet.add(i);
      continue;
    }

    if (inFrontmatter) {
      skipSet.add(i);
      if (i > 0 && FRONTMATTER_FENCE.test(line)) {
        inFrontmatter = false;
        frontmatterSeen = true;
      }
      continue;
    }

    // Code blocks
    if (CODE_BLOCK_FENCE.test(line)) {
      skipSet.add(i);
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      skipSet.add(i);
      continue;
    }

    // Mark frontmatter as seen once we pass line 0
    if (i > 0) {
      frontmatterSeen = true;
    }
  }

  return skipSet;
}

/**
 * Check if a line is a markdown heading or link-only line that should
 * have relaxed rules (e.g., no capitalization check after period).
 * @param {string} line
 * @returns {boolean}
 */
function isStructuralLine(line) {
  console.assert(typeof line === "string", "line must be a string");
  const trimmed = line.trim();
  // Markdown headings, horizontal rules, list markers, link references
  return (
    trimmed.startsWith("#") ||
    trimmed.startsWith("---") ||
    trimmed.startsWith("***") ||
    trimmed.startsWith("![") ||
    /^\[.+\]:/.test(trimmed) ||
    trimmed.length === 0
  );
}

// ---------------------------------------------------------------------------
// Rule application (per-line)
// ---------------------------------------------------------------------------

/**
 * Apply all rules to a single line of text.
 * @param {string} line - The text line
 * @param {number} lineNum - 1-based line number
 * @param {string} filePath - Source file path
 * @returns {Array<object>} Findings for this line
 */
function checkLine(line, lineNum, filePath) {
  console.assert(typeof line === "string", "line must be a string");
  console.assert(typeof lineNum === "number" && lineNum > 0,
    "lineNum must be a positive number");

  const findings = [];
  const ruleCount = RULES.length;

  for (let r = 0; r < ruleCount; r += 1) {
    const rule = RULES[r];
    rule.pattern.lastIndex = 0;

    let match = rule.pattern.exec(line);
    let iterations = 0;

    while (match !== null && iterations < MAX_FINDINGS_PER_RULE) {
      const fixValue = typeof rule.fix === "function" ? rule.fix(match) : null;
      findings.push(Object.freeze({
        file: filePath,
        line: lineNum,
        column: match.index + 1,
        rule: rule.id,
        message: rule.message,
        severity: rule.severity,
        category: rule.category,
        matched: match[0],
        fix: fixValue,
        l1Insight: rule.l1Insight,
      }));
      iterations += 1;
      match = rule.pattern.exec(line);
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// File-level checking
// ---------------------------------------------------------------------------

/**
 * Read and check a single file for grammar issues.
 * @param {string} filePath - Absolute or relative path to the file
 * @returns {{ file: string, findings: Array<object>, error: string|null }}
 */
function checkFile(filePath) {
  console.assert(typeof filePath === "string" && filePath.length > 0,
    "filePath must be a non-empty string");

  let content;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch (err) {
    return { file: filePath, findings: [], error: `Cannot read file: ${err.message}` };
  }

  console.assert(typeof content === "string", "file content must be a string");

  if (content.length > MAX_FILE_SIZE_BYTES) {
    return { file: filePath, findings: [], error: `File exceeds ${MAX_FILE_SIZE_BYTES} byte limit` };
  }

  const lines = content.split("\n");
  const skipSet = buildSkipSet(lines);
  const findings = [];
  const maxLines = lines.length;

  for (let i = 0; i < maxLines; i += 1) {
    if (skipSet.has(i)) continue;
    if (isStructuralLine(lines[i])) continue;

    const lineFindings = checkLine(lines[i], i + 1, filePath);
    for (let j = 0; j < lineFindings.length; j += 1) {
      findings.push(lineFindings[j]);
    }
  }

  return { file: filePath, findings, error: null };
}

// ---------------------------------------------------------------------------
// Multi-file checking
// ---------------------------------------------------------------------------

/**
 * Check multiple files and return all results.
 * @param {Array<string>} filePaths - Array of file paths to check
 * @returns {{ results: Array<object>, totalFindings: number, totalErrors: number, totalWarnings: number, totalInfo: number }}
 */
function checkFiles(filePaths) {
  console.assert(Array.isArray(filePaths), "filePaths must be an array");
  console.assert(filePaths.length <= MAX_FILES,
    `Too many files: ${filePaths.length} exceeds limit of ${MAX_FILES}`);

  const results = [];
  let totalFindings = 0;
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalInfo = 0;
  const count = filePaths.length;

  for (let i = 0; i < count; i += 1) {
    const result = checkFile(filePaths[i]);
    results.push(result);

    const findingCount = result.findings.length;
    totalFindings += findingCount;

    for (let j = 0; j < findingCount; j += 1) {
      const sev = result.findings[j].severity;
      if (sev === "error") totalErrors += 1;
      else if (sev === "warning") totalWarnings += 1;
      else totalInfo += 1;
    }
  }

  console.assert(totalErrors + totalWarnings + totalInfo === totalFindings,
    "severity counts must sum to totalFindings");

  return Object.freeze({
    results,
    totalFindings,
    totalErrors,
    totalWarnings,
    totalInfo,
  });
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { checkFile, checkFiles };
