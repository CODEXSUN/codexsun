import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import { ApplicationError } from "../../apps/framework/src/runtime/errors/application-error.js"
import { runRemoteControlledGitUpdate } from "../../apps/framework/src/runtime/operations/remote-server-control-service.js"

test("remote git update blocks dirty worktrees unless overrideDirty is enabled", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-remote-control-"))

  try {
    const config = getServerConfig(tempRoot)

    await assert.rejects(
      () =>
        runRemoteControlledGitUpdate(
          config,
          {
            overrideDirty: false,
          },
          {
            getStatus: async () => ({
              rootPath: tempRoot,
              branch: "main",
              upstream: "origin/main",
              currentCommit: "abc123",
              currentRevision: null,
              remoteCommit: "def456",
              isClean: false,
              hasRemoteUpdate: true,
              canAutoUpdate: true,
              canForceReset: true,
              localChanges: [" M apps/framework/src/runtime/system-update/system-update-service.ts"],
              preflight: {
                gitAvailable: true,
                npmAvailable: true,
                repoWritable: true,
                issues: [],
              },
            }),
            runUpdate: async () => {
              throw new Error("runUpdate should not be called when dirty override is disabled")
            },
          }
        ),
      (error: unknown) =>
        error instanceof ApplicationError &&
        error.statusCode === 409 &&
        error.message.includes("dirty")
    )
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})

test("remote git update runs one-way update with overrideDirty when requested", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-remote-control-"))

  try {
    const config = getServerConfig(tempRoot)
    let called = false

    const response = await runRemoteControlledGitUpdate(
      config,
      {
        overrideDirty: true,
      },
      {
        getStatus: async () => ({
          rootPath: tempRoot,
          branch: "main",
          upstream: "origin/main",
          currentCommit: "abc123",
          currentRevision: null,
          remoteCommit: "def456",
          isClean: false,
          hasRemoteUpdate: true,
          canAutoUpdate: true,
          canForceReset: true,
          localChanges: [" M package.json"],
          preflight: {
            gitAvailable: true,
            npmAvailable: true,
            repoWritable: true,
            issues: [],
          },
        }),
        runUpdate: async () => {
          called = true

          return {
            updated: true,
            restartScheduled: true,
            rolledBack: false,
            currentCommit: "def456",
            previousCommit: "abc123",
            message: "Runtime repository updated from the configured branch.",
            status: {
              rootPath: tempRoot,
              branch: "main",
              upstream: "origin/main",
              currentCommit: "def456",
              currentRevision: null,
              remoteCommit: "def456",
              isClean: true,
              hasRemoteUpdate: false,
              canAutoUpdate: true,
              canForceReset: true,
              localChanges: [],
              preflight: {
                gitAvailable: true,
                npmAvailable: true,
                repoWritable: true,
                issues: [],
              },
            },
          }
        },
      }
    )

    assert.equal(called, true)
    assert.equal(response.mode, "override_dirty_update")
    assert.equal(response.overrideDirty, true)
    assert.equal(response.update.updated, true)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
