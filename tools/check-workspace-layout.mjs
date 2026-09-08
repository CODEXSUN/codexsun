import { readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '..')
const sourceRoots = ['apps', 'packages', 'tools'].map((directory) =>
  resolve(projectRoot, directory),
)
const forbiddenDirectoryNames = new Set(['dist', 'dist-types', 'node_modules'])
const forbiddenFileNames = new Set(['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'])
const violations = []
const workspaceDirectories = []

for (const sourceRoot of sourceRoots) {
  await inspectDirectory(sourceRoot)
}

for (const workspaceDirectory of workspaceDirectories) {
  const entries = await readdir(workspaceDirectory, { withFileTypes: true })
  const typescriptConfigs = entries.filter(
    (entry) => entry.isFile() && /^tsconfig(?:\..+)?\.json$/u.test(entry.name),
  )

  if (typescriptConfigs.length !== 1 || typescriptConfigs[0]?.name !== 'tsconfig.json') {
    violations.push(
      `${workspaceDirectory} must contain exactly one TypeScript config named tsconfig.json.`,
    )
  }
}

if (violations.length > 0) {
  throw new Error(`Workspace layout violations:\n${violations.join('\n')}`)
}

console.log(`Workspace layout passed for ${workspaceDirectories.length} workspace(s).`)

async function inspectDirectory(directory) {
  const entries = await readdir(directory, { withFileTypes: true })

  if (entries.some((entry) => entry.isFile() && entry.name === 'package.json')) {
    workspaceDirectories.push(directory)
  }

  for (const entry of entries) {
    const entryPath = resolve(directory, entry.name)

    if (entry.isDirectory()) {
      if (forbiddenDirectoryNames.has(entry.name)) {
        violations.push(`Remove nested directory: ${entryPath}`)
      } else {
        await inspectDirectory(entryPath)
      }
    } else if (forbiddenFileNames.has(entry.name)) {
      violations.push(`Remove nested lockfile: ${entryPath}`)
    }
  }
}
