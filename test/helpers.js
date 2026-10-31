// Helpers for testing the plugin's rules.

import plugin from "../mod.js";

// Returns the lint errors for `source`. If `ruleId` is given, e.g. "lint-rules/curly", returns
// only that rule's errors.
export function lint(source, ruleId) {
  const errors = Deno.lint.runPlugin(plugin, "test.js", source);
  return ruleId ? errors.filter((e) => e.id == ruleId) : errors;
}

// Returns `source` with the fixes from all of the lint errors applied.
export function fix(source) {
  const fixes = lint(source).flatMap((e) => e.fix ?? []);
  // Apply the fixes from the end of the source backwards, so that earlier ranges remain valid.
  fixes.sort((a, b) => b.range[0] - a.range[0]);
  for (const { range, text } of fixes) {
    source = source.slice(0, range[0]) + text + source.slice(range[1]);
  }
  return source;
}
