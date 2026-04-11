import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import {
  getScheduledSystemUpdateTasks,
  getSystemUpdatePreview,
  getSystemUpdateStatus,
  listSystemUpdateHistory,
  resetSystemToLastCommit,
  runScheduledSystemUpdateCheck,
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
        "git show -s --format=%s%x1f%cI abc123": () => ({
          stdout: "#111 - fix(runtime): align local git sync update flow\u001f2026-04-10T13:00:40.000Z\n",
        }),
        "git tag --points-at abc123": () => ({ stdout: "v-0.0.1\n" }),
        "git show abc123:package.json": () => ({ stdout: '{ "version": "0.0.1" }\n' }),
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
    assert.equal(status.currentRevision?.summary, "#111 - fix(runtime): align local git sync update flow")
    assert.equal(status.currentRevision?.tag, "v-0.0.1")
    assert.equal(status.currentRevision?.version, "0.0.1")
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
        "git show -s --format=%s%x1f%cI abc123": () => ({
          stdout: "#111 - fix(runtime): align local git sync update flow\u001f2026-04-10T13:00:40.000Z\n",
        }),
        "git tag --points-at abc123": () => ({ stdout: "v-0.0.1\n" }),
        "git show abc123:package.json": () => ({ stdout: '{ "version": "0.0.1" }\n' }),
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
    assert.equal(preview.status.currentRevision?.version, "0.0.1")
    assert.equal(preview.items.length, 2)
    assert.equal(preview.items[0]?.commit, "def456")
    assert.equal(preview.items[0]?.summary, "feat: add update preview")
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("system update status uses runtime repository when git sync is active", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-system-update-runtime-repo-"))

  try {
    const appRoot = path.join(tempRoot, "app")
    const runtimeRepoRoot = path.join(tempRoot, "runtime", "repository")
    mkdirSync(path.join(appRoot, "build", "app", "cxapp", "web"), { recursive: true })
    mkdirSync(path.join(runtimeRepoRoot, ".git"), { recursive: true })
    writeFileSync(
      path.join(appRoot, ".env"),
      [
        "APP_ENV=development",
        "WEB_ROOT=build/app/cxapp/web",
        "GIT_SYNC_ENABLED=true",
        "GIT_REPOSITORY_URL=https://github.com/CODEXSUN/codexsun.git",
        "GIT_BRANCH=main",
      ].join("\n"),
      "utf8"
    )

    const config = getServerConfig(appRoot)
    const calls: string[] = []
    const runner = createRunner(
      {
        "git --version": () => ({ stdout: "git version 2.49.0\n" }),
        "npm.cmd --version": () => ({ stdout: "11.4.0\n" }),
        "git rev-parse --is-inside-work-tree": () => ({ stdout: "true\n" }),
        "git rev-parse --abbrev-ref HEAD": () => ({ stdout: "main\n" }),
        "git rev-parse HEAD": () => ({ stdout: "abc123\n" }),
        "git show -s --format=%s%x1f%cI abc123": () => ({
          stdout: "#111 - fix(runtime): align local git sync update flow\u001f2026-04-10T13:00:40.000Z\n",
        }),
        "git tag --points-at abc123": () => ({ stdout: "" }),
        "git show abc123:package.json": () => ({ stdout: '{ "version": "0.0.1" }\n' }),
        "git status --porcelain": () => ({ stdout: "" }),
        "git ls-remote --heads https://github.com/CODEXSUN/codexsun.git refs/heads/main": () => ({
          stdout: "abc123\trefs/heads/main\n",
        }),
      },
      calls
    )

    const status = await getSystemUpdateStatus(config, runner)

    assert.equal(status.currentCommit, "abc123")
    assert.equal(
      calls.every((entry) => entry.startsWith(`${runtimeRepoRoot} ::`)),
      true
    )
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
        "git show -s --format=%s%x1f%cI abc123": () => ({
          stdout: "before update\u001f2026-04-10T06:00:00.000Z\n",
        }),
        "git show -s --format=%s%x1f%cI def456": () => ({
          stdout: "after update\u001f2026-04-10T07:00:00.000Z\n",
        }),
        "git tag --points-at abc123": () => ({ stdout: "" }),
        "git tag --points-at def456": () => ({ stdout: "v-0.0.2\n" }),
        "git show abc123:package.json": () => ({ stdout: '{ "version": "0.0.1" }\n' }),
        "git show def456:package.json": () => ({ stdout: '{ "version": "0.0.2" }\n' }),
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
    const history = await listSystemUpdateHistory(config, runner)

    assert.equal(response.updated, true)
    assert.equal(response.status.isClean, true)
    assert.equal(response.currentCommit, "def456")
    assert.equal(response.status.currentRevision?.summary, "after update")
    assert.equal(response.status.currentRevision?.version, "0.0.2")
    assert.equal(history.items[0]?.previousRevision?.summary, "before update")
    assert.equal(history.items[0]?.previousRevision?.version, "0.0.1")
    assert.equal(history.items[0]?.currentRevision?.summary, "after update")
    assert.equal(history.items[0]?.currentRevision?.version, "0.0.2")
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
        "git show -s --format=%s%x1f%cI abc123": () => ({
          stdout: "before update\u001f2026-04-10T06:00:00.000Z\n",
        }),
        "git show -s --format=%s%x1f%cI def456": () => ({
          stdout: "after update\u001f2026-04-10T07:00:00.000Z\n",
        }),
        "git tag --points-at abc123": () => ({ stdout: "" }),
        "git tag --points-at def456": () => ({ stdout: "v-0.0.2\n" }),
        "git show abc123:package.json": () => ({ stdout: '{ "version": "0.0.1" }\n' }),
        "git show def456:package.json": () => ({ stdout: '{ "version": "0.0.2" }\n' }),
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
    const history = await listSystemUpdateHistory(config, runner)

    assert.equal(head, "abc123")
    assert.equal(history.items[0]?.result, "failure")
    assert.equal(history.items[0]?.failureReason, "Build failed.")
    assert.equal(history.items[0]?.previousRevision?.summary, "before update")
    assert.equal(history.items[0]?.currentRevision?.summary, "before update")
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
        "git show -s --format=%s%x1f%cI abc123": () => ({
          stdout: "#111 - fix(runtime): align local git sync update flow\u001f2026-04-10T13:00:40.000Z\n",
        }),
        "git tag --points-at abc123": () => ({ stdout: "v-0.0.1\n" }),
        "git show abc123:package.json": () => ({ stdout: '{ "version": "0.0.1" }\n' }),
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
    const history = await listSystemUpdateHistory(config, runner)

    assert.equal(response.restartScheduled, true)
    assert.equal(response.status.isClean, true)
    assert.equal(response.status.localChanges.length, 0)
    assert.equal(calls.some((entry) => entry.includes("git clean -fd")), true)
    assert.equal(history.items[0]?.action, "reset")
    assert.equal(history.items[0]?.result, "success")
    assert.equal(history.items[0]?.failureReason, null)
    assert.equal(history.items[0]?.previousRevision?.summary, "#111 - fix(runtime): align local git sync update flow")
    assert.equal(history.items[0]?.currentRevision?.summary, "#111 - fix(runtime): align local git sync update flow")
    assert.doesNotMatch(
      readFileSync(path.join(tempRoot, "apps/cxapp/src/server/restart-token.ts"), "utf8"),
      /"before"/
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("scheduled update check records a no-update activity entry", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-system-update-scheduled-check-"))

  try {
    writeFileSync(
      path.join(tempRoot, ".env"),
      [
        "APP_ENV=development",
        "GIT_SYNC_ENABLED=true",
        "GIT_REPOSITORY_URL=https://github.com/CODEXSUN/codexsun.git",
        "GIT_BRANCH=main",
        "GIT_SCHEDULED_UPDATE_ENABLED=true",
        "GIT_SCHEDULED_UPDATE_CADENCE_MINUTES=15",
        "GIT_SCHEDULED_UPDATE_AUTO_APPLY=false",
      ].join("\n"),
      "utf8"
    )

    const config = getServerConfig(tempRoot)
    const logger = {
      info: (..._args: unknown[]) => undefined,
      warn: (..._args: unknown[]) => undefined,
      error: (..._args: unknown[]) => undefined,
    } as Parameters<typeof getScheduledSystemUpdateTasks>[1]
    const runner = createRunner(
      {
        "git --version": () => ({ stdout: "git version 2.49.0\n" }),
        "npm.cmd --version": () => ({ stdout: "11.4.0\n" }),
        "git rev-parse --is-inside-work-tree": () => ({ stdout: "true\n" }),
        "git rev-parse --abbrev-ref HEAD": () => ({ stdout: "main\n" }),
        "git rev-parse HEAD": () => ({ stdout: "abc123\n" }),
        "git show -s --format=%s%x1f%cI abc123": () => ({
          stdout: "#111 - fix(runtime): align local git sync update flow\u001f2026-04-10T13:00:40.000Z\n",
        }),
        "git tag --points-at abc123": () => ({ stdout: "v-0.0.1\n" }),
        "git show abc123:package.json": () => ({ stdout: '{ "version": "0.0.1" }\n' }),
        "git status --porcelain": () => ({ stdout: "" }),
        "git ls-remote --heads https://github.com/CODEXSUN/codexsun.git refs/heads/main": () => ({
          stdout: "abc123\trefs/heads/main\n",
        }),
        "git remote get-url origin": () => ({
          stdout: "https://github.com/CODEXSUN/codexsun.git\n",
        }),
        "git fetch --prune origin": () => ({ stdout: "" }),
      },
      []
    )

    const tasks = getScheduledSystemUpdateTasks(config, logger, runner)
    await runScheduledSystemUpdateCheck(config, logger, runner)
    const history = await listSystemUpdateHistory(config, runner)

    assert.equal(tasks.length, 1)
    assert.equal(tasks[0]?.cadenceMs, 15 * 60 * 1000)
    assert.equal(history.items[0]?.action, "check")
    assert.equal(history.items[0]?.result, "success")
    assert.match(history.items[0]?.message ?? "", /no new commits/i)
    assert.equal(history.items[0]?.actor, "system:scheduler")
    assert.equal(
      history.items[0]?.currentRevision?.summary,
      "#111 - fix(runtime): align local git sync update flow"
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("scheduled update check can auto-apply pending commits and records both history entries", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-system-update-scheduled-apply-"))

  try {
    mkdirSync(path.join(tempRoot, "apps/cxapp/src/server"), { recursive: true })
    writeFileSync(
      path.join(tempRoot, "apps/cxapp/src/server/restart-token.ts"),
      'export const runtimeRestartToken = "before"\n',
      "utf8"
    )
    writeFileSync(
      path.join(tempRoot, ".env"),
      [
        "APP_ENV=development",
        "GIT_SYNC_ENABLED=true",
        "GIT_REPOSITORY_URL=https://github.com/CODEXSUN/codexsun.git",
        "GIT_BRANCH=main",
        "GIT_SCHEDULED_UPDATE_ENABLED=true",
        "GIT_SCHEDULED_UPDATE_CADENCE_MINUTES=10",
        "GIT_SCHEDULED_UPDATE_AUTO_APPLY=true",
      ].join("\n"),
      "utf8"
    )

    const config = getServerConfig(tempRoot)
    const logger = {
      info: (..._args: unknown[]) => undefined,
      warn: (..._args: unknown[]) => undefined,
      error: (..._args: unknown[]) => undefined,
    } as Parameters<typeof getScheduledSystemUpdateTasks>[1]
    let head = "abc123"
    const runner = createRunner(
      {
        "git --version": () => ({ stdout: "git version 2.49.0\n" }),
        "npm.cmd --version": () => ({ stdout: "11.4.0\n" }),
        "git rev-parse --is-inside-work-tree": () => ({ stdout: "true\n" }),
        "git rev-parse --abbrev-ref HEAD": () => ({ stdout: "main\n" }),
        "git rev-parse HEAD": () => ({ stdout: `${head}\n` }),
        "git show -s --format=%s%x1f%cI abc123": () => ({
          stdout: "before update\u001f2026-04-10T06:00:00.000Z\n",
        }),
        "git show -s --format=%s%x1f%cI def456": () => ({
          stdout: "after update\u001f2026-04-10T07:00:00.000Z\n",
        }),
        "git tag --points-at abc123": () => ({ stdout: "" }),
        "git tag --points-at def456": () => ({ stdout: "v-0.0.2\n" }),
        "git show abc123:package.json": () => ({ stdout: '{ "version": "0.0.1" }\n' }),
        "git show def456:package.json": () => ({ stdout: '{ "version": "0.0.2" }\n' }),
        "git status --porcelain": () => ({ stdout: "" }),
        "git ls-remote --heads https://github.com/CODEXSUN/codexsun.git refs/heads/main": () => ({
          stdout: "def456\trefs/heads/main\n",
        }),
        "git remote get-url origin": () => ({
          stdout: "https://github.com/CODEXSUN/codexsun.git\n",
        }),
        "git fetch --prune origin": () => ({ stdout: "" }),
        "git log --format=%H%x1f%s%x1f%an%x1f%cI abc123..origin/main": () => ({
          stdout: "def456\u001ffeat: add scheduled update\u001fSunda\u001f2026-04-10T08:00:00.000Z\n",
        }),
        "git reset --hard HEAD": () => ({ stdout: `HEAD is now at ${head}\n` }),
        "git clean -fd": () => ({ stdout: "" }),
        "git checkout -B main origin/main": () => {
          head = "def456"
          return { stdout: "Switched to and reset branch 'main'\n" }
        },
        "git pull --ff-only origin main": () => ({ stdout: "Updating abc123..def456\n" }),
        "git reset --hard origin/main": () => {
          head = "def456"
          return { stdout: "HEAD is now at def456\n" }
        },
        "npm.cmd ci": () => ({ stdout: "installed\n" }),
        "npm.cmd run build": () => ({ stdout: "Build complete\n" }),
      },
      []
    )

    await runScheduledSystemUpdateCheck(config, logger, runner)
    const history = await listSystemUpdateHistory(config, runner)

    assert.equal(history.items[0]?.action, "update")
    assert.equal(history.items[0]?.result, "success")
    assert.equal(history.items[0]?.actor, "system:scheduler")
    assert.equal(history.items[0]?.currentRevision?.summary, "after update")
    assert.equal(history.items[1]?.action, "check")
    assert.equal(history.items[1]?.result, "success")
    assert.match(history.items[1]?.message ?? "", /started automatic apply/i)
    assert.equal(history.items[1]?.actor, "system:scheduler")
    assert.equal(history.items[1]?.currentRevision?.summary, "after update")
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
