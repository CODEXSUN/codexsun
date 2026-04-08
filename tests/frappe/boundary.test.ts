import assert from "node:assert/strict"
import { readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import test from "node:test"

const repositoryRoot = path.resolve(import.meta.dirname, "..", "..")
const allowedPathPrefixes = [
  path.join(repositoryRoot, "apps", "frappe") + path.sep,
  path.join(repositoryRoot, "apps", "api") + path.sep,
  path.join(repositoryRoot, "tests") + path.sep,
]
const ignoredDirectoryNames = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".turbo",
])

function listSourceFiles(directoryPath: string): string[] {
  const entries = readdirSync(directoryPath, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".github") {
      continue
    }

    const nextPath = path.join(directoryPath, entry.name)

    if (entry.isDirectory()) {
      if (ignoredDirectoryNames.has(entry.name)) {
        continue
      }

      files.push(...listSourceFiles(nextPath))
      continue
    }

    if (!entry.isFile()) {
      continue
    }

    if (!/\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/.test(entry.name)) {
      continue
    }

    files.push(nextPath)
  }

  return files
}

function isAllowedImporter(filePath: string) {
  return allowedPathPrefixes.some((prefix) => filePath.startsWith(prefix))
}

test("frappe service orchestration stays inside frappe and API transport boundaries", () => {
  const sourceFiles = listSourceFiles(repositoryRoot)
  const violatingFiles = sourceFiles.filter((filePath) => {
    if (isAllowedImporter(filePath)) {
      return false
    }

    const source = readFileSync(filePath, "utf8")
    return /frappe\/src\/services\//.test(source) || /@frappe\/src\/services/.test(source)
  })

  assert.deepEqual(
    violatingFiles,
    [],
    `Non-boundary files must not import Frappe service internals directly:\n${violatingFiles.join("\n")}`
  )
})
