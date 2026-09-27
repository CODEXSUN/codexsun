import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { createStandaloneApplication } from "../src/standalone-app-scaffold.mjs";

test("creates a neutral standalone foundation", () => {
  const root = mkdtempSync(resolve(tmpdir(), "codexsun-app-factory-"));
  const result = createStandaloneApplication(root, { id: "crm", label: "CRM" });
  assert.equal(result.mode, "standalone-foundation");
  assert.equal(existsSync(resolve(root, "..", "crm", "api/src/index.ts")), true);
  const readme = readFileSync(resolve(root, "..", "crm", "README.md"), "utf8");
  assert.match(readme, /fresh CODEXSUN standalone application foundation/iu);
});

test("rejects a target outside the direct child boundary", () => {
  const root = mkdtempSync(resolve(tmpdir(), "codexsun-app-factory-"));
  assert.throws(() => createStandaloneApplication(root, { id: "crm", target: resolve(root, "nested", "crm") }), /direct child/iu);
});
