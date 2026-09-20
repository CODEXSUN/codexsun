import assert from "node:assert/strict";
import test from "node:test";
import { createState, getWorktreeLocation } from "./app-worktree.mjs";

test("creates an application-scoped worktree record", () => {
  const state = createState("qcafe", "q-1231");

  assert.equal(state.branch, "codex/qcafe-q-1231");
  assert.equal(state.baseCommit, null);
  assert.equal(state.scope, "qcafe");
  assert.equal(state.status, "created");
  assert.equal(state.verifiedAt, null);
  assert.match(getWorktreeLocation("qcafe", "q-1231"), /\.codexsun-worktrees/);
});

test("rejects package worktrees and unsafe task names", () => {
  assert.throws(() => createState("packages", "ui-change"), /application scope/);
  assert.throws(() => createState("qcafe", "q-1231-extra"), /short q-0000 task ID/);
});
