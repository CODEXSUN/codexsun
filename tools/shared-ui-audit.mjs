import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const sourceExtensions = new Set(['.js', '.jsx', '.ts', '.tsx'])
const uiuxWorkspace = '@codexsun/uiux-web'
const forbiddenNativeElements = ['button', 'select', 'table', 'textarea']
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

export async function auditSharedUi(options = {}) {
  const root = path.resolve(options.root ?? process.cwd())
  const workspaces = await listWebWorkspaces(root)
  const selected = selectWorkspaces(workspaces, options.app)
  const applications = []

  for (const workspace of selected) applications.push(await auditWorkspace(root, workspace))

  const violations = applications.flatMap(({ violations: items }) => items)
  if (!options.app) violations.unshift(...(await auditGalleryOwnership(root, workspaces)))

  return {
    applications,
    passed: violations.length === 0,
    root,
    totals: {
      applications: applications.length,
      files: applications.reduce((sum, item) => sum + item.files, 0),
      publicUiImports: applications.reduce((sum, item) => sum + item.publicUiImports, 0),
      violations: violations.length,
    },
    violations,
  }
}

export function formatSharedUiAudit(report) {
  const heading = report.passed ? 'Shared UI audit passed.' : 'Shared UI audit failed.'
  const totals = `${report.totals.applications} apps, ${report.totals.files} files, ${report.totals.publicUiImports} public @codexsun/ui imports`
  const applications = report.applications.map(
    (item) =>
      `- ${item.name}: ${item.files} files, ${item.publicUiImports} public imports, ${item.violations.length} violations`,
  )
  const violations = report.violations.map((violation) => `  - ${violation}`)
  return [heading, totals, ...applications, ...violations].join('\n')
}

async function auditWorkspace(root, workspace) {
  const files = await listSourceFiles(workspace.sourceRoot)
  const violations = []
  let publicUiImports = 0

  for (const filePath of files) {
    const relativePath = relative(root, filePath)
    const source = await readFile(filePath, 'utf8')

    if (relativePath.includes('/src/components/ui/')) {
      violations.push(`${relativePath}: app-local shared primitive directory is not allowed`)
    }

    for (const element of forbiddenNativeElements) {
      if (new RegExp(`<${element}(?:\\s|>)`, 'u').test(source)) {
        violations.push(`${relativePath}: use the shared ${element} primitive from @codexsun/ui`)
      }
    }

    for (const specifier of readImportSpecifiers(source)) {
      if (specifier === '@codexsun/ui' || specifier.startsWith('@codexsun/ui/'))
        publicUiImports += 1
      if (workspace.name !== 'uiux' && isUiuxReference(specifier)) {
        violations.push(
          `${relativePath}: UIUX is an independent app; import shared UI through @codexsun/ui`,
        )
      }
      if (forbiddenImports.some((prefix) => specifier.startsWith(prefix))) {
        violations.push(`${relativePath}: import ${specifier} through @codexsun/ui public exports`)
      }
    }
  }

  const manifest = JSON.parse(await readFile(workspace.packagePath, 'utf8'))
  const dependencies = { ...manifest.dependencies, ...manifest.devDependencies }
  if (!dependencies['@codexsun/ui']) {
    violations.push(
      `${relative(root, workspace.packagePath)}: declare @codexsun/ui as the shared UI owner`,
    )
  }
  for (const dependency of Object.keys(dependencies)) {
    if (workspace.name !== 'uiux' && dependency.startsWith(uiuxWorkspace)) {
      violations.push(
        `${relative(root, workspace.packagePath)}: do not depend on the UIUX application; use @codexsun/ui`,
      )
    }
    if (forbiddenImports.some((prefix) => dependency.startsWith(prefix))) {
      violations.push(
        `${relative(root, workspace.packagePath)}: depend on shared UI through @codexsun/ui, not ${dependency}`,
      )
    }
  }

  return {
    files: files.length,
    name: workspace.name,
    packageName: manifest.name ?? null,
    publicUiImports,
    violations,
  }
}

async function auditGalleryOwnership(root, workspaces) {
  const violations = []
  const packageGallery = path.join(root, 'packages', 'ui', 'src', 'templates', 'ui-gallery')
  if (await exists(packageGallery)) {
    violations.push(`${relative(root, packageGallery)}: gallery must remain application-owned`)
  }

  const galleries = []
  for (const workspace of workspaces) {
    const gallery = path.join(workspace.sourceRoot, 'modules', 'gallery')
    if (await exists(gallery)) galleries.push(gallery)
  }
  if (galleries.length !== 1) {
    violations.push(`apps: expected one application-owned UI gallery, found ${galleries.length}`)
  } else if (!(await exists(path.join(galleries[0], 'index.ts')))) {
    violations.push(`${relative(root, galleries[0])}: gallery must export index.ts`)
  }
  return violations
}

async function listWebWorkspaces(root) {
  const appsRoot = path.join(root, 'apps')
  const applications = await readdir(appsRoot, { withFileTypes: true })
  const workspaces = []
  for (const application of applications) {
    if (!application.isDirectory()) continue
    const webRoot = path.join(appsRoot, application.name, 'web')
    const packagePath = path.join(webRoot, 'package.json')
    const sourceRoot = path.join(webRoot, 'src')
    if ((await exists(packagePath)) && (await exists(sourceRoot))) {
      workspaces.push({ name: application.name, packagePath, sourceRoot })
    }
  }
  return workspaces.sort((left, right) => left.name.localeCompare(right.name))
}

function selectWorkspaces(workspaces, app) {
  if (!app) return workspaces
  const selected = workspaces.filter(({ name }) => name === app)
  if (selected.length === 0) {
    const available = workspaces.map(({ name }) => name).join(', ')
    throw new Error(`Unknown web application ${app}. Available applications: ${available}.`)
  }
  return selected
}

async function listSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await listSourceFiles(entryPath)))
    else if (sourceExtensions.has(path.extname(entry.name))) files.push(entryPath)
  }
  return files
}

function readImportSpecifiers(source) {
  const specifiers = []
  const importPattern = /(?:from\s+|import\s*)['"]([^'"]+)['"]/g
  for (const match of source.matchAll(importPattern)) specifiers.push(match[1])
  return specifiers
}

function isUiuxReference(specifier) {
  const normalized = specifier.replaceAll('\\', '/')
  return (
    normalized === uiuxWorkspace ||
    normalized.startsWith(`${uiuxWorkspace}/`) ||
    normalized.includes('apps/uiux/web') ||
    /(?:^|\/)uiux\/web(?:\/|$)/u.test(normalized)
  )
}

async function exists(target) {
  try {
    await readdir(target)
    return true
  } catch (error) {
    if (error?.code === 'ENOTDIR') {
      try {
        await readFile(target)
        return true
      } catch (fileError) {
        if (fileError?.code === 'ENOENT') return false
        throw fileError
      }
    }
    if (error?.code === 'ENOENT') return false
    throw error
  }
}

function relative(root, target) {
  return path.relative(root, target).replaceAll('\\', '/')
}
