import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const requiredSections = [
  'Purpose',
  'Ownership',
  'Workspaces and commands',
  'Runtime configuration',
  'Health and shutdown',
  'Verification',
  'Module catalog',
]
const issues = []

for (const app of await getDirectories('apps')) {
  await checkApplication(app)
}

if (issues.length > 0) {
  console.error('Application documentation checks failed:')
  console.error(issues.join('\n'))
  process.exit(1)
}

console.log('Application documentation checks passed.')

async function checkApplication(app) {
  const readmePath = join('apps', app, 'README.md')
  const catalogPath = join('assist', 'modules', `${app}.md`)

  if (!existsSync(readmePath)) {
    issues.push(`${app}: missing ${readmePath}`)
    return
  }

  if (!existsSync(catalogPath)) {
    issues.push(`${app}: missing ${catalogPath}`)
  }

  const readme = await readFile(readmePath, 'utf8')
  for (const section of requiredSections) {
    if (!readme.includes(`## ${section}`)) {
      issues.push(`${readmePath}: missing "## ${section}"`)
    }
  }

  if (!readme.includes('application-standard.md')) {
    issues.push(`${readmePath}: missing application standard reference`)
  }
}

async function getDirectories(path) {
  const entries = await readdir(path, { withFileTypes: true })
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
}
