import { assertEquals } from "@std/assert";
import * as helpers from "./helpers.js";

const lint = (source) => helpers.lint(source, "lint-rules/no-default-export");

Deno.test("no-default-export: report default exports", () => {
  assertEquals(lint("export default function plan() {}").length, 1);
  assertEquals(lint("export default class Tree {}").length, 1);
  assertEquals(lint("const plan = 1;\nexport default plan;").length, 1);
  assertEquals(lint("const plan = 1;\nexport { plan as default };").length, 1);
});

Deno.test("no-default-export: allow named exports", () => {
  assertEquals(lint("export function plan() {}").length, 0);
  assertEquals(lint("const plan = 1;\nexport { plan };").length, 0);
});
