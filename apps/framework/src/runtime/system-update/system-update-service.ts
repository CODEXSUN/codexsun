import { execFile } from "node:child_process"
import { accessSync, appendFileSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs"
import { constants } from "node:fs"
import os from "node:os"
import path from "node:path"
import { promisify } from "node:util"

import {
  buildRuntimeGitCommandPlan,
  parseRemoteHeadCommit,
  resolveRuntimeGitSyncTarget,
  type RuntimeGitSyncTarget,
} from "../../../../cli/src/system-update-helper.js"
import {
  systemUpdateHistorySchema,
  type SystemUpdateCommitDetails,
  systemUpdatePreviewSchema,
  systemUpdateResetPayloadSchema,
  systemUpdateRunResponseSchema,
  systemUpdateStatusSchema,
  type SystemUpdateHistory,
  type SystemUpdateHistoryEntry,
  type SystemUpdatePreview,
  type SystemUpdateResetPayload,
  type SystemUpdateRunResponse,
  type SystemUpdateStatus,
} from "../../../shared/system-update.js"
import { parseEnvFile } from "../config/env.js"
import { resolveRuntimeSettingsRoot } from "../config/runtime-settings-service.js"
import { scheduleFallbackRestart, triggerDevelopmentRestart } from "../config/runtime-restart.js"
import type { ServerConfig } from "../config/server-config.js"
import { ApplicationError } from "../errors/application-error.js"
import type { RuntimeScheduledTask } from "../jobs/interval-task-scheduler.js"

const execFileAsync = promisify(execFile)
const schedulerActor = "system:scheduler"
const defaultScheduledUpdateCadenceMinutes = 30

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

function parseBooleanEnvValue(value: string | undefined, fallback = false) {
  if (!value) {
    return fallback
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase())
}

function parsePositiveIntegerEnvValue(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value.trim(), 10)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

function parseFirstLine(value: string) {
  const line = value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .find(Boolean)

  return line ?? null
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

function withPreflightIssue(
  preflight: ReturnType<typeof resolvePreflight>,
  issue: string
) {
  return {
    ...preflight,
    issues: preflight.issues.includes(issue) ? preflight.issues : [...preflight.issues, issue],
  }
}

function resolveRuntimeGitTarget(cwd: string) {
  const env = parseEnvFile(path.join(cwd, ".env"))

  return resolveRuntimeGitSyncTarget(env.GIT_REPOSITORY_URL, env.GIT_BRANCH)
}

function readScheduledUpdateSettings(cwd: string) {
  const env = parseEnvFile(path.join(cwd, ".env"))

  return {
    enabled: parseBooleanEnvValue(env.GIT_SCHEDULED_UPDATE_ENABLED, false),
    cadenceMinutes: parsePositiveIntegerEnvValue(
      env.GIT_SCHEDULED_UPDATE_CADENCE_MINUTES,
      defaultScheduledUpdateCadenceMinutes
    ),
    autoApply: parseBooleanEnvValue(env.GIT_SCHEDULED_UPDATE_AUTO_APPLY, false),
  }
}

function resolveSystemUpdateRoot(cwd: string) {
  const env = parseEnvFile(path.join(cwd, ".env"))

  if (env.GIT_SYNC_ENABLED === "true") {
    const candidateRoots = [
      path.resolve(cwd, "..", "runtime", "repository"),
      path.join(cwd, "runtime", "repository"),
    ]

    for (const candidateRoot of candidateRoots) {
      if (existsSync(path.join(candidateRoot, ".git"))) {
        return candidateRoot
      }
    }
  }

  return cwd
}

function readPackageVersionFromContent(content: string) {
  try {
    const parsed = JSON.parse(content) as { version?: unknown }

    return typeof parsed.version === "string" && parsed.version.trim() ? parsed.version.trim() : null
  } catch {
    return null
  }
}

async function resolveCommitDetails(
  cwd: string,
  commit: string | null,
  commandRunner: CommandRunner
): Promise<SystemUpdateCommitDetails | null> {
  if (!commit || commit === "(unavailable)") {
    return null
  }

  const summaryResult = await commandRunner(
    "git",
    ["show", "-s", "--format=%s%x1f%cI", commit],
    cwd,
    true
  )

  if (!summaryResult.ok) {
    return null
  }

  const [summary = "", committedAt = ""] = trimTrailing(summaryResult.stdout).split("\u001f")

  if (!summary || !committedAt) {
    return null
  }

  const tagResult = await commandRunner("git", ["tag", "--points-at", commit], cwd, true)
  const packageResult = await commandRunner("git", ["show", `${commit}:package.json`], cwd, true)

  return {
    summary,
    committedAt,
    tag: tagResult.ok ? parseFirstLine(tagResult.stdout) : null,
    version: packageResult.ok ? readPackageVersionFromContent(packageResult.stdout) : null,
  }
}

async function ensureRuntimeGitRemote(
  cwd: string,
  target: RuntimeGitSyncTarget,
  commandRunner: CommandRunner
) {
  const currentRemoteResult = await commandRunner(
    "git",
    ["remote", "get-url", target.remoteName],
    cwd,
    true
  )

  if (!currentRemoteResult.ok) {
    await commandRunner("git", ["remote", "add", target.remoteName, target.repositoryUrl], cwd)
    return
  }

  if (trimTrailing(currentRemoteResult.stdout) !== target.repositoryUrl) {
    await commandRunner(
      "git",
      ["remote", "set-url", target.remoteName, target.repositoryUrl],
      cwd
    )
  }
}

async function checkRepositoryAvailability(cwd: string, commandRunner: CommandRunner) {
  const result = await commandRunner("git", ["rev-parse", "--is-inside-work-tree"], cwd, true)

  return result.ok && trimTrailing(result.stdout) === "true"
}

async function resolveGitStatus(
  cwd: string,
  commandRunner: CommandRunner
): Promise<SystemUpdateStatus> {
  const gitVersionResult = await commandRunner("git", ["--version"], cwd, true)
  const npmVersionResult = await commandRunner(npmCommand(), ["--version"], cwd, true)
  const preflight = resolvePreflight(cwd, gitVersionResult, npmVersionResult)
  const repositoryAvailable =
    preflight.gitAvailable && (await checkRepositoryAvailability(cwd, commandRunner))

  if (!preflight.gitAvailable || !repositoryAvailable) {
    const resolvedPreflight = !repositoryAvailable
      ? withPreflightIssue(
          preflight,
          "Runtime git sync is not active for this deployment. Enable GIT_SYNC_ENABLED to use live update."
        )
      : preflight

    return systemUpdateStatusSchema.parse({
      rootPath: cwd,
      branch: "(unavailable)",
      upstream: null,
      currentCommit: "(unavailable)",
      currentRevision: null,
      remoteCommit: null,
      isClean: false,
      hasRemoteUpdate: false,
      canAutoUpdate: false,
      canForceReset: false,
      localChanges: [],
      preflight: resolvedPreflight,
    })
  }

  const target = resolveRuntimeGitTarget(cwd)
  const branch = trimTrailing(
    (await commandRunner("git", ["rev-parse", "--abbrev-ref", "HEAD"], cwd)).stdout
  )
  const currentCommit = trimTrailing(
    (await commandRunner("git", ["rev-parse", "HEAD"], cwd)).stdout
  )
  const currentRevision = await resolveCommitDetails(cwd, currentCommit, commandRunner)
  const statusRaw = (
    await commandRunner("git", ["status", "--porcelain"], cwd, true)
  ).stdout
  const localChanges = parseChanges(statusRaw)
  const upstream = target.remoteRef
  const remoteCommitResult = await commandRunner(
    "git",
    ["ls-remote", "--heads", target.repositoryUrl, `refs/heads/${target.branch}`],
    cwd,
    true
  )
  const remoteCommit = remoteCommitResult.ok
    ? parseRemoteHeadCommit(remoteCommitResult.stdout)
    : null

  return systemUpdateStatusSchema.parse({
    rootPath: cwd,
    branch,
    upstream,
    currentCommit,
    currentRevision,
    remoteCommit,
    isClean: localChanges.length === 0,
    hasRemoteUpdate: Boolean(remoteCommit && remoteCommit !== currentCommit),
    canAutoUpdate:
      preflight.gitAvailable &&
      preflight.npmAvailable &&
      preflight.repoWritable &&
      Boolean(remoteCommit),
    canForceReset: preflight.gitAvailable && preflight.npmAvailable && preflight.repoWritable,
    localChanges,
    preflight,
  })
}

export async function getSystemUpdateStatus(
  config: ServerConfig,
  commandRunner: CommandRunner = runCommand
): Promise<SystemUpdateStatus> {
  return resolveGitStatus(resolveSystemUpdateRoot(resolveRuntimeSettingsRoot(config)), commandRunner)
}

export async function getSystemUpdatePreview(
  config: ServerConfig,
  commandRunner: CommandRunner = runCommand
): Promise<SystemUpdatePreview> {
  const cwd = resolveSystemUpdateRoot(resolveRuntimeSettingsRoot(config))
  const status = await resolveGitStatus(cwd, commandRunner)

  if (!status.canAutoUpdate || !status.currentCommit || status.currentCommit === "(unavailable)") {
    return systemUpdatePreviewSchema.parse({
      status,
      items: [],
    })
  }

  const target = resolveRuntimeGitTarget(cwd)

  await ensureRuntimeGitRemote(cwd, target, commandRunner)
  await commandRunner("git", ["fetch", "--prune", target.remoteName], cwd)

  if (!status.remoteCommit || status.remoteCommit === status.currentCommit) {
    const refreshedStatus = await resolveGitStatus(cwd, commandRunner)

    return systemUpdatePreviewSchema.parse({
      status: refreshedStatus,
      items: [],
    })
  }

  const logResult = await commandRunner(
    "git",
    [
      "log",
      "--format=%H%x1f%s%x1f%an%x1f%cI",
      `${status.currentCommit}..${target.remoteRef}`,
    ],
    cwd,
    true
  )

  const items = logResult.ok
    ? logResult.stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [commit = "", summary = "", authorName = "", committedAt = ""] = line.split("\u001f")

          return {
            commit,
            summary,
            authorName,
            committedAt,
          }
        })
        .filter((item) => item.commit && item.summary && item.authorName && item.committedAt)
    : []

  const refreshedStatus = await resolveGitStatus(cwd, commandRunner)

  return systemUpdatePreviewSchema.parse({
    status: refreshedStatus,
    items,
  })
}

