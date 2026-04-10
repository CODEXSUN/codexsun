import { execFile } from "node:child_process"
import { accessSync, appendFileSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs"
import { constants } from "node:fs"
import os from "node:os"
import path from "node:path"
import { promisify } from "node:util"

import {
  systemUpdateHistorySchema,
  systemUpdateResetPayloadSchema,
  systemUpdateRunResponseSchema,
  systemUpdateStatusSchema,
  type SystemUpdateHistory,
  type SystemUpdateHistoryEntry,
  type SystemUpdateResetPayload,
  type SystemUpdateRunResponse,
  type SystemUpdateStatus,
} from "../../../shared/system-update.js"
import { resolveRuntimeSettingsRoot } from "../config/runtime-settings-service.js"
import { scheduleFallbackRestart, triggerDevelopmentRestart } from "../config/runtime-restart.js"
import type { ServerConfig } from "../config/server-config.js"
import { ApplicationError } from "../errors/application-error.js"

const execFileAsync = promisify(execFile)

type CommandResult = {
  ok: boolean
  stdout: string
  stderr: string
}

export type CommandRunner = (
  command: string,
  args: string[],
  cwd: string,
  allowFailure?: boolean
) => Promise<CommandResult>

async function runCommand(
  command: string,
  args: string[],
  cwd: string,
  allowFailure = false
): Promise<CommandResult> {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd,
      encoding: "utf8",
    })

    return {
      ok: true,
      stdout,
      stderr,
    }
  } catch (error) {
    const execError = error as {
      stdout?: string
      stderr?: string
      message: string
    }

    if (!allowFailure) {
      throw new Error(execError.stderr?.trim() || execError.message)
    }

    return {
      ok: false,
      stdout: execError.stdout ?? "",
      stderr: execError.stderr ?? execError.message,
    }
  }
}

function trimTrailing(value: string) {
  return value.trim().replace(/\r?\n$/, "")
}

function parseChanges(raw: string) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
}

function npmCommand() {
  return os.platform() === "win32" ? "npm.cmd" : "npm"
}

function clearBuildCaches(cwd: string) {
  for (const relativePath of ["build", "dist", "dist-ssr", path.join("node_modules", ".vite")]) {
    rmSync(path.join(cwd, relativePath), {
      force: true,
      recursive: true,
    })
  }
}

async function installAndBuild(cwd: string, commandRunner: CommandRunner) {
  clearBuildCaches(cwd)
  await commandRunner(npmCommand(), ["ci"], cwd)
  await commandRunner(npmCommand(), ["run", "build"], cwd)
}

function historyFilePath(cwd: string) {
  return path.join(cwd, "storage", "logs", "system-update.log")
}

function readHistoryEntries(cwd: string): SystemUpdateHistoryEntry[] {
  const filePath = historyFilePath(cwd)

  if (!existsSync(filePath)) {
    return []
  }

  return readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as SystemUpdateHistoryEntry)
}

function appendHistoryEntry(cwd: string, entry: SystemUpdateHistoryEntry) {
  const filePath = historyFilePath(cwd)
  mkdirSync(path.dirname(filePath), { recursive: true })
  appendFileSync(filePath, `${JSON.stringify(entry)}\n`, "utf8")
}

function resolvePreflight(cwd: string, gitVersionResult: CommandResult, npmVersionResult: CommandResult) {
  let repoWritable = true

  try {
    accessSync(cwd, constants.W_OK)
  } catch {
    repoWritable = false
  }

  const issues = [
    ...(gitVersionResult.ok ? [] : ["Git is not available on the server."]),
    ...(npmVersionResult.ok ? [] : ["NPM is not available on the server."]),
    ...(repoWritable ? [] : ["Repository path is not writable by the running process."]),
  ]

  return {
    gitAvailable: gitVersionResult.ok,
    npmAvailable: npmVersionResult.ok,
    repoWritable,
    issues,
  }
}

