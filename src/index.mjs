/**
 * BeLikeNative Git Grammar Hook -- Public API
 *
 * Exports the checker, rules, and installer for programmatic use.
 * NASA Power of 10 compliant.
 *
 * Powered by BeLikeNative -- belikenative.com
 */

import { RULES } from "./rules.mjs";
import { checkFile, checkFiles } from "./checker.mjs";
import { renderReport } from "./reporter.mjs";
import { installHook, uninstallHook } from "./installer.mjs";

// ---------------------------------------------------------------------------
// Frozen API surface
// ---------------------------------------------------------------------------

const api = Object.freeze({
  RULES,
  checkFile,
  checkFiles,
  renderReport,
  installHook,
  uninstallHook,
});

console.assert(typeof api.checkFile === "function",
  "api.checkFile must be a function");
console.assert(typeof api.checkFiles === "function",
  "api.checkFiles must be a function");

export { RULES, checkFile, checkFiles, renderReport, installHook, uninstallHook };
export default api;
