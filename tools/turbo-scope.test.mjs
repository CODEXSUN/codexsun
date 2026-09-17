import assert from "node:assert/strict";
import test from "node:test";
import { createTurboScopeCommand, scopeWorkspaces } from "./turbo-scope.mjs";

test("creates an app-isolated cache namespace and dependency closure", () => {
  const command = createTurboScopeCommand("docs", "build");

  assert.deepEqual(command.slice(0, 6), ["exec", "turbo", "--", "run", "build", "--cache-dir"]);
  assert.ok(command.includes("dist/.turbo/docs"));
  assert.ok(command.includes("@codexsun/docs-api..."));
  assert.ok(command.includes("@codexsun/docs-web..."));
  assert.deepEqual(scopeWorkspaces.uiux, ["@codexsun/uiux-web"]);
});

test("rejects unknown scopes and unsafe task names", () => {
  assert.throws(() => createTurboScopeCommand("unknown", "build"), /Unknown Turbo scope/);
  assert.throws(() => createTurboScopeCommand("docs", "deploy"), /Unsupported Turbo task/);
});
