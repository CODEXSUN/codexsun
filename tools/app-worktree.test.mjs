import assert from "node:assert/strict";
import test from "node:test";
import { createState, getWorktreeLocation } from "./app-worktree.mjs";

test("creates an application-scoped worktree record", () => {
  const state = createState("docs", "index-refresh");

  assert.equal(state.branch, "codex/docs-index-refresh");
  assert.equal(state.scope, "docs");
  assert.equal(state.status, "created");
  assert.match(getWorktreeLocation("docs", "index-refresh"), /\.codexsun-worktrees/);
});

test("rejects package worktrees and unsafe task names", () => {
  assert.throws(() => createState("packages", "ui-change"), /application scope/);
  assert.throws(() => createState("docs", "Unsafe Task"), /Task must use/);
});
