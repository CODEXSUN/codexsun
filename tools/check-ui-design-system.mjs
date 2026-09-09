import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const appsRoot = path.join(root, 'apps')
const packageGalleryRoot = path.join(root, 'packages', 'ui', 'src', 'templates', 'ui-gallery')
const sourceExtensions = new Set(['.js', '.jsx', '.ts', '.tsx'])
const forbiddenImports = [
  '@base-ui/react',
  '@chakra-ui/',
  '@codexsun/ui/src',
  '@mantine/',
  '@mui/',
  '@radix-ui/',
  '@shadcn/',
  'antd',
  'bootstrap',
  'class-variance-authority',
  'packages/ui/src',
  'radix-ui',
  'react-bootstrap',
  'semantic-ui',
]
const violations = []

try {
  const packageGalleryEntries = await readdir(packageGalleryRoot)
  if (packageGalleryEntries.length > 0) {
    violations.push(
      'packages/ui/src/templates/ui-gallery: showcase code belongs to apps/ui/web/src/modules/gallery',
    )
  }
} catch (error) {
  if (error?.code !== 'ENOENT') throw error
}

for (const filePath of await listWebSourceFiles()) {
  const relativePath = path.relative(root, filePath).replaceAll('\\', '/')
  const source = await readFile(filePath, 'utf8')

  if (relativePath.includes('/src/components/ui/')) {
    violations.push(`${relativePath}: app-local shared primitive directory is not allowed`)
  }

  for (const specifier of readImportSpecifiers(source)) {
    if (forbiddenImports.some((prefix) => specifier.startsWith(prefix))) {
      violations.push(`${relativePath}: import ${specifier} through @codexsun/ui public exports`)
    }
  }
}

for (const packagePath of await listWebWorkspacePackages()) {
  const manifest = JSON.parse(await readFile(packagePath, 'utf8'))
  const dependencies = { ...manifest.dependencies, ...manifest.devDependencies }
  for (const dependency of Object.keys(dependencies)) {
    if (forbiddenImports.some((prefix) => dependency.startsWith(prefix))) {
      const relativePath = path.relative(root, packagePath).replaceAll('\\', '/')
      violations.push(
        `${relativePath}: depend on shared UI through @codexsun/ui, not ${dependency}`,
      )
    }
  }
}

if (violations.length > 0) {
  console.error('UI design-system boundary checks failed:')
  for (const violation of violations) console.error(`- ${violation}`)
  process.exitCode = 1
} else {
  console.log('UI design-system boundary checks passed.')
}

async function listWebSourceFiles() {
  const applications = await readdir(appsRoot, { withFileTypes: true })
  const files = []
  for (const application of applications) {
    if (!application.isDirectory()) continue
    const sourceRoot = path.join(appsRoot, application.name, 'web', 'src')
    try {
      files.push(...(await listSourceFiles(sourceRoot)))
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
  }
  return files
}

async function listWebWorkspacePackages() {
  const applications = await readdir(appsRoot, { withFileTypes: true })
  const packages = []
  for (const application of applications) {
    if (!application.isDirectory()) continue
    const packagePath = path.join(appsRoot, application.name, 'web', 'package.json')
    try {
      await readFile(packagePath)
      packages.push(packagePath)
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
  }
  return packages
}

async function listSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await listSourceFiles(entryPath)))
      continue
    }
    if (sourceExtensions.has(path.extname(entry.name))) files.push(entryPath)
  }
  return files
}

function readImportSpecifiers(source) {
  const specifiers = []
  const importPattern = /(?:from\s+|import\s*)['"]([^'"]+)['"]/g
  for (const match of source.matchAll(importPattern)) specifiers.push(match[1])
  return specifiers
}
