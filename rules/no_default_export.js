// Disallows default exports, so that every export has a name, and is used under a namespace import
// by that name (see namespace-imports):
//
//   export default function plan() {}   // Not allowed.
//   export function plan() {}           // Allowed; used as `cut.plan()`.
//
// `export { plan as default }` is also reported. Some APIs require a default export, like a Deno
// lint plugin's module, or a framework's config file. For those, use
// `// deno-lint-ignore lint-rules/no-default-export`.

function report(context, node) {
  context.report({
    node,
    message: "Use a named export rather than a default export.",
    hint: "Name it to read well with the module's namespace, e.g. `export function plan` in " +
      "cut.js, used as `cut.plan()`.",
  });
}

export const rule = {
  create(context) {
    return {
      ExportDefaultDeclaration(node) {
        report(context, node);
      },
      ExportNamedDeclaration(node) {
        for (const specifier of node.specifiers) {
          const exported = specifier.exported.name ?? specifier.exported.value;
          if (exported == "default") {
            report(context, specifier);
          }
        }
      },
    };
  },
};