async function resolveGitStatus(
  cwd: string,
  commandRunner: CommandRunner
): Promise<SystemUpdateStatus> {
  const gitVersionResult = await commandRunner("git", ["--version"], cwd, true)
  const npmVersionResult = await commandRunner(npmCommand(), ["--version"], cwd, true)
  const preflight = resolvePreflight(cwd, gitVersionResult, npmVersionResult)

  if (!preflight.gitAvailable) {
    return systemUpdateStatusSchema.parse({
      rootPath: cwd,
      branch: "(unavailable)",
      upstream: null,
      currentCommit: "(unavailable)",
      remoteCommit: null,
      isClean: false,
      hasRemoteUpdate: false,
      canAutoUpdate: false,
      canForceReset: false,
      localChanges: [],
      preflight,
    })
  }

  const branch = trimTrailing(
    (await commandRunner("git", ["rev-parse", "--abbrev-ref", "HEAD"], cwd)).stdout
  )
  const currentCommit = trimTrailing(
    (await commandRunner("git", ["rev-parse", "HEAD"], cwd)).stdout
  )
  const statusRaw = (
    await commandRunner("git", ["status", "--porcelain"], cwd, true)
  ).stdout
  const localChanges = parseChanges(statusRaw)
  const upstreamResult = await commandRunner(
    "git",
    ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"],
    cwd,
    true
  )
  const upstream = upstreamResult.ok ? trimTrailing(upstreamResult.stdout) : null

  let remoteCommit: string | null = null

  if (upstream) {
    await commandRunner("git", ["fetch", "--prune", "--quiet"], cwd, true)
    const remoteCommitResult = await commandRunner("git", ["rev-parse", upstream], cwd, true)
    remoteCommit = remoteCommitResult.ok ? trimTrailing(remoteCommitResult.stdout) : null
  }

  return systemUpdateStatusSchema.parse({
    rootPath: cwd,
    branch,
    upstream,
    currentCommit,
    remoteCommit,
    isClean: localChanges.length === 0,
    hasRemoteUpdate: Boolean(remoteCommit && remoteCommit !== currentCommit),
    canAutoUpdate:
      localChanges.length === 0 &&
      Boolean(upstream) &&
      preflight.gitAvailable &&
      preflight.npmAvailable &&
      preflight.repoWritable,
    canForceReset: preflight.gitAvailable && preflight.npmAvailable && preflight.repoWritable,
    localChanges,
    preflight,
  })
}

export async function getSystemUpdateStatus(
  config: ServerConfig,
  commandRunner: CommandRunner = runCommand
): Promise<SystemUpdateStatus> {
  return resolveGitStatus(resolveRuntimeSettingsRoot(config), commandRunner)
}

export function listSystemUpdateHistory(config: ServerConfig): SystemUpdateHistory {
  const cwd = resolveRuntimeSettingsRoot(config)

  return systemUpdateHistorySchema.parse({
    items: readHistoryEntries(cwd).slice(-20).reverse(),
  })
}

