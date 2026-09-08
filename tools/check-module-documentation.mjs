import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const issues = []

for (const app of await getDirectories('apps')) {
  await checkModuleRoot(app, 'api')
  await checkModuleRoot(app, 'web')
}

if (issues.length > 0) {
  console.error('Module documentation checks failed:')
  console.error(issues.join('\n'))
  process.exit(1)
}

console.log('Module documentation checks passed.')

async function checkModuleRoot(app, runtime) {
  const modulesRoot = join('apps', app, runtime, 'src', 'modules')
  const modules = await getDirectories(modulesRoot)

  if (modules.length === 0) {
    return
  }

  const catalogPath = join('assist', 'modules', `${app}.md`)

  if (!existsSync(catalogPath)) {
    issues.push(`${app}: missing ${catalogPath}`)
    return
  }

  const catalog = await readFile(catalogPath, 'utf8')

  for (const module of modules) {
    const modulePath = join(modulesRoot, module)
    const readmePath = join(modulePath, 'README.md')

    if (!existsSync(readmePath)) {
      issues.push(`${modulePath}: missing README.md`)
    } else {
      const readme = await readFile(readmePath, 'utf8')
      if (!readme.includes('## Development records')) {
        issues.push(`${readmePath}: missing "## Development records"`)
      }
    }

    if (!catalog.includes(module)) {
      issues.push(`${catalogPath}: missing catalog entry for ${module}`)
    }
  }
}

async function getDirectories(path) {
  try {
    const entries = await readdir(path, { withFileTypes: true })
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []
    }

    throw error
  }
}
