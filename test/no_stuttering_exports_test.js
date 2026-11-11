import { assertEquals } from "@std/assert";
import * as helpers from "./helpers.js";

const lint = (source, filename) =>
  helpers.lint(source, "lint-rules/no-stuttering-exports", filename);

const isAllowed = (source, filename) => lint(source, filename).length == 0;

Deno.test("no-stuttering-exports: report exports which repeat the module's name", () => {
  assertEquals(isAllowed("export function planCuts() {}", "/src/cut.js"), false);
  assertEquals(isAllowed("export class FileTree {}", "/src/file_tree.js"), false);
  assertEquals(isAllowed("export class FileTree {}", "/src/file-tree.ts"), false);
  assertEquals(isAllowed("export const treeSize = 1;", "/src/tree.js"), false);
});

Deno.test("no-stuttering-exports: allow exports which don't repeat it", () => {
  assertEquals(isAllowed("export function plan() {}", "/src/cut.js"), true);
  assertEquals(isAllowed("export class Tree {}", "/src/file_tree.js"), true);
});

Deno.test("no-stuttering-exports: allow an export named just a one-word module's name", () => {
  assertEquals(isAllowed("export class Workbook {}", "/src/workbook.js"), true);
  assertEquals(isAllowed("export const values = [];", "/src/values.js"), true);
});

Deno.test("no-stuttering-exports: compare whole words", () => {
  assertEquals(isAllowed("export function start() {}", "/src/art.js"), true);
  assertEquals(isAllowed("export function cutter() {}", "/src/cut.js"), true);
});

Deno.test("no-stuttering-exports: check each form of export", () => {
  assertEquals(isAllowed("export const cutSize = 1, cutCount = 2;", "/src/cut.js"), false);
  assertEquals(lint("export const cutSize = 1, cutCount = 2;", "/src/cut.js").length, 2);
  assertEquals(isAllowed("const size = 1;\nexport { size as cutSize };", "/src/cut.js"), false);
  assertEquals(isAllowed(`export { planCuts } from "./other.js";`, "/src/cut.js"), false);
});

Deno.test("no-stuttering-exports: name mod, index, and main files after their directory", () => {
  assertEquals(isAllowed("export function planCuts() {}", "/src/cut/mod.js"), false);
  assertEquals(isAllowed("export function plan() {}", "/src/cut/index.js"), true);
});

Deno.test("no-stuttering-exports: skip test files", () => {
  assertEquals(isAllowed("export function planCuts() {}", "/src/cut_test.js"), true);
});
