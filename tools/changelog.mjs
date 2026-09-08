import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const CHANGELOG_PATH = join('assist', 'documentation', 'CHANGELOG.md')

export function readLatestVersionedChangelogEntry(rootDir) {
  const changelogPath = join(rootDir, CHANGELOG_PATH)
  const changelog = readFileSync(changelogPath, 'utf8')
  const match = changelog.match(
    /^### \[v (\d+)\.(\d+)\.(\d+)\] \d{4}-\d{2}-\d{2}(?: \d{1,2}:\d{2} (?:am|pm))? - (.+)$/m,
  )

  if (!match) {
    throw new Error(`Could not read the latest versioned entry from ${CHANGELOG_PATH}.`)
  }

  const reference = Number.parseInt(match[3] ?? '', 10)
  const title = match[4]?.trim()
  if (!Number.isInteger(reference) || reference < 0 || !title) {
    throw new Error('The latest changelog entry has an invalid version or title.')
  }

  return { reference, title, version: `${match[1]}.${match[2]}.${match[3]}` }
}

export function formatChangelogCommitSubject(entry) {
  return `#${entry.reference} - ${entry.title}`
}
