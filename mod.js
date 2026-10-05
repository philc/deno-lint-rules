// @ts-self-types="./mod.d.ts"

/**
 * Lint rules for `deno lint`, packaged as a Deno lint plugin.
 *
 * Usage, in deno.json:
 *
 * ```json
 * {
 *   "lint": {
 *     "plugins": ["jsr:@philc/lint-rules"]
 *   }
 * }
 * ```
 *
 * All rules are enabled when the plugin is loaded. To disable one, add it to `lint.rules.exclude`,
 * e.g. `"exclude": ["lint-rules/curly"]`.
 *
 * @module
 */

import curly from "./rules/curly.js";

/** The plugin. Rules are reported with the "lint-rules/" prefix, e.g. "lint-rules/curly". */
export default {
  name: "lint-rules",
  rules: {
    curly,
  },
};
