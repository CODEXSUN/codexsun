import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const maximumLines = 700
const roots = ['apps', 'assist', 'packages', 'tools']
const sourceExtensions = new Set(['.css', '.js', '.json', '.md', '.mjs', '.ts', '.tsx'])
const ignoredDirectories = new Set(['dist', 'node_modules'])

const violations = []

for (const root of roots) {
  await inspectDirectory(root)
}

if (violations.length > 0) {
  console.error(`Files may not exceed ${maximumLines} lines:`)
  console.error(violations.join('\n'))
  process.exit(1)
}

console.log(`All authored files are within the ${maximumLines}-line limit.`)

async function inspectDirectory(directory) {
  let entries

  try {
    entries = await readdir(directory, { withFileTypes: true })
  } catch (error) {
    if (error.code === 'ENOENT') {
      return
    }

    throw error
  }

  for (const entry of entries) {
    const path = join(directory, entry.name)

    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        await inspectDirectory(path)
      }

      continue
    }

    if (entry.isFile() && sourceExtensions.has(getExtension(entry.name))) {
      await inspectFile(path)
    }
  }
}

async function inspectFile(path) {
  const content = await readFile(path, 'utf8')
  const lines = content.split(/\r?\n/).length

  if (lines > maximumLines) {
    violations.push(`${relative('.', path)}: ${lines} lines`)
  }
}

function getExtension(fileName) {
  const separator = fileName.lastIndexOf('.')
  return separator === -1 ? '' : fileName.slice(separator)
}
