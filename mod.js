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

import * as curly from "./rules/curly.js";
import * as namespaceImports from "./rules/namespace_imports.js";
import * as noDefaultExport from "./rules/no_default_export.js";
import * as noStutteringExports from "./rules/no_stuttering_exports.js";

/** The plugin. Rules are reported with the "lint-rules/" prefix, e.g. "lint-rules/curly". */
// Deno requires a lint plugin's module to export the plugin as its default export.
// deno-lint-ignore lint-rules/no-default-export
export default {
  name: "lint-rules",
  rules: {
    curly: curly.rule,
    "namespace-imports": namespaceImports.rule,
    "no-default-export": noDefaultExport.rule,
    "no-stuttering-exports": noStutteringExports.rule,
  },
};