export async function listSystemUpdateHistory(
  config: ServerConfig,
  commandRunner: CommandRunner = runCommand
): Promise<SystemUpdateHistory> {
  const cwd = resolveSystemUpdateRoot(resolveRuntimeSettingsRoot(config))
  const items = await Promise.all(
    readHistoryEntries(cwd)
      .slice(-20)
      .reverse()
      .map(async (entry) => ({
        ...entry,
        previousRevision: await resolveCommitDetails(cwd, entry.previousCommit, commandRunner),
        currentRevision: await resolveCommitDetails(cwd, entry.currentCommit, commandRunner),
      }))
  )

  return systemUpdateHistorySchema.parse({
    items,
  })
}

export function getScheduledSystemUpdateTasks(
  config: ServerConfig,
  logger: ReturnType<typeof import("../observability/runtime-logger.js").createRuntimeLogger>,
  commandRunner: CommandRunner = runCommand
): RuntimeScheduledTask[] {
  const settingsRoot = resolveRuntimeSettingsRoot(config)
  const scheduledSettings = readScheduledUpdateSettings(settingsRoot)

  if (!scheduledSettings.enabled) {
    return []
  }

  return [
    {
      taskKey: "framework.system-update.scheduled-check",
      cadenceMs: scheduledSettings.cadenceMinutes * 60 * 1000,
      lockTtlMs: Math.max(scheduledSettings.cadenceMinutes * 60 * 1000, 60_000),
      run: async () => {
        await runScheduledSystemUpdateCheck(config, logger, commandRunner)
      },
    },
  ]
}

