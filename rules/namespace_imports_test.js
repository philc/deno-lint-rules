import { assertEquals } from "@std/assert";
import plugin from "../mod.js";

function lint(source) {
  return Deno.lint.runPlugin(plugin, "test.js", source)
    .filter((d) => d.id == "lint-rules/namespace-imports");
}

const isAllowed = (source) => lint(source).length == 0;

Deno.test("namespace-imports: allow namespace, default, and side-effect imports", () => {
  assertEquals(isAllowed(`import * as s3 from "@aws-sdk/client-s3";`), true);
  assertEquals(isAllowed(`import * as cut from "./lib/cut.js";`), true);
  assertEquals(isAllowed(`import Anthropic from "@anthropic-ai/sdk";`), true);
  assertEquals(isAllowed(`import plugin from "../mod.js";`), true);
  assertEquals(isAllowed(`import "./polyfill.js";`), true);
});

Deno.test("namespace-imports: report named imports", () => {
  const errors = lint(`import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";`);
  assertEquals(errors.length, 1);
  assertEquals(errors[0].id, "lint-rules/namespace-imports");
  assertEquals(isAllowed(`import { readFile } from "node:fs";`), false);
  assertEquals(isAllowed(`import { join } from "jsr:@std/path";`), false);
});

Deno.test("namespace-imports: report the named part of a default and named import", () => {
  assertEquals(isAllowed(`import React, { useState } from "react";`), false);
});

Deno.test("namespace-imports: allow package imports which would stutter", () => {
  assertEquals(isAllowed(`import { parseArgs } from "@std/cli/parse-args";`), true);
  assertEquals(isAllowed(`import { assert, assertEquals } from "@std/assert";`), true);
  assertEquals(isAllowed(`import { expect } from "@std/expect";`), true);
  assertEquals(isAllowed(`import { XMLParser } from "fast-xml-parser";`), true);
});

Deno.test("namespace-imports: require every name to stutter", () => {
  assertEquals(isAllowed(`import { assertEquals, delay } from "@std/assert";`), false);
});

Deno.test("namespace-imports: use the imported name, not a local alias", () => {
  assertEquals(isAllowed(`import { parseArgs as parse } from "@std/cli/parse-args";`), true);
  assertEquals(isAllowed(`import { join as pathJoin } from "@std/path";`), false);
});

Deno.test("namespace-imports: derive the module name from versioned and URL specifiers", () => {
  assertEquals(isAllowed(`import { parseArgs } from "jsr:@std/cli@^1.0.0/parse-args";`), true);
  assertEquals(isAllowed(`import { assertEquals } from "jsr:@std/assert@1";`), true);
  assertEquals(isAllowed(`import { XMLParser } from "npm:fast-xml-parser@5";`), true);
  assertEquals(
    isAllowed(`import { assert } from "https://deno.land/std@0.200.0/assert/mod.ts";`),
    true,
  );
});

Deno.test("namespace-imports: don't allow stutter for the project's own modules", () => {
  assertEquals(isAllowed(`import { planCuts } from "./lib/cut.js";`), false);
  assertEquals(isAllowed(`import { planCuts } from "/src/cut.js";`), false);
  assertEquals(isAllowed(`import { planCuts } from "file:///src/cut.js";`), false);
});

Deno.test("namespace-imports: treat vendored paths as packages", () => {
  assertEquals(isAllowed(`import { parseArgs } from "./vendor/parse_args.js";`), true);
  assertEquals(isAllowed(`import { join } from "./vendor/path.js";`), false);
  assertEquals(
    isAllowed(`import { XMLParser } from "../node_modules/fast-xml-parser/index.js";`),
    true,
  );
});
