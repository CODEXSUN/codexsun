import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { setTimeout as delay } from "node:timers/promises"

import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import {
  getHostedAppsStatus,
  runHostedAppsCleanSoftwareUpdate,
} from "../../apps/framework/src/runtime/operations/hosted-apps-service.js"

function createTempClient(root: string, clientId: string, lines: string[]) {
  const clientRoot = path.join(root, ".container", "clients", clientId)
  mkdirSync(clientRoot, { recursive: true })
  writeFileSync(path.join(clientRoot, "client.conf.sh"), `${lines.join("\n")}\n`, "utf8")
}

test("hosted apps status reports live and starting Docker-managed client apps", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-hosted-apps-"))

  try {
    createTempClient(tempRoot, "codexsun", [
      'CLIENT_ID="codexsun"',
      'CLIENT_DISPLAY_NAME="Codexsun"',
      'CLIENT_CONTAINER="codexsun-app"',
      'CLIENT_DOMAIN_LOCAL="127.0.0.1"',
      'CLIENT_DOMAIN_CLOUD="codexsun.com"',
      'CLIENT_APP_HTTP_HOST_PORT_LOCAL="4000"',
    ])
    createTempClient(tempRoot, "techmedia_in", [
      'CLIENT_ID="techmedia_in"',
      'CLIENT_DISPLAY_NAME="Techmedia"',
      'CLIENT_CONTAINER="techmedia-in-app"',
      'CLIENT_DOMAIN_LOCAL="127.0.0.1"',
      'CLIENT_DOMAIN_CLOUD="techmedia.in"',
      'CLIENT_APP_HTTP_HOST_PORT_LOCAL="4008"',
    ])

    const config = getServerConfig(tempRoot)
    const commandRunner = async (
      command: string,
      args: string[],
      _cwd: string,
      allowFailure = false
    ) => {
      const key = `${command} ${args.join(" ")}`

      if (key === "docker version --format {{.Server.Version}}") {
        return {
          ok: true,
          stdout: "29.3.1\n",
          stderr: "",
        }
      }

      if (key === "docker inspect codexsun-app") {
        return {
          ok: true,
          stdout: JSON.stringify([
            {
              State: {
                Running: true,
                StartedAt: "2026-04-12T18:00:00.000Z",
              },
              Config: {
                Image: "codexsun-app:v1",
              },
              HostConfig: {
                PortBindings: {
                  "4000/tcp": [{ HostPort: "4000" }],
                },
              },
            },
          ]),
          stderr: "",
        }
      }

      if (key === "docker inspect techmedia-in-app") {
        return {
          ok: true,
          stdout: JSON.stringify([
            {
              State: {
                Running: true,
                StartedAt: "2026-04-12T18:01:00.000Z",
              },
              Config: {
                Image: "codexsun-app:v1",
              },
              HostConfig: {
                PortBindings: {
                  "4000/tcp": [{ HostPort: "4008" }],
                },
              },
            },
          ]),
          stderr: "",
        }
      }

      if (key === "git --version" || key === "npm.cmd --version" || key === "npm --version") {
        return {
          ok: false,
          stdout: "",
          stderr: allowFailure ? "not available" : "",
        }
      }

      if (key === "git rev-parse --is-inside-work-tree") {
        return {
          ok: false,
          stdout: "",
          stderr: "not a git repository",
        }
      }

      throw new Error(`Unexpected hosted-app command: ${key}`)
    }

    const fetcher = async (input: string) => {
      if (input === "http://127.0.0.1:4000/health") {
        return new Response(
          JSON.stringify({
            status: "ok",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          }
        )
      }

      if (input === "http://127.0.0.1:4008/health") {
        return new Response(
          JSON.stringify({
            status: "starting_up",
            detail: "Applying migrations.",
          }),
          {
            status: 503,
            headers: { "content-type": "application/json" },
          }
        )
      }

      throw new Error(`Unexpected hosted-app fetch: ${input}`)
    }

    const response = await getHostedAppsStatus(config, {
      commandRunner,
      fetcher,
    })

    assert.equal(response.dockerAvailable, true)
    assert.equal(response.softwareUpdateMode, "clean_rebuild")
    assert.equal(response.summary.total, 2)
    assert.equal(response.summary.live, 1)
    assert.equal(response.summary.starting, 1)
    assert.equal(response.items[0]?.healthState, "live")
    assert.equal(response.items[1]?.healthState, "starting")
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("hosted apps clean software update falls back to clean rebuild when git sync is unavailable", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-hosted-update-"))
  const originalKill = process.kill
  let killCalls = 0

  try {
    writeFileSync(path.join(tempRoot, "package.json"), JSON.stringify({ name: "codexsun", version: "0.0.1" }), "utf8")
    process.kill = (() => {
      killCalls += 1
      return true
    }) as typeof process.kill

    const config = getServerConfig(tempRoot)
    const executed: string[] = []
    const commandRunner = async (
      command: string,
      args: string[],
      _cwd: string,
      allowFailure = false
    ) => {
      const key = `${command} ${args.join(" ")}`
      executed.push(key)

      if (key === "git --version" || key === "git rev-parse --is-inside-work-tree") {
        return {
          ok: false,
          stdout: "",
          stderr: allowFailure ? "git unavailable" : "",
        }
      }

      if (key === "npm.cmd --version" || key === "npm --version") {
        return {
          ok: true,
          stdout: "10.9.0\n",
          stderr: "",
        }
      }

      if (key === "npm.cmd cache clean --force" || key === "npm cache clean --force") {
        return {
          ok: true,
          stdout: "",
          stderr: "",
        }
      }

      if (key === "npm.cmd ci" || key === "npm ci" || key === "npm.cmd run build" || key === "npm run build") {
        return {
          ok: true,
          stdout: "",
          stderr: "",
        }
      }

      throw new Error(`Unexpected clean-update command: ${key}`)
    }

    const response = await runHostedAppsCleanSoftwareUpdate(config, {
      commandRunner,
      actor: "test",
    })

    assert.equal(response.mode, "clean_rebuild")
    assert.equal(response.restartScheduled, true)
    assert.equal(response.status, null)
    await delay(300)
    assert.equal(killCalls, 1)
    assert.ok(
      executed.some((entry) => entry === "npm.cmd ci" || entry === "npm ci")
    )
  } finally {
    process.kill = originalKill
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
