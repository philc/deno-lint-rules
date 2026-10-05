import { assertEquals } from "@std/assert";
import plugin from "../mod.js";

function lint(source) {
  return Deno.lint.runPlugin(plugin, "test.js", source);
}

// Returns `source` with the fixes from all of the lint errors applied.
function fix(source) {
  const fixes = lint(source).flatMap((d) => d.fix ?? []);
  // Apply the fixes from the end of the source backwards, so that earlier ranges remain valid.
  fixes.sort((a, b) => b.range[0] - a.range[0]);
  for (const { range, text } of fixes) {
    source = source.slice(0, range[0]) + text + source.slice(range[1]);
  }
  return source;
}

Deno.test("curly: allow bodies in braces", () => {
  assertEquals(lint("if (a) {\n  b();\n}\n").length, 0);
  assertEquals(lint("for (;;) {\n  b();\n}\n").length, 0);
  assertEquals(lint("do {\n  b();\n} while (a);\n").length, 0);
});

Deno.test("curly: allow else if", () => {
  assertEquals(lint("if (a) {\n  b();\n} else if (c) {\n  d();\n}\n").length, 0);
});

Deno.test("curly: report bodies without braces", () => {
  const errors = lint("if (a) b();\n");
  assertEquals(errors.length, 1);
  assertEquals(errors[0].id, "lint-rules/curly");
});

Deno.test("curly: report every kind of control statement", () => {
  const source = [
    "if (a) b();",
    "if (a) {\n  b();\n} else c();",
    "for (;;) b();",
    "for (const x in o) b();",
    "for (const x of o) b();",
    "while (a) b();",
    "do b(); while (a);",
  ].join("\n");
  assertEquals(lint(source).length, 7);
});

Deno.test("curly: fix by adding braces and putting the body on its own line", () => {
  assertEquals(fix("if (a) return b;\n"), "if (a) {\n  return b;\n}\n");
});

Deno.test("curly: fix using the statement's indentation", () => {
  assertEquals(
    fix("function f() {\n  if (a) return b;\n}\n"),
    "function f() {\n  if (a) {\n    return b;\n  }\n}\n",
  );
});

Deno.test("curly: fix bodies which are on the line after the statement", () => {
  assertEquals(fix("if (a)\n  b();\n"), "if (a) {\n  b();\n}\n");
});

Deno.test("curly: re-indent multi-line bodies", () => {
  assertEquals(fix("if (a) foo(\n  x,\n);\n"), "if (a) {\n  foo(\n    x,\n  );\n}\n");
});

Deno.test("curly: re-indent multi-line bodies which are on the line after the statement", () => {
  // Correctly indented already.
  assertEquals(fix("if (a)\n  foo(\n    x);\n"), "if (a) {\n  foo(\n    x);\n}\n");
  // Over-indented.
  assertEquals(fix("if (a)\n      foo(\n        x);\n"), "if (a) {\n  foo(\n    x);\n}\n");
});

Deno.test("curly: don't re-indent lines inside template literals", () => {
  assertEquals(
    fix("if (a) log(`one\n  two`,\n  x);\n"),
    "if (a) {\n  log(`one\n  two`,\n    x);\n}\n",
  );
});

Deno.test("curly: fix if and else", () => {
  assertEquals(fix("if (a) b(); else c();\n"), "if (a) {\n  b();\n} else {\n  c();\n}\n");
});

Deno.test("curly: fix the else at the end of an else-if chain", () => {
  assertEquals(
    fix("if (a) {\n  b();\n} else if (c) {\n  d();\n} else e();\n"),
    "if (a) {\n  b();\n} else if (c) {\n  d();\n} else {\n  e();\n}\n",
  );
});

Deno.test("curly: fix loops", () => {
  assertEquals(fix("for (const x of o) b(x);\n"), "for (const x of o) {\n  b(x);\n}\n");
  assertEquals(fix("while (a) b();\n"), "while (a) {\n  b();\n}\n");
  assertEquals(fix("do b(); while (a);\n"), "do {\n  b();\n} while (a);\n");
});

Deno.test("curly: fix empty bodies as empty braces", () => {
  assertEquals(fix("while (a());\n"), "while (a()) {}\n");
  assertEquals(fix("for (;;) ;\n"), "for (;;) {}\n");
  assertEquals(fix("if (a);\n"), "if (a) {}\n");
});

Deno.test("curly: leave comments between the statement and its body in place", () => {
  assertEquals(fix("if (a) // Comment.\n  b();\n"), "if (a) // Comment.\n  {\n  b();\n}\n");
});
