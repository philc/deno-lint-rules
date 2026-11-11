/**
 * A Deno lint plugin. Rules are reported with the "lint-rules/" prefix, e.g. "lint-rules/curly".
 */
declare const plugin: Deno.lint.Plugin;
// Deno requires a lint plugin's module to export the plugin as its default export.
// deno-lint-ignore lint-rules/no-default-export
export default plugin;
