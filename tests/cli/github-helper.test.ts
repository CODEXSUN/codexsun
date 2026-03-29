import test from "node:test"
import assert from "node:assert/strict"

import {
  formatCommitMessage,
  inferPushTarget,
  parseCliOptions,
  parseLatestReference,
  parseAheadBehind,
  parseGitStatusPorcelain,
} from "../../apps/cli/src/github-helper.ts"

test("parseGitStatusPorcelain counts staged, unstaged, and untracked changes", () => {
  const summary = parseGitStatusPorcelain(
    ["M  package.json", " M apps/ui/src/components/ui/button.tsx", "?? apps/cli/src/github-helper.ts"].join("\n")
  )

  assert.equal(summary.hasChanges, true)
  assert.equal(summary.stagedCount, 1)
  assert.equal(summary.unstagedCount, 1)
  assert.equal(summary.untrackedCount, 1)
})

test("parseAheadBehind returns numeric ahead and behind counts", () => {
  const aheadBehind = parseAheadBehind("2\t5")

  assert.deepEqual(aheadBehind, {
    ahead: 2,
    behind: 5,
  })
})

test("inferPushTarget keeps plain push when upstream exists", () => {
  assert.deepEqual(inferPushTarget("main", "origin/main", "origin"), ["push"])
})

test("inferPushTarget sets upstream on first push", () => {
  assert.deepEqual(inferPushTarget("feature/docs", null, "origin"), [
    "push",
    "-u",
    "origin",
    "feature/docs",
  ])
})

test("parseLatestReference reads the latest changelog heading and title", () => {
  const reference = parseLatestReference(
    [
      "## v-0.0.1",
      "",
      "### [#11] 2026-03-29 - Current batch",
      "",
      "### [#10] 2026-03-29 - Previous batch",
    ].join("\n")
  )

  assert.deepEqual(reference, {
    number: 11,
    title: "Current batch",
  })
})

test("formatCommitMessage prefixes the current reference number", () => {
  assert.equal(
    formatCommitMessage(11, "feat(cli): add github helper"),
    "#11 - feat(cli): add github helper"
  )
})

test("formatCommitMessage normalizes an already-prefixed message body", () => {
  assert.equal(
    formatCommitMessage(11, "#4 - fix(cli): normalize helper"),
    "#11 - fix(cli): normalize helper"
  )
})

test("parseCliOptions enables auto mode and reads a message flag", () => {
  assert.deepEqual(parseCliOptions(["--yes", "--message", "feat(cli): ship helper"]), {
    yes: true,
    messageBody: "feat(cli): ship helper",
  })
})

test("parseCliOptions treats positional args as message body", () => {
  assert.deepEqual(parseCliOptions(["--yes", "docs(cli):", "update", "usage"]), {
    yes: true,
    messageBody: "docs(cli): update usage",
  })
})
