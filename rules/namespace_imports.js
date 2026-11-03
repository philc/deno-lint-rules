// Requires namespace imports rather than named imports, so that call sites show which module a name
// comes from:
//
//   import { PutObjectCommand } from "@aws-sdk/client-s3";   // Not allowed.
//   import * as s3 from "@aws-sdk/client-s3";                // Allowed.
//
// Default imports and side-effect imports are allowed.
//
// Named imports from a package are allowed when the namespaced form would stutter, i.e. when each
// imported name contains the module's name, or vice versa:
//
//   import { parseArgs } from "@std/cli/parse-args";   // Allowed; not parseArgs.parseArgs.
//   import { assertEquals } from "@std/assert";        // Allowed; not assert.assertEquals.
//
// This exception doesn't apply to the project's own modules (relative, absolute, and file: paths).
// There, a stuttering name is better fixed by renaming the export: `cut.plan`, not `cut.planCuts`,
// and `fileTree.Tree`, not `fileTree.FileTree`.
// Paths with a vendor/ or node_modules/ segment are treated as packages, since their names can't
// be changed.
//
// In test files, named imports from packages are always allowed, so tests can use a harness's
// helpers bare: `import { assert, context, should } from "@philc/shoulda"`.

// Returns whether the specifier refers to the project's own code, rather than to a package.
function isOwnCode(specifier) {
  const isPath = /^(\.{1,2}\/|\/|file:)/.test(specifier);
  return isPath && !/(^|\/)(vendor|node_modules)\//.test(specifier);
}

// Returns whether the file is a test: one named like foo_test.js or foo.test.js, or one in a test/
// or tests/ directory.
function isTestFile(filename) {
  return /[._]test\.[cm]?[jt]sx?$/.test(filename) || /(^|\/)tests?\//.test(filename);
}

// File names which carry no meaning of their own, so the directory names the module instead.
const genericNames = new Set(["mod", "index", "main"]);

// Returns the module's name, derived from its specifier. E.g. "parse-args" for
// "jsr:@std/cli@^1/parse-args", and "path" for "https://deno.land/std/path/mod.ts".
function moduleName(specifier) {
  const path = specifier
    .replace(/^[a-z]+:(\/\/[^/]+)?/, "") // Scheme (npm:, node:) and URL host.
    .replace(/[?#].*$/, "");
  const segments = path.split("/")
    .map((s) => s.replace(/@[^@]*$/, "").replace(/\.[cm]?[jt]sx?$/, ""))
    .filter((s) => s != "");
  let name = segments.at(-1) ?? "";
  if (genericNames.has(name) && segments.length > 1) {
    name = segments.at(-2);
  }
  return name;
}

const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function stutters(importedName, moduleName) {
  const a = normalize(importedName);
  const b = normalize(moduleName);
  return a != "" && b != "" && (a.includes(b) || b.includes(a));
}

export default {
  create(context) {
    return {
      ImportDeclaration(node) {
        const named = node.specifiers.filter((s) => s.type == "ImportSpecifier");
        if (named.length == 0) {
          return;
        }
        const specifier = node.source.value;
        if (!isOwnCode(specifier)) {
          if (isTestFile(context.filename)) {
            return;
          }
          const name = moduleName(specifier);
          const names = named.map((s) => s.imported.name ?? s.imported.value);
          if (names.every((n) => stutters(n, name))) {
            return;
          }
        }
        context.report({
          node,
          message: `Use a namespace import for "${specifier}", e.g. \`import * as name from ...\`.`,
          hint: isOwnCode(specifier)
            ? "If a name would stutter with the module's prefix, rename the export, e.g. " +
              "`fileTree.Tree`, not `fileTree.FileTree`."
            : "Named imports are allowed when every name contains the module's name.",
        });
      },
    };
  },
};
