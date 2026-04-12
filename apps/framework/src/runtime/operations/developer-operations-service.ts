import { execFile } from "node:child_process"
import { rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { promisify } from "node:util"

import {
  developerOperationPayloadSchema,
  developerOperationResponseSchema,
  type DeveloperOperationResponse,
} from "../../../shared/developer-operations.js"
import { ApplicationError } from "../errors/application-error.js"
import { resolveRuntimeSettingsRoot } from "../config/runtime-settings-service.js"
import { scheduleFallbackRestart, triggerDevelopmentRestart } from "../config/runtime-restart.js"
import type { ServerConfig } from "../config/server-config.js"

const execFileAsync = promisify(execFile)
const applicationCachePaths = [
  "build",
  "dist",
  "dist-ssr",
  path.join("node_modules", ".vite"),
] as const

type CommandResult = {
  ok: boolean
  stdout: string
  stderr: string
}

export type DeveloperCommandRunner = (
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

function npmCommand() {
  return os.platform() === "win32" ? "npm.cmd" : "npm"
}

function clearApplicationCaches(cwd: string) {
  for (const relativePath of applicationCachePaths) {
    rmSync(path.join(cwd, relativePath), {
      force: true,
      recursive: true,
    })
  }

  return applicationCachePaths.map((entry) => entry.replace(/\\/g, "/"))
}

async function clearNodeCache(
  cwd: string,
  commandRunner: DeveloperCommandRunner
) {
  await commandRunner(npmCommand(), ["cache", "clean", "--force"], cwd)
}

async function scheduleRuntimeRestart(config: ServerConfig, cwd: string) {
  let restartScheduled =
    config.environment === "development" ? triggerDevelopmentRestart(cwd) : false

  if (!restartScheduled) {
    restartScheduled = true
    scheduleFallbackRestart()
  }

  return restartScheduled
}

export async function runDeveloperOperation(
  config: ServerConfig,
  payload: unknown,
  commandRunner: DeveloperCommandRunner = runCommand
): Promise<DeveloperOperationResponse> {
  const parsedPayload = developerOperationPayloadSchema.parse(payload)
  const cwd = resolveRuntimeSettingsRoot(config)
  let clearedPaths: string[] = []
  let restartScheduled = false

  try {
    switch (parsedPayload.action) {
      case "clear_caches":
        clearedPaths = clearApplicationCaches(cwd)
        await clearNodeCache(cwd, commandRunner)
        break
      case "build_frontend":
        await commandRunner(npmCommand(), ["run", "build"], cwd)
        restartScheduled = await scheduleRuntimeRestart(config, cwd)
        break
      case "force_clean_rebuild":
        clearedPaths = clearApplicationCaches(cwd)
        await clearNodeCache(cwd, commandRunner)
        await commandRunner(npmCommand(), ["ci"], cwd)
        await commandRunner(npmCommand(), ["run", "build"], cwd)
        restartScheduled = await scheduleRuntimeRestart(config, cwd)
        break
    }
  } catch (error) {
    throw new ApplicationError(
      "Developer build recovery action failed.",
      {
        action: parsedPayload.action,
        reason: error instanceof Error ? error.message : "Unknown developer operation error.",
      },
      500
    )
  }

  const message =
    parsedPayload.action === "clear_caches"
      ? "Node and application caches were cleared. Run a rebuild next if the frontend still looks stale."
      : parsedPayload.action === "build_frontend"
        ? "Frontend build completed and restart was scheduled."
        : "Forced clean rebuild completed and restart was scheduled."

  return developerOperationResponseSchema.parse({
    action: parsedPayload.action,
    completed: true,
    restartScheduled,
    clearedPaths,
    message,
    rootPath: cwd,
  })
}