export async function runScheduledSystemUpdateCheck(
  config: ServerConfig,
  logger: ReturnType<typeof import("../observability/runtime-logger.js").createRuntimeLogger>,
  commandRunner: CommandRunner = runCommand
) {
  const cwd = resolveSystemUpdateRoot(resolveRuntimeSettingsRoot(config))
  let autoApplyStarted = false
  try {
    const scheduledSettings = readScheduledUpdateSettings(resolveRuntimeSettingsRoot(config))
    const status = await resolveGitStatus(cwd, commandRunner)

    if (!status.canAutoUpdate) {
      const failureReason = status.preflight.issues.join(" | ") || null
      appendHistoryEntry(cwd, {
        timestamp: new Date().toISOString(),
        action: "check",
        result: "blocked",
        message:
          "Scheduled update check was blocked because the runtime repository is not ready for one-way git sync.",
        failureReason,
        previousCommit: status.currentCommit,
        previousRevision: null,
        currentCommit: status.currentCommit,
        currentRevision: null,
        actor: schedulerActor,
      })
      logger.warn("system-update.scheduler.blocked", {
        currentCommit: status.currentCommit,
        issues: status.preflight.issues,
      })
      return
    }

    const preview = await getSystemUpdatePreview(config, commandRunner)
    const pendingCommitCount = preview.items.length

    if (pendingCommitCount === 0) {
      appendHistoryEntry(cwd, {
        timestamp: new Date().toISOString(),
        action: "check",
        result: "success",
        message:
          "Scheduled update check found no new commits on the configured runtime branch.",
        failureReason: null,
        previousCommit: preview.status.currentCommit,
        previousRevision: null,
        currentCommit: preview.status.currentCommit,
        currentRevision: null,
        actor: schedulerActor,
      })
      logger.info("system-update.scheduler.no-update", {
        currentCommit: preview.status.currentCommit,
      })
      return
    }

    appendHistoryEntry(cwd, {
      timestamp: new Date().toISOString(),
      action: "check",
      result: "success",
      message: scheduledSettings.autoApply
        ? `Scheduled update check found ${pendingCommitCount} pending commit${pendingCommitCount === 1 ? "" : "s"} and started automatic apply.`
        : `Scheduled update check found ${pendingCommitCount} pending commit${pendingCommitCount === 1 ? "" : "s"}. Automatic apply is disabled.`,
      failureReason: null,
      previousCommit: preview.status.currentCommit,
      previousRevision: null,
      currentCommit: preview.status.remoteCommit ?? preview.status.currentCommit,
      currentRevision: null,
      actor: schedulerActor,
    })

    logger.info("system-update.scheduler.pending", {
      currentCommit: preview.status.currentCommit,
      remoteCommit: preview.status.remoteCommit,
      pendingCommitCount,
      autoApply: scheduledSettings.autoApply,
    })

    if (!scheduledSettings.autoApply) {
      return
    }

    autoApplyStarted = true
    await runSystemUpdate(config, commandRunner, schedulerActor)
  } catch (error) {
    if (autoApplyStarted) {
      throw error
    }

    const failureReason =
      error instanceof Error ? error.message : "Unknown scheduled update check error."
    appendHistoryEntry(cwd, {
      timestamp: new Date().toISOString(),
      action: "check",
      result: "failure",
      message:
        "Scheduled update check failed before the runtime repository could be evaluated cleanly.",
      failureReason,
      previousCommit: null,
      previousRevision: null,
      currentCommit: null,
      currentRevision: null,
      actor: schedulerActor,
    })
    logger.error("system-update.scheduler.failed", {
      error: failureReason,
    })
    throw error
  }
}

