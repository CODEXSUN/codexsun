import assert from "node:assert/strict"
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import { runDeveloperOperation } from "../../apps/framework/src/runtime/operations/developer-operations-service.js"

test("developer operations clear node and application caches without restart", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-developer-clear-cache-"))
  const commandCalls: Array<{ command: string; args: string[]; cwd: string }> = []

  try {
    mkdirSync(path.join(tempRoot, "build"), { recursive: true })
    mkdirSync(path.join(tempRoot, "dist"), { recursive: true })
    mkdirSync(path.join(tempRoot, "dist-ssr"), { recursive: true })
    mkdirSync(path.join(tempRoot, "node_modules/.vite"), { recursive: true })
    writeFileSync(path.join(tempRoot, "build", "marker.txt"), "build", "utf8")
    writeFileSync(path.join(tempRoot, "dist", "marker.txt"), "dist", "utf8")
    writeFileSync(path.join(tempRoot, "dist-ssr", "marker.txt"), "dist-ssr", "utf8")
    writeFileSync(path.join(tempRoot, "node_modules/.vite", "marker.txt"), "vite", "utf8")

    const config = getServerConfig(tempRoot)

    const response = await runDeveloperOperation(
      config,
      { action: "clear_caches" },
      async (command, args, cwd) => {
        commandCalls.push({ command, args, cwd })
        return {
          ok: true,
          stdout: "",
          stderr: "",
        }
      }
    )

    assert.equal(response.completed, true)
    assert.equal(response.restartScheduled, false)
    assert.deepEqual(response.clearedPaths, [
      "build",
      "dist",
      "dist-ssr",
      "node_modules/.vite",
    ])
    assert.equal(existsSync(path.join(tempRoot, "build")), false)
    assert.equal(existsSync(path.join(tempRoot, "dist")), false)
    assert.equal(existsSync(path.join(tempRoot, "dist-ssr")), false)
    assert.equal(existsSync(path.join(tempRoot, "node_modules/.vite")), false)
    assert.deepEqual(commandCalls.map((item) => item.args), [["cache", "clean", "--force"]])
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("developer operations build frontend and schedule restart in development", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-developer-build-frontend-"))
  const commandCalls: Array<{ command: string; args: string[]; cwd: string }> = []

  try {
    mkdirSync(path.join(tempRoot, "apps/cxapp/src/server"), { recursive: true })
    writeFileSync(
      path.join(tempRoot, "apps/cxapp/src/server/restart-token.ts"),
      'export const runtimeRestartToken = "before"\n',
      "utf8"
    )

    const config = getServerConfig(tempRoot)

    const response = await runDeveloperOperation(
      config,
      { action: "build_frontend" },
      async (command, args, cwd) => {
        commandCalls.push({ command, args, cwd })
        return {
          ok: true,
          stdout: "",
          stderr: "",
        }
      }
    )

    assert.equal(response.completed, true)
    assert.equal(response.restartScheduled, true)
    assert.deepEqual(commandCalls.map((item) => item.args), [["run", "build"]])
    assert.doesNotMatch(
      readFileSync(path.join(tempRoot, "apps/cxapp/src/server/restart-token.ts"), "utf8"),
      /"before"/
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("developer operations force clean rebuild clears caches, reinstalls, rebuilds, and schedules restart", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-developer-force-rebuild-"))
  const commandCalls: Array<{ command: string; args: string[]; cwd: string }> = []

  try {
    mkdirSync(path.join(tempRoot, "apps/cxapp/src/server"), { recursive: true })
    mkdirSync(path.join(tempRoot, "build"), { recursive: true })
    mkdirSync(path.join(tempRoot, "node_modules/.vite"), { recursive: true })
    writeFileSync(
      path.join(tempRoot, "apps/cxapp/src/server/restart-token.ts"),
      'export const runtimeRestartToken = "before"\n',
      "utf8"
    )
    writeFileSync(path.join(tempRoot, "build", "marker.txt"), "build", "utf8")
    writeFileSync(path.join(tempRoot, "node_modules/.vite", "marker.txt"), "vite", "utf8")

    const config = getServerConfig(tempRoot)

    const response = await runDeveloperOperation(
      config,
      { action: "force_clean_rebuild" },
      async (command, args, cwd) => {
        commandCalls.push({ command, args, cwd })
        return {
          ok: true,
          stdout: "",
          stderr: "",
        }
      }
    )

    assert.equal(response.completed, true)
    assert.equal(response.restartScheduled, true)
    assert.deepEqual(commandCalls.map((item) => item.args), [
      ["cache", "clean", "--force"],
      ["ci"],
      ["run", "build"],
    ])
    assert.equal(existsSync(path.join(tempRoot, "build")), false)
    assert.equal(existsSync(path.join(tempRoot, "node_modules/.vite")), false)
    assert.doesNotMatch(
      readFileSync(path.join(tempRoot, "apps/cxapp/src/server/restart-token.ts"), "utf8"),
      /"before"/
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
