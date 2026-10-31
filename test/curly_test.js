import { assertEquals } from "@std/assert";
import * as helpers from "./helpers.js";

Deno.test("curly: allow bodies in braces", () => {
  assertEquals(helpers.lint("if (a) {\n  b();\n}\n").length, 0);
  assertEquals(helpers.lint("for (;;) {\n  b();\n}\n").length, 0);
  assertEquals(helpers.lint("do {\n  b();\n} while (a);\n").length, 0);
});

Deno.test("curly: allow else if", () => {
  assertEquals(helpers.lint("if (a) {\n  b();\n} else if (c) {\n  d();\n}\n").length, 0);
});

Deno.test("curly: report bodies without braces", () => {
  const errors = helpers.lint("if (a) b();\n");
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
  assertEquals(helpers.lint(source).length, 7);
});

Deno.test("curly: fix by adding braces and putting the body on its own line", () => {
  assertEquals(helpers.fix("if (a) return b;\n"), "if (a) {\n  return b;\n}\n");
});

Deno.test("curly: fix using the statement's indentation", () => {
  assertEquals(
    helpers.fix("function f() {\n  if (a) return b;\n}\n"),
    "function f() {\n  if (a) {\n    return b;\n  }\n}\n",
  );
});

Deno.test("curly: fix bodies which are on the line after the statement", () => {
  assertEquals(helpers.fix("if (a)\n  b();\n"), "if (a) {\n  b();\n}\n");
});

Deno.test("curly: re-indent multi-line bodies", () => {
  assertEquals(helpers.fix("if (a) foo(\n  x,\n);\n"), "if (a) {\n  foo(\n    x,\n  );\n}\n");
});

Deno.test("curly: re-indent multi-line bodies which are on the line after the statement", () => {
  // Correctly indented already.
  assertEquals(helpers.fix("if (a)\n  foo(\n    x);\n"), "if (a) {\n  foo(\n    x);\n}\n");
  // Over-indented.
  assertEquals(helpers.fix("if (a)\n      foo(\n        x);\n"), "if (a) {\n  foo(\n    x);\n}\n");
});

Deno.test("curly: don't re-indent lines inside template literals", () => {
  assertEquals(
    helpers.fix("if (a) log(`one\n  two`,\n  x);\n"),
    "if (a) {\n  log(`one\n  two`,\n    x);\n}\n",
  );
});

Deno.test("curly: fix if and else", () => {
  assertEquals(helpers.fix("if (a) b(); else c();\n"), "if (a) {\n  b();\n} else {\n  c();\n}\n");
});

Deno.test("curly: fix the else at the end of an else-if chain", () => {
  assertEquals(
    helpers.fix("if (a) {\n  b();\n} else if (c) {\n  d();\n} else e();\n"),
    "if (a) {\n  b();\n} else if (c) {\n  d();\n} else {\n  e();\n}\n",
  );
});

Deno.test("curly: fix loops", () => {
  assertEquals(helpers.fix("for (const x of o) b(x);\n"), "for (const x of o) {\n  b(x);\n}\n");
  assertEquals(helpers.fix("while (a) b();\n"), "while (a) {\n  b();\n}\n");
  assertEquals(helpers.fix("do b(); while (a);\n"), "do {\n  b();\n} while (a);\n");
});

Deno.test("curly: fix empty bodies as empty braces", () => {
  assertEquals(helpers.fix("while (a());\n"), "while (a()) {}\n");
  assertEquals(helpers.fix("for (;;) ;\n"), "for (;;) {}\n");
  assertEquals(helpers.fix("if (a);\n"), "if (a) {}\n");
});

Deno.test("curly: leave comments between the statement and its body in place", () => {
  assertEquals(helpers.fix("if (a) // Comment.\n  b();\n"), "if (a) // Comment.\n  {\n  b();\n}\n");
});
