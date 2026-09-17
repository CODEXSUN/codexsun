import assert from "node:assert/strict";
import test from "node:test";
import { createState, getWorktreeLocation } from "./app-worktree.mjs";

test("creates an application-scoped worktree record", () => {
  const state = createState("docs", "d-1231");

  assert.equal(state.branch, "codex/docs-d-1231");
  assert.equal(state.baseCommit, null);
  assert.equal(state.scope, "docs");
  assert.equal(state.status, "created");
  assert.equal(state.verifiedAt, null);
  assert.match(getWorktreeLocation("docs", "d-1231"), /\.codexsun-worktrees/);
});

test("rejects package worktrees and unsafe task names", () => {
  assert.throws(() => createState("packages", "ui-change"), /application scope/);
  assert.throws(() => createState("docs", "d-1231-extra"), /short d-0000 task ID/);
});
