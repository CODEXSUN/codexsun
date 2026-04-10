import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import {
  getSystemUpdatePreview,
  getSystemUpdateStatus,
  listSystemUpdateHistory,
  resetSystemToLastCommit,
  runSystemUpdate,
  type CommandRunner,
} from "../../apps/framework/src/runtime/system-update/system-update-service.js"

function createRunner(handlers: Record<string, () => { ok?: boolean; stdout?: string; stderr?: string }>, calls: string[]): CommandRunner {
  return async (command, args, cwd, allowFailure = false) => {
    const key = `${command} ${args.join(" ")}`
    calls.push(`${cwd} :: ${key}`)
    const handler = handlers[key]

    if (!handler) {
      throw new Error(`Unexpected command: ${key}`)
    }

    const result = handler()

    if (result.ok === false && !allowFailure) {
      throw new Error(result.stderr ?? "Command failed.")
    }

    return {
      ok: result.ok ?? true,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
    }
  }
}

test("system update status reports remote update and clean worktree", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-system-update-status-"))

  try {
    const config = getServerConfig(tempRoot)
    const calls: string[] = []
    const runner = createRunner(
      {
        "git --version": () => ({ stdout: "git version 2.49.0\n" }),
        "npm.cmd --version": () => ({ stdout: "11.4.0\n" }),
        "git rev-parse --is-inside-work-tree": () => ({ stdout: "true\n" }),
        "git rev-parse --abbrev-ref HEAD": () => ({ stdout: "main\n" }),
        "git rev-parse HEAD": () => ({ stdout: "abc123\n" }),
        "git status --porcelain": () => ({ stdout: "" }),
        "git ls-remote --heads https://github.com/CODEXSUN/codexsun.git refs/heads/main": () => ({
          stdout: "def456\trefs/heads/main\n",
        }),
        "git clean -fd": () => ({ stdout: "" }),
        "npm.cmd ci": () => ({ stdout: "installed\n" }),
        "npm.cmd run build": () => ({ stdout: "Build complete\n" }),
      },
      calls
    )

    const status = await getSystemUpdateStatus(config, runner)

    assert.equal(status.branch, "main")
    assert.equal(status.currentCommit, "abc123")
    assert.equal(status.remoteCommit, "def456")
    assert.equal(status.isClean, true)
    assert.equal(status.hasRemoteUpdate, true)
    assert.equal(status.canAutoUpdate, true)
    assert.equal(
      calls.some((entry) =>
        entry.includes("git ls-remote --heads https://github.com/CODEXSUN/codexsun.git refs/heads/main")
      ),
      true
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("system update preview returns pending commits from the configured branch", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-system-update-preview-"))

  try {
    const config = getServerConfig(tempRoot)
    const runner = createRunner(
      {
        "git --version": () => ({ stdout: "git version 2.49.0\n" }),
        "npm.cmd --version": () => ({ stdout: "11.4.0\n" }),
        "git rev-parse --is-inside-work-tree": () => ({ stdout: "true\n" }),
        "git rev-parse --abbrev-ref HEAD": () => ({ stdout: "main\n" }),
        "git rev-parse HEAD": () => ({ stdout: "abc123\n" }),
        "git status --porcelain": () => ({ stdout: "" }),
        "git ls-remote --heads https://github.com/CODEXSUN/codexsun.git refs/heads/main": () => ({
          stdout: "def456\trefs/heads/main\n",
        }),
        "git remote get-url origin": () => ({
          stdout: "https://github.com/CODEXSUN/codexsun.git\n",
        }),
        "git fetch --prune origin": () => ({ stdout: "" }),
        "git log --format=%H%x1f%s%x1f%an%x1f%cI abc123..origin/main": () => ({
          stdout: [
            "def456\u001ffeat: add update preview\u001fSunda\u001f2026-04-10T08:00:00.000Z",
            "fedcba\u001ffix: tighten runtime sync copy\u001fSunda\u001f2026-04-10T08:10:00.000Z",
          ].join("\n"),
        }),
      },
      []
    )

    const preview = await getSystemUpdatePreview(config, runner)

    assert.equal(preview.status.currentCommit, "abc123")
    assert.equal(preview.items.length, 2)
    assert.equal(preview.items[0]?.commit, "def456")
    assert.equal(preview.items[0]?.summary, "feat: add update preview")
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("system update discards local changes, pulls configured branch, and rebuilds", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-system-update-dirty-"))

  try {
    mkdirSync(path.join(tempRoot, "apps/cxapp/src/server"), { recursive: true })
    writeFileSync(
      path.join(tempRoot, "apps/cxapp/src/server/restart-token.ts"),
      'export const runtimeRestartToken = "before"\n',
      "utf8"
    )

    const config = getServerConfig(tempRoot)
    const calls: string[] = []
    let head = "abc123"
    let dirty = true
    const runner = createRunner(
      {
        "git --version": () => ({ stdout: "git version 2.49.0\n" }),
        "npm.cmd --version": () => ({ stdout: "11.4.0\n" }),
        "git rev-parse --is-inside-work-tree": () => ({ stdout: "true\n" }),
        "git rev-parse --abbrev-ref HEAD": () => ({ stdout: "main\n" }),
        "git rev-parse HEAD": () => ({ stdout: `${head}\n` }),
        "git status --porcelain": () => ({
          stdout: dirty ? " M apps/core/file.ts\n?? scratch.txt\n" : "",
        }),
        "git ls-remote --heads https://github.com/CODEXSUN/codexsun.git refs/heads/main": () => ({
          stdout: "def456\trefs/heads/main\n",
        }),
        "git remote get-url origin": () => ({
          stdout: "https://github.com/CODEXSUN/codexsun.git\n",
        }),
        "git fetch --prune origin": () => ({ stdout: "" }),
        "git reset --hard HEAD": () => {
          dirty = false
          return { stdout: `HEAD is now at ${head}\n` }
        },
        "git clean -fd": () => ({ stdout: "Removing scratch.txt\n" }),
        "git checkout -B main origin/main": () => {
          head = "def456"
          return { stdout: "Switched to and reset branch 'main'\n" }
        },
        "git pull --ff-only origin main": () => ({ stdout: "Already up to date.\n" }),
        "git reset --hard origin/main": () => {
          head = "def456"
          return { stdout: "HEAD is now at def456\n" }
        },
        "npm.cmd ci": () => ({ stdout: "installed\n" }),
        "npm.cmd run build": () => ({ stdout: "Build complete\n" }),
      },
      calls
    )

    const response = await runSystemUpdate(config, runner)

    assert.equal(response.updated, true)
    assert.equal(response.status.isClean, true)
    assert.equal(response.currentCommit, "def456")
    assert.equal(calls.some((entry) => entry.includes("git pull --ff-only origin main")), true)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("system update rolls back to previous commit when build fails", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-system-update-rollback-"))

  try {
    mkdirSync(path.join(tempRoot, "apps/cxapp/src/server"), { recursive: true })
    writeFileSync(
      path.join(tempRoot, "apps/cxapp/src/server/restart-token.ts"),
      'export const runtimeRestartToken = "before"\n',
      "utf8"
    )

    const config = getServerConfig(tempRoot)
    const calls: string[] = []
    let head = "abc123"
    const runner = createRunner(
      {
        "git --version": () => ({ stdout: "git version 2.49.0\n" }),
        "npm.cmd --version": () => ({ stdout: "11.4.0\n" }),
        "git rev-parse --is-inside-work-tree": () => ({ stdout: "true\n" }),
        "git rev-parse --abbrev-ref HEAD": () => ({ stdout: "main\n" }),
        "git rev-parse HEAD": () => ({ stdout: `${head}\n` }),
        "git status --porcelain": () => ({ stdout: "" }),
        "git ls-remote --heads https://github.com/CODEXSUN/codexsun.git refs/heads/main": () => ({
          stdout: "def456\trefs/heads/main\n",
        }),
        "git remote get-url origin": () => ({
          stdout: "https://github.com/CODEXSUN/codexsun.git\n",
        }),
        "git fetch --prune origin": () => ({ stdout: "" }),
        "git reset --hard HEAD": () => ({ stdout: `HEAD is now at ${head}\n` }),
        "git checkout -B main origin/main": () => {
          head = "def456"
          return { stdout: "Switched to and reset branch 'main'\n" }
        },
        "git pull --ff-only origin main": () => ({ stdout: "Updating abc123..def456\n" }),
        "git reset --hard origin/main": () => {
          head = "def456"
          return { stdout: "HEAD is now at def456\n" }
        },
        "git clean -fd": () => ({ stdout: "Removing build cache\n" }),
        "git reset --hard abc123": () => {
          head = "abc123"
          return { stdout: "HEAD is now at abc123\n" }
        },
        "npm.cmd ci": () => ({ stdout: "installed\n" }),
        "npm.cmd run build": () => {
          if (head === "def456") {
            return { ok: false, stderr: "Build failed." }
          }

          return { stdout: "Build restored.\n" }
        },
      },
      calls
    )

    await assert.rejects(
      () => runSystemUpdate(config, runner),
      (error: unknown) => {
        assert.ok(error instanceof Error)
        assert.match(error.message, /previous commit was restored/i)
        return true
      }
    )

    assert.equal(head, "abc123")
    assert.equal(calls.some((entry) => entry.includes("git reset --hard abc123")), true)
    assert.match(
      readFileSync(path.join(tempRoot, "apps/cxapp/src/server/restart-token.ts"), "utf8"),
      /"before"/
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("forced reset discards local changes, rebuilds, and returns clean status", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-system-reset-"))

  try {
    mkdirSync(path.join(tempRoot, "apps/cxapp/src/server"), { recursive: true })
    writeFileSync(
      path.join(tempRoot, "apps/cxapp/src/server/restart-token.ts"),
      'export const runtimeRestartToken = "before"\n',
      "utf8"
    )

    const config = getServerConfig(tempRoot)
    const calls: string[] = []
    let dirty = true
    const runner = createRunner(
      {
        "git --version": () => ({ stdout: "git version 2.49.0\n" }),
        "npm.cmd --version": () => ({ stdout: "11.4.0\n" }),
        "git rev-parse --is-inside-work-tree": () => ({ stdout: "true\n" }),
        "git rev-parse --abbrev-ref HEAD": () => ({ stdout: "main\n" }),
        "git rev-parse HEAD": () => ({ stdout: "abc123\n" }),
        "git status --porcelain": () => ({
          stdout: dirty ? " M apps/core/file.ts\n?? temp.txt\n" : "",
        }),
        "git ls-remote --heads https://github.com/CODEXSUN/codexsun.git refs/heads/main": () => ({
          stdout: "abc123\trefs/heads/main\n",
        }),
        "git reset --hard abc123": () => {
          dirty = false
          return { stdout: "HEAD is now at abc123\n" }
        },
        "git clean -fd": () => ({ stdout: "Removing temp.txt\n" }),
        "npm.cmd ci": () => ({ stdout: "installed\n" }),
        "npm.cmd run build": () => ({ stdout: "Build complete\n" }),
      },
      calls
    )

    const response = await resetSystemToLastCommit(config, { force: true }, runner)
    const history = listSystemUpdateHistory(config)

    assert.equal(response.restartScheduled, true)
    assert.equal(response.status.isClean, true)
    assert.equal(response.status.localChanges.length, 0)
    assert.equal(calls.some((entry) => entry.includes("git clean -fd")), true)
    assert.equal(history.items[0]?.action, "reset")
    assert.equal(history.items[0]?.result, "success")
    assert.doesNotMatch(
      readFileSync(path.join(tempRoot, "apps/cxapp/src/server/restart-token.ts"), "utf8"),
      /"before"/
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
