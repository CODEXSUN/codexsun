import { pathToFileURL } from "node:url"

import type {
  RemoteGitUpdateResponse,
  RemoteGitUpdateRequest,
} from "../../framework/shared/remote-server-control.js"
import type { RemoteServerSnapshot } from "../../framework/shared/remote-server-status.js"

type RemoteControlCommand = "status" | "git-update"

type CliOptions = {
  command: RemoteControlCommand
  url: string
  secret: string
  overrideDirty: boolean
}

function printUsage() {
  console.info(
    "Usage: tsx apps/cli/src/remote-server-control-helper.ts <status|git-update> --url <server-url> --secret <monitor-secret> [--override-dirty]"
  )
}

function parseArgs(args: string[]): CliOptions | null {
  const [commandRaw, ...rest] = args

  if (commandRaw !== "status" && commandRaw !== "git-update") {
    return null
  }

  let url = ""
  let secret = ""
  let overrideDirty = false

  for (let index = 0; index < rest.length; index += 1) {
    const current = rest[index]

    if (current === "--override-dirty") {
      overrideDirty = true
      continue
    }

    if (current === "--url") {
      url = rest[index + 1] ?? ""
      index += 1
      continue
    }

    if (current === "--secret") {
      secret = rest[index + 1] ?? ""
      index += 1
      continue
    }
  }

  if (!url.trim() || !secret.trim()) {
    return null
  }

  return {
    command: commandRaw,
    url: url.trim().replace(/\/+$/, ""),
    secret: secret.trim(),
    overrideDirty,
  }
}

async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  const payload = (await response.json().catch(() => null)) as
    | { error?: string; message?: string }
    | null

  if (!response.ok) {
    throw new Error(
      payload?.error ?? payload?.message ?? `Request failed with status ${response.status}.`
    )
  }

  return payload as T
}

function formatStatus(snapshot: RemoteServerSnapshot) {
  console.info(`App: ${snapshot.appName}`)
  console.info(`Version: ${snapshot.appVersion ?? "n/a"}`)
  console.info(`Environment: ${snapshot.environment}`)
  console.info(`Branch: ${snapshot.gitBranch ?? "n/a"}`)
  console.info(`Git status: ${snapshot.gitStatus ?? "n/a"}`)
  console.info(`Latest update: ${snapshot.latestUpdateMessage ?? "n/a"}`)
  console.info(`Latest update time: ${snapshot.latestUpdateTimestamp ?? "n/a"}`)
  console.info(`Has remote update: ${snapshot.hasRemoteUpdate ? "yes" : "no"}`)
}

function formatGitUpdate(response: RemoteGitUpdateResponse) {
  console.info(`Mode: ${response.mode}`)
  console.info(`Override dirty: ${response.overrideDirty ? "yes" : "no"}`)
  console.info(`Updated: ${response.update.updated ? "yes" : "no"}`)
  console.info(`Restart scheduled: ${response.update.restartScheduled ? "yes" : "no"}`)
  console.info(`Message: ${response.update.message}`)
  console.info(`Current commit: ${response.update.currentCommit}`)
  console.info(`Previous commit: ${response.update.previousCommit}`)
}

export async function runRemoteServerControlHelper(
  args = process.argv.slice(2)
) {
  const options = parseArgs(args)

  if (!options) {
    printUsage()
    process.exitCode = 1
    return
  }

  if (options.command === "status") {
    const response = await requestJson<RemoteServerSnapshot>(
      `${options.url}/api/v1/framework/server-status`,
      {
        method: "GET",
        headers: {
          "x-codexsun-monitor-key": options.secret,
        },
      }
    )

    formatStatus(response)
    return
  }

  const response = await requestJson<RemoteGitUpdateResponse>(
    `${options.url}/api/v1/framework/server-control/git-update`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-codexsun-monitor-key": options.secret,
      },
      body: JSON.stringify({
        overrideDirty: options.overrideDirty,
      } satisfies RemoteGitUpdateRequest),
    }
  )

  formatGitUpdate(response)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void runRemoteServerControlHelper()
}
