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

## Development

Run the tests with `deno test`. This project lints itself with its own rules, so `deno lint` also
exercises the plugin.

To publish a new version to [JSR](https://jsr.io/@philc/lint-rules), bump `version` in `deno.json`,
then run `deno publish`.

## License

Licensed under the [MIT license](./LICENSE).
