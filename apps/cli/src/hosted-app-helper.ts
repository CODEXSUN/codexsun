import { pathToFileURL } from "node:url"

import { getServerConfig } from "../../framework/src/runtime/config/index.js"
import {
  getHostedAppsStatus,
  runHostedAppsCleanSoftwareUpdate,
} from "../../framework/src/runtime/operations/hosted-apps-service.js"

type HostedAppCommand = "status" | "update-clean"

function resolveCommand(value: string | undefined): HostedAppCommand | null {
  switch (value) {
    case undefined:
    case "status":
    case "update-clean":
      return value ?? "status"
    default:
      return null
  }
}

function printUsage() {
  console.info("Usage: tsx apps/cli/src/hosted-app-helper.ts [status|update-clean]")
}

function formatStatusLabel(dockerState: string, healthState: string) {
  if (healthState === "live") {
    return "LIVE"
  }

  if (healthState === "starting") {
    return "STARTING"
  }

  if (dockerState === "missing") {
    return "MISSING"
  }

  if (healthState === "failed") {
    return "FAILED"
  }

  return "DOWN"
}

export async function runHostedAppHelper(
  cwd = process.cwd(),
  args = process.argv.slice(2)
) {
  const command = resolveCommand(args[0])

  if (!command) {
    printUsage()
    process.exitCode = 1
    return
  }

  const config = getServerConfig(cwd)

  if (command === "update-clean") {
    const response = await runHostedAppsCleanSoftwareUpdate(config, {
      actor: "cli",
    })

    console.info(`[${response.mode}] ${response.message}`)

    if (response.currentCommit) {
      console.info(`Current commit: ${response.currentCommit}`)
    }

    if (response.previousCommit) {
      console.info(`Previous commit: ${response.previousCommit}`)
    }

    if (response.clearedPaths.length > 0) {
      console.info(`Cleared paths: ${response.clearedPaths.join(", ")}`)
    }

    console.info(`Restart scheduled: ${response.restartScheduled ? "yes" : "no"}`)
    return
  }

  const response = await getHostedAppsStatus(config)

  console.info(
    `Hosted apps: ${response.summary.total} total, ${response.summary.live} live, ${response.summary.starting} starting, ${response.summary.down} down, ${response.summary.missing} missing`
  )
  console.info(`Software update mode: ${response.softwareUpdateMode}`)

  if (response.issues.length > 0) {
    console.info(`Issues: ${response.issues.join(" | ")}`)
  }

  for (const item of response.items) {
    console.info(
      [
        `${item.displayName} [${formatStatusLabel(item.dockerState, item.healthState)}]`,
        `container=${item.containerName}`,
        `port=${item.hostPort ?? item.configuredPublicPort ?? "n/a"}`,
        `url=${item.liveUrl ?? "n/a"}`,
        item.healthMessage ? `detail=${item.healthMessage}` : null,
      ]
        .filter(Boolean)
        .join(" | ")
    )
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void runHostedAppHelper()
}
