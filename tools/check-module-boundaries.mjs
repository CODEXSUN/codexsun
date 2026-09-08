import { readdir, readFile } from 'node:fs/promises'
import { basename, dirname, extname, join, normalize, relative, resolve, sep } from 'node:path'

const repositoryRoot = resolve(import.meta.dirname, '..')
const applicationRoot = join(repositoryRoot, 'apps')
const issues = []
const sourceFiles = (await walk(applicationRoot)).filter((file) => /\.[cm]?[jt]sx?$/u.test(file))

for (const file of sourceFiles) {
  checkDataOwnership(file)
  await checkPrivateModuleImports(file)
}

if (issues.length > 0) {
  console.error('Module boundary checks failed:')
  console.error(issues.join('\n'))
  process.exit(1)
}

console.log('Module boundary checks passed.')

function checkDataOwnership(file) {
  const repositoryPath = portable(relative(repositoryRoot, file))
  const isDataFile = /(?:^|\/)[^/]*(?:migration|seed)s?\.[cm]?[jt]s$/u.test(repositoryPath)
  if (!isDataFile) return

  if (!/^apps\/[^/]+\/api\/src\/modules\/[^/]+\//u.test(repositoryPath)) {
    issues.push(`${repositoryPath}: migrations and seeds must live in the owning API module`)
  }
}

async function checkPrivateModuleImports(file) {
  const sourceModule = moduleIdentity(file)
  if (!sourceModule) return
  const source = await readFile(file, 'utf8')
  const imports = source.matchAll(/(?:from\s+|import\s*\()\s*['"](\.[^'"]+)['"]/gu)

  for (const match of imports) {
    const target = resolveImport(file, match[1])
    const targetModule = moduleIdentity(target)
    if (!targetModule || targetModule.key === sourceModule.key) continue
    if (basename(target, extname(target)) === 'index') continue

    issues.push(
      `${portable(relative(repositoryRoot, file))}: imports private source from ${targetModule.key}`,
    )
  }
}

function moduleIdentity(file) {
  const parts = portable(relative(repositoryRoot, file)).split('/')
  if (parts[0] !== 'apps' || parts[3] !== 'src' || parts[4] !== 'modules' || !parts[5]) {
    return undefined
  }
  return { key: `${parts[1]}/${parts[2]}/${parts[5]}` }
}

function resolveImport(sourceFile, specifier) {
  const unresolved = normalize(resolve(dirname(sourceFile), specifier))
  if (extname(unresolved) === '.js') return unresolved.slice(0, -3) + '.ts'
  if (extname(unresolved) === '.jsx') return unresolved.slice(0, -4) + '.tsx'
  if (!extname(unresolved)) return join(unresolved, 'index.ts')
  return unresolved
}

async function walk(root) {
  const entries = await readdir(root, { withFileTypes: true })
  const results = []
  for (const entry of entries) {
    const path = join(root, entry.name)
    if (entry.isDirectory()) results.push(...(await walk(path)))
    else results.push(path)
  }
  return results
}

function portable(path) {
  return path.split(sep).join('/')
}
