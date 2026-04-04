import { existsSync, writeFileSync } from "node:fs"
import path from "node:path"
import { setTimeout as delay } from "node:timers/promises"

export function sourceRestartTokenPath(cwd = process.cwd()) {
  return path.resolve(cwd, "apps/cxapp/src/server/restart-token.ts")
}

export function triggerDevelopmentRestart(cwd = process.cwd()) {
  const restartTokenFile = sourceRestartTokenPath(cwd)

  if (!existsSync(restartTokenFile)) {
    return false
  }

  writeFileSync(
    restartTokenFile,
    `export const runtimeRestartToken = ${JSON.stringify(new Date().toISOString())}\n`,
    "utf8"
  )

  return true
}

export function scheduleFallbackRestart() {
  void delay(250).then(() => {
    process.kill(process.pid, "SIGTERM")
  })
}

