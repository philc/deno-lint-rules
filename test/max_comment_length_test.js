import { assertEquals } from "@std/assert";
import * as helpers from "./helpers.js";

const lint = (source) => helpers.lint(source, "lint-rules/max-comment-length");

const isAllowed = (source) => lint(source).length == 0;

// Returns a comment line of exactly `length` characters, made of short words, starting with
// `prefix`.
function commentLine(length, prefix = "// ") {
  let line = prefix;
  while (line.length < length) {
    line += "word ";
  }
  return line.slice(0, length).trimEnd().padEnd(length, "x");
}

Deno.test("max-comment-length: allow lines up to the limit", () => {
  assertEquals(isAllowed(commentLine(100)), true);
  assertEquals(isAllowed(`  ${commentLine(98)}`), true);
});

Deno.test("max-comment-length: report lines which can be wrapped", () => {
  const errors = lint(commentLine(101));
  assertEquals(errors.length, 1);
  assertEquals(errors[0].message, "This comment line is 101 characters. Wrap it at 100.");
  assertEquals(isAllowed(`  ${commentLine(110)}`), false);
});

Deno.test("max-comment-length: check each line of a block comment", () => {
  const source = `/**\n${commentLine(101, " * ")}\n${commentLine(101, " * ")}\n */`;
  assertEquals(lint(source).length, 2);
});

Deno.test("max-comment-length: allow a word too long to fit on a line by itself", () => {
  const url = "https://example.com/" + "a".repeat(90);
  assertEquals(isAllowed(`// See ${url}`), true);
  assertEquals(isAllowed(`// ${url}`), true);
});

Deno.test("max-comment-length: report a long word which would fit on a line by itself", () => {
  const url = "https://example.com/" + "a".repeat(60);
  assertEquals(isAllowed(`// ${"word ".repeat(10)}${url}`), false);
});

Deno.test("max-comment-length: report a comment after code, which can move above it", () => {
  const code = "const x = 1; ";
  assertEquals(isAllowed(code + commentLine(100 - code.length)), true);
  assertEquals(isAllowed(code + commentLine(101 - code.length)), false);
});

Deno.test("max-comment-length: ignore long lines of code", () => {
  assertEquals(isAllowed(`const s = "${"a".repeat(120)}";`), true);
});
