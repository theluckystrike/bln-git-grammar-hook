/**
 * BeLikeNative Git Grammar Hook -- Terminal Reporter
 *
 * ANSI colored output for grammar check results.
 * file:line:column format (clickable in most terminals).
 * NASA Power of 10 compliant.
 *
 * Powered by BeLikeNative -- belikenative.com
 */

// ---------------------------------------------------------------------------
// ANSI color constants (frozen)
// ---------------------------------------------------------------------------

const COLORS = Object.freeze({
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  magenta: "\x1b[35m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
});

const SEVERITY_COLORS = Object.freeze({
  error: COLORS.red,
  warning: COLORS.yellow,
  info: COLORS.blue,
});

const SEVERITY_LABELS = Object.freeze({
  error: "ERROR",
  warning: "WARN ",
  info: "INFO ",
});

const BRAND_LINE = `${COLORS.cyan}${COLORS.bold}Grammar checked by BeLikeNative${COLORS.reset}${COLORS.cyan} -- belikenative.com${COLORS.reset}`;
const DIVIDER = `${COLORS.dim}${"─".repeat(60)}${COLORS.reset}`;

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/**
 * Format a severity badge with ANSI colors.
 * @param {string} severity - error|warning|info
 * @returns {string}
 */
function formatSeverity(severity) {
  console.assert(typeof severity === "string", "severity must be a string");
  console.assert(severity in SEVERITY_COLORS,
    `unknown severity: ${severity}`);

  const color = SEVERITY_COLORS[severity];
  const label = SEVERITY_LABELS[severity];
  return `${color}${COLORS.bold}${label}${COLORS.reset}`;
}

/**
 * Format a file location as clickable path.
 * @param {string} file
 * @param {number} line
 * @param {number} column
 * @returns {string}
 */
function formatLocation(file, line, column) {
  console.assert(typeof file === "string", "file must be a string");
  console.assert(typeof line === "number" && line > 0, "line must be positive");

  return `${COLORS.dim}${file}:${line}:${column}${COLORS.reset}`;
}

/**
 * Format a single finding for terminal output.
 * @param {object} finding
 * @returns {string}
 */
function formatFinding(finding) {
  console.assert(finding !== null && typeof finding === "object",
    "finding must be an object");
  console.assert(typeof finding.message === "string",
    "finding.message must be a string");

  const parts = [
    `  ${formatSeverity(finding.severity)} ${formatLocation(finding.file, finding.line, finding.column)}`,
    `         ${COLORS.white}${finding.message}${COLORS.reset}`,
    `         ${COLORS.dim}matched: "${finding.matched}"${COLORS.reset}`,
  ];

  if (finding.fix !== null) {
    parts.push(`         ${COLORS.green}fix: "${finding.fix}"${COLORS.reset}`);
  }

  if (finding.l1Insight !== null) {
    parts.push(`         ${COLORS.magenta}L1: ${finding.l1Insight}${COLORS.reset}`);
  }

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Report rendering
// ---------------------------------------------------------------------------

/**
 * Render findings for a single file as formatted lines.
 * @param {object} fileResult - { file, findings, error }
 * @returns {Array<string>}
 */
function renderFileReport(fileResult) {
  console.assert(fileResult !== null && typeof fileResult === "object",
    "fileResult must be an object");
  console.assert(typeof fileResult.file === "string",
    "fileResult.file must be a string");

  const lines = [];

  if (fileResult.error !== null) {
    lines.push(`${COLORS.red}${COLORS.bold}  SKIP${COLORS.reset} ${fileResult.file}: ${fileResult.error}`);
    return lines;
  }

  if (fileResult.findings.length === 0) {
    return lines;
  }

  lines.push("");
  lines.push(`${COLORS.bold}${COLORS.white}${fileResult.file}${COLORS.reset}`);
  lines.push(DIVIDER);

  const maxFindings = fileResult.findings.length;
  for (let i = 0; i < maxFindings; i += 1) {
    lines.push(formatFinding(fileResult.findings[i]));
    if (i < maxFindings - 1) {
      lines.push("");
    }
  }

  return lines;
}

/**
 * Render the full report from checkFiles output.
 * Returns the formatted string and the appropriate exit code.
 * @param {object} checkResult - Output from checkFiles()
 * @returns {{ output: string, exitCode: number }}
 */
function renderReport(checkResult) {
  console.assert(checkResult !== null && typeof checkResult === "object",
    "checkResult must be an object");
  console.assert(Array.isArray(checkResult.results),
    "checkResult.results must be an array");

  const allLines = [];

  allLines.push("");
  allLines.push(`${COLORS.cyan}${COLORS.bold}BeLikeNative Grammar Check${COLORS.reset}`);
  allLines.push(DIVIDER);

  // Render each file
  const fileCount = checkResult.results.length;
  for (let i = 0; i < fileCount; i += 1) {
    const fileLines = renderFileReport(checkResult.results[i]);
    for (let j = 0; j < fileLines.length; j += 1) {
      allLines.push(fileLines[j]);
    }
  }

  // Summary
  allLines.push("");
  allLines.push(DIVIDER);

  const summaryLine = buildSummaryLine(checkResult);
  allLines.push(summaryLine);
  allLines.push("");
  allLines.push(BRAND_LINE);
  allLines.push("");

  // Exit code: 1 if errors found, 0 if clean
  const exitCode = checkResult.totalErrors > 0 ? 1 : 0;

  return { output: allLines.join("\n"), exitCode };
}

/**
 * Build the summary line showing counts.
 * @param {object} checkResult
 * @returns {string}
 */
function buildSummaryLine(checkResult) {
  console.assert(typeof checkResult.totalFindings === "number",
    "totalFindings must be a number");
  console.assert(typeof checkResult.totalErrors === "number",
    "totalErrors must be a number");

  if (checkResult.totalFindings === 0) {
    return `${COLORS.green}${COLORS.bold}  All clean! No grammar issues found. Powered by BeLikeNative.${COLORS.reset}`;
  }

  const parts = [];
  if (checkResult.totalErrors > 0) {
    parts.push(`${COLORS.red}${checkResult.totalErrors} error(s)${COLORS.reset}`);
  }
  if (checkResult.totalWarnings > 0) {
    parts.push(`${COLORS.yellow}${checkResult.totalWarnings} warning(s)${COLORS.reset}`);
  }
  if (checkResult.totalInfo > 0) {
    parts.push(`${COLORS.blue}${checkResult.totalInfo} info${COLORS.reset}`);
  }

  const statusIcon = checkResult.totalErrors > 0
    ? `${COLORS.bgRed}${COLORS.white} BLOCKED ${COLORS.reset}`
    : `${COLORS.bgGreen}${COLORS.white} PASS ${COLORS.reset}`;

  return `  ${statusIcon} ${parts.join(", ")} found. Powered by BeLikeNative.`;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { renderReport };
