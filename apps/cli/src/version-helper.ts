import { cwd, exit, stdout } from "node:process"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { parseLatestReference, syncVersionFiles } from "./versioning.js"

function main() {
  const rootDir = cwd()
  const changelogPath = join(rootDir, "ASSIST", "Documentation", "CHANGELOG.md")
  const changelogContent = readFileSync(changelogPath, "utf8")
  const reference = parseLatestReference(changelogContent)
  const version = syncVersionFiles(rootDir, reference.number)

  stdout.write(`Synced application version to ${version.label}.\n`)
}

try {
  main()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  stdout.write(`${message}\n`)
  exit(1)
}
