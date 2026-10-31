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

Packages are recognized by the form of the specifier, since lint plugins can't see the import map. A
bare specifier which the import map points at local code, like `@/cut.js`, is treated as a package.

The rule isn't fixable, because choosing a namespace name and rewriting the call sites needs
judgment. For deliberate exceptions, such as a test harness's `assert` and `should`, use
`// deno-lint-ignore lint-rules/namespace-imports`.

## Development

Run the tests with `deno test`. This project lints itself with its own rules, so `deno lint` also
exercises the plugin.

To publish a new version to [JSR](https://jsr.io/@philc/lint-rules), bump `version` in `deno.json`,
then run `deno publish`.

## License

Licensed under the [MIT license](./LICENSE).
