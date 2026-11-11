# lint-rules

Rules for `deno lint`, packaged as a
[Deno lint plugin](https://docs.deno.com/runtime/reference/lint_plugins/).

## Usage

Add the plugin to your project's `deno.json`:

```json
{
  "lint": {
    "plugins": ["jsr:@philc/lint-rules"]
  }
}
```

Then run `deno lint`. To apply the rules' automatic fixes, run `deno lint --fix`.

All rules are enabled when the plugin is loaded. To disable a rule for a project, exclude it:

```json
{
  "lint": {
    "plugins": ["jsr:@philc/lint-rules"],
    "rules": {
      "exclude": ["lint-rules/curly"]
    }
  }
}
```

To disable a rule for a single line, add a comment above it: `// deno-lint-ignore lint-rules/curly`.

## Rules

### lint-rules/curly

Requires braces around the bodies of `if`, `else`, `for`, `while`, and `do` statements, with the
body on its own line.

```js
// Not allowed:
if (done) return;

// Allowed:
if (done) {
  return;
}
```

`else if` is allowed. The rule is fixable: `deno lint --fix` adds the braces.

### lint-rules/namespace-imports

Requires namespace imports rather than named imports, so that call sites show which module a name
comes from.

Why: `s3.PutObjectCommand` and `cut.plan()` can be read without scrolling up to the imports, and
names from different modules can't collide. Modules can also use short names that read well with
their prefix, the way Go's `http.Client` and Node's `stream.Readable` do. Editor auto-import and
LLM-written code default to named imports, so without a lint rule, a codebase drifts away from this
style.

```js
// Not allowed:
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { planCuts } from "./lib/cut.js";

// Allowed:
import * as s3 from "@aws-sdk/client-s3";
import * as cut from "./lib/cut.js";
```

Default imports and side-effect imports (`import "./polyfill.js"`) are allowed.

Named imports from a package are allowed when the namespaced form would stutter, i.e. when every
imported name contains the module's name, or vice versa. The module's name is the last segment of
the specifier, without its version or file extension (or the directory's name, for `mod.ts` and
`index.js`).

```js
import { parseArgs } from "@std/cli/parse-args"; // Allowed; not parseArgs.parseArgs.
import { assertEquals } from "@std/assert"; // Allowed; not assert.assertEquals.
```

This exception doesn't apply to the project's own modules: relative, absolute, and `file:` paths.
There, a name which would stutter is better fixed by renaming the export: `cut.plan`, not
`cut.planCuts`, and `new fileTree.Tree()`, not `new fileTree.FileTree()`. Paths containing a
`vendor/` or `node_modules/` directory are treated as packages, since their export names can't be
changed.

In test files, named imports from packages are always allowed, so that tests can call a test
harness's helpers without a prefix. A test file is one named like `cut_test.js` or `cut.test.js`, or
one in a `test/` or `tests/` directory. Imports of the project's own modules still need to be
namespace imports.

```js
import { assert, context, should } from "@philc/shoulda"; // Allowed in cut_test.js.
```

Packages are recognized by the form of the specifier, since lint plugins can't see the import map. A
bare specifier which the import map points at local code, like `@/cut.js`, is treated as a package.

The rule isn't fixable, because choosing a namespace name and rewriting the call sites needs
judgment. For deliberate exceptions, use `// deno-lint-ignore lint-rules/namespace-imports`.

### lint-rules/no-stuttering-exports

Disallows exports whose names repeat their module's name. Modules are imported under a namespace
named for the module (see `namespace-imports`), so the repetition stutters at every call site.

```js
// In cut.js:
export function planCuts() {} // Not allowed; used as cut.planCuts().
export function plan() {} // Allowed; used as cut.plan().

// In file_tree.js:
export class FileTree {} // Not allowed; used as new fileTree.FileTree().
export class Tree {} // Allowed; used as new fileTree.Tree().
```

Names are compared word by word, so `start` in `art.js` is allowed, and a plural matches its
singular, so `planCuts` in `cut.js` is reported. The module's name is the file's name without its
extension, or the directory's name, for files named `mod`, `index`, or `main`.

When the module's name is one word, an export named just that word is allowed, like `Workbook` in
`workbook.js`, since there's no shorter name for the module's main thing. Go does the same:
`list.List`, `template.Template`.

Test files are skipped. The rule isn't fixable, since renaming an export means updating its callers.

### lint-rules/no-default-export

Disallows default exports, so that every export has a name, and is used by that name under a
namespace import.

```js
export default function plan() {} // Not allowed.
export function plan() {} // Allowed; used as cut.plan().
```

`export { plan as default }` is also reported. Some APIs require a default export, like a Deno lint
plugin's module, or a framework's config file. For those, use
`// deno-lint-ignore
lint-rules/no-default-export`.

## Development

Run the tests with `deno test`. This project lints itself with its own rules, so `deno lint` also
exercises the plugin.

To publish a new version to [JSR](https://jsr.io/@philc/lint-rules), bump `version` in `deno.json`,
then run `deno publish`.

## License

Licensed under the [MIT license](./LICENSE).
