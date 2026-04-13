import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import {
  createApplicationVersion,
  syncVersionFiles,
} from "../../apps/cli/src/versioning.ts"

test("createApplicationVersion maps the task reference into installed version metadata", () => {
  assert.deepEqual(createApplicationVersion(174), {
    referenceNumber: 174,
    version: "1.0.174",
    label: "v 1.0.174",
    releaseTag: "v-1.0.174",
  })
})

test("syncVersionFiles updates package metadata, shared runtime version, and changelog state", () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-versioning-"))

  try {
    mkdirSync(path.join(tempRoot, "apps", "framework", "shared"), { recursive: true })
    mkdirSync(path.join(tempRoot, "apps", "mobile"), { recursive: true })
    mkdirSync(path.join(tempRoot, "ASSIST", "Documentation"), { recursive: true })

    writeFileSync(
      path.join(tempRoot, "package.json"),
      `${JSON.stringify({ name: "codexsun", version: "0.0.1" }, null, 2)}\n`,
      "utf8"
    )
    writeFileSync(
      path.join(tempRoot, "package-lock.json"),
      `${JSON.stringify(
        {
          name: "codexsun",
          version: "0.0.1",
          lockfileVersion: 3,
          packages: {
            "": {
              name: "codexsun",
              version: "0.0.1",
            },
          },
        },
        null,
        2
      )}\n`,
      "utf8"
    )
    writeFileSync(
      path.join(tempRoot, "apps", "mobile", "package.json"),
      `${JSON.stringify({ name: "@codexsun/mobile", version: "0.0.1" }, null, 2)}\n`,
      "utf8"
    )
    writeFileSync(
      path.join(tempRoot, "apps", "mobile", "package-lock.json"),
      `${JSON.stringify(
        {
          name: "@codexsun/mobile",
          version: "0.0.1",
          lockfileVersion: 3,
          packages: {
            "": {
              name: "@codexsun/mobile",
              version: "0.0.1",
            },
          },
        },
        null,
        2
      )}\n`,
      "utf8"
    )
    writeFileSync(
      path.join(tempRoot, "ASSIST", "Documentation", "CHANGELOG.md"),
      [
        "# Changelog",
        "",
        "## Version State",
        "",
        "- Current package version: `0.0.1`",
        "- Current release tag: `v-0.0.1`",
        "- Reference format: `#<number>`",
        "",
        "## v-0.0.1",
        "",
        "### [#174] 2026-04-13 - Current batch",
      ].join("\n"),
      "utf8"
    )

    const version = syncVersionFiles(tempRoot, 174)

    assert.equal(version.version, "1.0.174")

    const packageManifest = JSON.parse(
      readFileSync(path.join(tempRoot, "package.json"), "utf8")
    ) as { version: string }
    const packageLock = JSON.parse(
      readFileSync(path.join(tempRoot, "package-lock.json"), "utf8")
    ) as { version: string; packages: Record<string, { version: string }> }
    const mobileManifest = JSON.parse(
      readFileSync(path.join(tempRoot, "apps", "mobile", "package.json"), "utf8")
    ) as { version: string }
    const mobileLock = JSON.parse(
      readFileSync(path.join(tempRoot, "apps", "mobile", "package-lock.json"), "utf8")
    ) as { version: string; packages: Record<string, { version: string }> }
    const sharedVersionFile = readFileSync(
      path.join(tempRoot, "apps", "framework", "shared", "application-version.ts"),
      "utf8"
    )
    const changelog = readFileSync(
      path.join(tempRoot, "ASSIST", "Documentation", "CHANGELOG.md"),
      "utf8"
    )

    assert.equal(packageManifest.version, "1.0.174")
    assert.equal(packageLock.version, "1.0.174")
    assert.equal(packageLock.packages[""].version, "1.0.174")
    assert.equal(mobileManifest.version, "1.0.174")
    assert.equal(mobileLock.version, "1.0.174")
    assert.equal(mobileLock.packages[""].version, "1.0.174")
    assert.match(sharedVersionFile, /version: "1\.0\.174"/)
    assert.match(sharedVersionFile, /label: "v 1\.0\.174"/)
    assert.match(changelog, /Current package version: `1\.0\.174`/)
    assert.match(changelog, /Current release tag: `v-1\.0\.174`/)
    assert.match(changelog, /Reference format: `v 1\.0\.<number>` linked to task `#<number>`/)
    assert.match(changelog, /^## v-1\.0\.174$/m)
    assert.match(changelog, /^### \[v 1\.0\.174\] 2026-04-13 - Current batch$/m)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
