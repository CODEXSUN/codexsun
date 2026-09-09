import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative, resolve, sep } from 'node:path'
import ts from 'typescript'

const repositoryRoot = resolve(import.meta.dirname, '..')
const moduleFiles = (await walk(join(repositoryRoot, 'apps'))).filter((file) =>
  /\.module\.tsx?$/u.test(file),
)
const manifests = new Map()
const issues = []

for (const file of moduleFiles) {
  const source = await readFile(file, 'utf8')
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    extname(file) === '.tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )

  visit(sourceFile, file)
}

for (const manifest of manifests.values()) {
  for (const dependency of manifest.dependencies) {
    const target = manifests.get(dependency.id)
    if (!target) {
      issues.push(`${manifest.path}: dependency ${dependency.id} has no module manifest`)
      continue
    }
    if (!satisfies(target.version, dependency.versionRange)) {
      issues.push(
        `${manifest.path}: ${dependency.id}@${target.version} does not satisfy ${dependency.versionRange}`,
      )
    }
  }
}

if (issues.length > 0) {
  console.error('Module dependency checks failed:')
  console.error(issues.join('\n'))
  process.exit(1)
}

console.log(`Module dependency checks passed for ${manifests.size} manifest(s).`)

function visit(sourceFile, file) {
  const inspect = (node) => {
    if (ts.isVariableDeclaration(node) && /Manifest$/u.test(node.name.getText(sourceFile))) {
      const value = unwrapExpression(node.initializer)
      if (value && ts.isObjectLiteralExpression(value)) addManifest(value, sourceFile, file)
    }
    ts.forEachChild(node, inspect)
  }
  inspect(sourceFile)
}

function addManifest(object, sourceFile, file) {
  const id = readStringProperty(object, 'id', sourceFile)
  const version = readStringProperty(object, 'version', sourceFile)
  if (!id || !version) return

  const path = portable(relative(repositoryRoot, file))
  if (manifests.has(id)) {
    issues.push(`${path}: duplicate module manifest ${id}`)
    return
  }

  manifests.set(id, {
    dependencies: readDependencies(object, sourceFile),
    id,
    path,
    version,
  })
}

function readDependencies(object, sourceFile) {
  const property = findProperty(object, 'dependencies', sourceFile)
  const value = unwrapExpression(property?.initializer)
  if (!value) return []

  if (ts.isObjectLiteralExpression(value)) {
    return value.properties.flatMap((entry) => {
      if (!ts.isPropertyAssignment(entry)) return []
      const id = propertyName(entry.name, sourceFile)
      const versionRange = stringValue(unwrapExpression(entry.initializer))
      return id && versionRange ? [{ id, versionRange }] : []
    })
  }

  if (ts.isArrayLiteralExpression(value)) {
    return value.elements.flatMap((entry) => {
      const dependency = unwrapExpression(entry)
      if (!dependency || !ts.isObjectLiteralExpression(dependency)) return []
      const id = readStringProperty(dependency, 'id', sourceFile)
      const versionRange = readStringProperty(dependency, 'versionRange', sourceFile)
      return id && versionRange ? [{ id, versionRange }] : []
    })
  }

  return []
}

function readStringProperty(object, name, sourceFile) {
  return stringValue(unwrapExpression(findProperty(object, name, sourceFile)?.initializer))
}

function findProperty(object, name, sourceFile) {
  return object.properties.find(
    (property) =>
      ts.isPropertyAssignment(property) && propertyName(property.name, sourceFile) === name,
  )
}

function propertyName(name, sourceFile) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text
  return name.getText(sourceFile)
}

function stringValue(value) {
  return value && (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value))
    ? value.text
    : undefined
}

function unwrapExpression(value) {
  let current = value
  while (
    current &&
    (ts.isAsExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isParenthesizedExpression(current))
  ) {
    current = current.expression
  }
  return current
}

function satisfies(version, range) {
  const actual = parseVersion(version)
  if (!actual) return false
  if (!range.startsWith('^')) return version === range

  const minimum = parseVersion(range.slice(1))
  if (!minimum || compare(actual, minimum) < 0) return false
  if (minimum.major > 0) return actual.major === minimum.major
  if (minimum.minor > 0) return actual.major === 0 && actual.minor === minimum.minor
  return actual.major === 0 && actual.minor === 0 && actual.patch === minimum.patch
}

function parseVersion(value) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/u.exec(value)
  if (!match) return undefined
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) }
}

function compare(left, right) {
  return left.major - right.major || left.minor - right.minor || left.patch - right.patch
}

async function walk(root) {
  const entries = await readdir(root, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(root, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(path)))
    else files.push(path)
  }
  return files
}

function portable(path) {
  return path.split(sep).join('/')
}