export async function runSystemUpdate(
  config: ServerConfig,
  commandRunner: CommandRunner = runCommand,
  actor: string | null = null
): Promise<SystemUpdateRunResponse> {
  const cwd = resolveRuntimeSettingsRoot(config)
  const before = await resolveGitStatus(cwd, commandRunner)

  if (!before.isClean) {
    appendHistoryEntry(cwd, {
      timestamp: new Date().toISOString(),
      action: "update",
      result: "blocked",
      message:
        "Automatic update was blocked because the server had local git changes.",
      previousCommit: before.currentCommit,
      currentCommit: before.currentCommit,
      actor,
    })
    throw new ApplicationError(
      "Automatic update is blocked because the server has local git changes. Use manual git update instead.",
      { localChanges: before.localChanges },
      409
    )
  }

  if (!before.upstream) {
    appendHistoryEntry(cwd, {
      timestamp: new Date().toISOString(),
      action: "update",
      result: "blocked",
      message:
        "Automatic update was blocked because the branch has no upstream tracking branch.",
      previousCommit: before.currentCommit,
      currentCommit: before.currentCommit,
      actor,
    })
    throw new ApplicationError(
      "Automatic update is blocked because this branch has no upstream tracking branch.",
      {},
      409
    )
  }

  let rolledBack = false

  try {
    await commandRunner("git", ["fetch", "--prune", "--quiet"], cwd)
    await commandRunner("git", ["reset", "--hard", before.upstream], cwd)
    await commandRunner("git", ["clean", "-fd"], cwd, true)
    await installAndBuild(cwd, commandRunner)
  } catch (error) {
    rolledBack = true

    try {
      await commandRunner("git", ["reset", "--hard", before.currentCommit], cwd)
      await commandRunner("git", ["clean", "-fd"], cwd, true)
      await installAndBuild(cwd, commandRunner)
    } catch {
      // Keep the original update error as the primary signal.
    }

    appendHistoryEntry(cwd, {
      timestamp: new Date().toISOString(),
      action: "update",
      result: "failure",
      message:
        "System update failed and the repository was rolled back to the previous commit.",
      previousCommit: before.currentCommit,
      currentCommit: before.currentCommit,
      actor,
    })

    throw new ApplicationError(
      "System update failed. The repository was rolled back to the previous commit.",
      {
        reason: error instanceof Error ? error.message : "Unknown update error.",
        rolledBack: true,
      },
      500
    )
  }

  const after = await resolveGitStatus(cwd, commandRunner)
  let restartScheduled = config.environment === "development" ? triggerDevelopmentRestart(cwd) : false

  if (!restartScheduled) {
    restartScheduled = true
    scheduleFallbackRestart()
  }

  appendHistoryEntry(cwd, {
    timestamp: new Date().toISOString(),
    action: "update",
    result: "success",
    message:
      before.currentCommit === after.currentCommit
        ? "Update checked latest tracked commit, rebuilt the app, and restarted without changing commit."
        : "Repository updated to the latest tracked commit, rebuilt, and restarted.",
    previousCommit: before.currentCommit,
    currentCommit: after.currentCommit,
    actor,
  })

  return systemUpdateRunResponseSchema.parse({
    updated: before.currentCommit !== after.currentCommit,
    restartScheduled,
    rolledBack,
    currentCommit: after.currentCommit,
    previousCommit: before.currentCommit,
    message:
      before.currentCommit === after.currentCommit
        ? "Repository is already on the latest tracked commit. Build completed and restart was scheduled."
        : "Repository updated to the latest tracked commit. Build completed and restart was scheduled.",
    status: after,
  })
}

export async function resetSystemToLastCommit(
  config: ServerConfig,
  payload: unknown,
  commandRunner: CommandRunner = runCommand,
  actor: string | null = null
): Promise<SystemUpdateRunResponse> {
  const parsedPayload = systemUpdateResetPayloadSchema.parse(payload) as SystemUpdateResetPayload
  const cwd = resolveRuntimeSettingsRoot(config)
  const before = await resolveGitStatus(cwd, commandRunner)

  if (!parsedPayload.force) {
    throw new ApplicationError("Forced reset confirmation is required.", {}, 400)
  }

  try {
    await commandRunner("git", ["reset", "--hard", before.currentCommit], cwd)
    await commandRunner("git", ["clean", "-fd"], cwd)
    await installAndBuild(cwd, commandRunner)
  } catch (error) {
    appendHistoryEntry(cwd, {
      timestamp: new Date().toISOString(),
      action: "reset",
      result: "failure",
      message:
        "Forced reset failed before the application could be rebuilt cleanly.",
      previousCommit: before.currentCommit,
      currentCommit: before.currentCommit,
      actor,
    })
    throw new ApplicationError(
      "Forced reset failed. Review the server repository manually before retrying.",
      {
        reason: error instanceof Error ? error.message : "Unknown reset error.",
      },
      500
    )
  }

  const after = await resolveGitStatus(cwd, commandRunner)
  let restartScheduled = config.environment === "development" ? triggerDevelopmentRestart(cwd) : false

  if (!restartScheduled) {
    restartScheduled = true
    scheduleFallbackRestart()
  }

  appendHistoryEntry(cwd, {
    timestamp: new Date().toISOString(),
    action: "reset",
    result: "success",
    message:
      "Local changes were discarded, the repository was reset to the current commit, rebuilt, and restarted.",
    previousCommit: before.currentCommit,
    currentCommit: after.currentCommit,
    actor,
  })

  return systemUpdateRunResponseSchema.parse({
    updated: false,
    restartScheduled,
    rolledBack: false,
    currentCommit: after.currentCommit,
    previousCommit: before.currentCommit,
    message:
      "Local changes were discarded, the repository was reset to the current commit, build completed, and restart was scheduled.",
    status: after,
  })
}
