import test from "node:test"
import assert from "node:assert/strict"

import {
  buildRuntimeGitCommandPlan,
  parseRemoteHeadCommit,
  resolveRuntimeGitSyncTarget,
} from "../../apps/cli/src/system-update-helper.ts"

test("resolveRuntimeGitSyncTarget normalizes repository url and branch defaults", () => {
  const target = resolveRuntimeGitSyncTarget("  https://github.com/CODEXSUN/codexsun.git  ", "  main  ")

  assert.deepEqual(target, {
    repositoryUrl: "https://github.com/CODEXSUN/codexsun.git",
    branch: "main",
    remoteName: "origin",
    remoteRef: "origin/main",
  })
})

test("buildRuntimeGitCommandPlan produces one-way sync commands", () => {
  const target = resolveRuntimeGitSyncTarget("https://github.com/CODEXSUN/codexsun.git", "release")
  const plan = buildRuntimeGitCommandPlan(target)

  assert.deepEqual(plan.fetchArgs, ["fetch", "--prune", "origin"])
  assert.deepEqual(plan.checkoutArgs, ["checkout", "-B", "release", "origin/release"])
  assert.deepEqual(plan.pullArgs, ["pull", "--ff-only", "origin", "release"])
  assert.deepEqual(plan.resetToHeadArgs, ["reset", "--hard", "HEAD"])
  assert.deepEqual(plan.resetToRemoteArgs, ["reset", "--hard", "origin/release"])
  assert.deepEqual(plan.cleanArgs, ["clean", "-fd"])
})

test("parseRemoteHeadCommit reads a commit hash from ls-remote output", () => {
  assert.equal(
    parseRemoteHeadCommit("abc123def4567890abc123def4567890abc123de\trefs/heads/main\n"),
    "abc123def4567890abc123def4567890abc123de"
  )
})

test("parseRemoteHeadCommit returns null when no branch ref is available", () => {
  assert.equal(parseRemoteHeadCommit(""), null)
})
