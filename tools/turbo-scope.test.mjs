import assert from "node:assert/strict";
import test from "node:test";
import { createTurboScopeCommand, scopeWorkspaces } from "./turbo-scope.mjs";

test("creates an app-isolated cache namespace and dependency closure", () => {
  const command = createTurboScopeCommand("docx", "build");

  assert.deepEqual(command.slice(0, 6), ["exec", "turbo", "--", "run", "build", "--cache-dir"]);
  assert.ok(command.includes("dist/.turbo/docx"));
  assert.ok(command.includes("@codexsun/docx-api..."));
  assert.ok(command.includes("@codexsun/docx-web..."));
  assert.deepEqual(scopeWorkspaces.uiux, ["@codexsun/uiux-web"]);
});

test("rejects unknown scopes and unsafe task names", () => {
  assert.throws(() => createTurboScopeCommand("unknown", "build"), /Unknown Turbo scope/);
  assert.throws(() => createTurboScopeCommand("docx", "deploy"), /Unsupported Turbo task/);
});