export async function runSystemUpdate(
  config: ServerConfig,
  commandRunner: CommandRunner = runCommand,
  actor: string | null = null
): Promise<SystemUpdateRunResponse> {
  const cwd = resolveSystemUpdateRoot(resolveRuntimeSettingsRoot(config))
  const before = await resolveGitStatus(cwd, commandRunner)
  const target = resolveRuntimeGitTarget(cwd)
  const plan = buildRuntimeGitCommandPlan(target)

  if (!before.canAutoUpdate) {
    appendHistoryEntry(cwd, {
      timestamp: new Date().toISOString(),
      action: "update",
      result: "blocked",
      message:
        "System update was blocked because the runtime repository is not ready for one-way git sync.",
      failureReason: before.preflight.issues.join(" | ") || null,
      previousCommit: before.currentCommit,
      previousRevision: null,
      currentCommit: before.currentCommit,
      currentRevision: null,
      actor,
    })
    throw new ApplicationError(
      "System update requires git, npm, a writable repository, and a reachable configured runtime branch.",
      {
        localChanges: before.localChanges,
        issues: before.preflight.issues,
      },
      409
    )
  }

  let rolledBack = false

  try {
    await ensureRuntimeGitRemote(cwd, target, commandRunner)
    await commandRunner("git", plan.fetchArgs, cwd)
    await commandRunner("git", plan.resetToHeadArgs, cwd)
    await commandRunner("git", plan.cleanArgs, cwd, true)
    await commandRunner("git", plan.checkoutArgs, cwd)
    await commandRunner("git", plan.pullArgs, cwd)
    await commandRunner("git", plan.resetToRemoteArgs, cwd)
    await commandRunner("git", plan.cleanArgs, cwd, true)
    await installAndBuild(cwd, commandRunner)
  } catch (error) {
    rolledBack = true
    const failureReason = error instanceof Error ? error.message : "Unknown update error."

    try {
      await commandRunner("git", ["reset", "--hard", before.currentCommit], cwd)
      await commandRunner("git", plan.cleanArgs, cwd, true)
      await installAndBuild(cwd, commandRunner)
    } catch {
      // Keep the original update error as the primary signal.
    }

    appendHistoryEntry(cwd, {
      timestamp: new Date().toISOString(),
      action: "update",
      result: "failure",
      message:
        "System update failed after the runtime repository was resynced. The previous commit was restored.",
      failureReason,
      previousCommit: before.currentCommit,
      previousRevision: null,
      currentCommit: before.currentCommit,
      currentRevision: null,
      actor,
    })

    throw new ApplicationError(
      "System update failed. The previous commit was restored after the runtime sync attempt.",
      {
        reason: failureReason,
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
        ? "One-way runtime sync verified the configured branch, rebuilt the app, and restarted without changing commit."
        : "Runtime repository resynced from the configured branch, rebuilt, and restarted.",
    failureReason: null,
    previousCommit: before.currentCommit,
    previousRevision: null,
    currentCommit: after.currentCommit,
    currentRevision: null,
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
        ? "Configured runtime branch is already current. Clean rebuild completed and restart was scheduled."
        : "Runtime repository updated from the configured branch. Clean rebuild completed and restart was scheduled.",
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
  const cwd = resolveSystemUpdateRoot(resolveRuntimeSettingsRoot(config))
  const before = await resolveGitStatus(cwd, commandRunner)

  if (!parsedPayload.force) {
    throw new ApplicationError("Forced reset confirmation is required.", {}, 400)
  }

  try {
    await commandRunner("git", ["reset", "--hard", before.currentCommit], cwd)
    await commandRunner("git", ["clean", "-fd"], cwd)
    await installAndBuild(cwd, commandRunner)
  } catch (error) {
    const failureReason = error instanceof Error ? error.message : "Unknown reset error."
    appendHistoryEntry(cwd, {
      timestamp: new Date().toISOString(),
      action: "reset",
      result: "failure",
      message:
        "Forced reset failed before the application could be rebuilt cleanly.",
      failureReason,
      previousCommit: before.currentCommit,
      previousRevision: null,
      currentCommit: before.currentCommit,
      currentRevision: null,
      actor,
    })
    throw new ApplicationError(
      "Forced reset failed. Review the server repository manually before retrying.",
      {
        reason: failureReason,
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
    failureReason: null,
    previousCommit: before.currentCommit,
    previousRevision: null,
    currentCommit: after.currentCommit,
    currentRevision: null,
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
