import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { test } from 'node:test'

const projectRoot = resolve(import.meta.dirname, '..')

test('Turbo owns one root cache and unique root build outputs', async () => {
  const rootPackage = await readJson(resolve(projectRoot, 'package.json'))
  const rootConfig = await readJson(resolve(projectRoot, 'turbo.json'))
  assert.match(rootPackage.scripts['ci:affected'], /--affected --filter=!\/\/$/u)
  assert.equal(rootConfig.cacheDir, 'node_modules/.cache/turbo')
  assert.deepEqual(rootConfig.tasks.build.dependsOn, ['^build'])
  assert.deepEqual(rootConfig.tasks.test.dependsOn, ['^build'])

  const outputOwners = new Map()
  const workspaces = await findWorkspaces()
  for (const workspace of workspaces) {
    const packageFile = await readJson(resolve(workspace, 'package.json'))
    if (!packageFile.scripts?.build) continue

    const config = await readJson(resolve(workspace, 'turbo.json'))
    const outputs = config.tasks?.build?.outputs
    assert(Array.isArray(outputs) && outputs.length === 1, `${packageFile.name} needs one output`)
    const output = outputs[0]
    assert.match(output, /^\$TURBO_ROOT\$\/dist\/(?:apps|packages)\/.+\/\*\*$/u)
    assert(!outputOwners.has(output), `${output} is shared by two workspaces`)
    outputOwners.set(output, packageFile.name)
  }
})

async function findWorkspaces() {
  const workspaces = []
  for (const sourceRoot of ['apps', 'packages']) {
    await visit(resolve(projectRoot, sourceRoot), workspaces)
  }
  return workspaces
}

async function visit(directory, workspaces) {
  const entries = await readdir(directory, { withFileTypes: true })
  if (entries.some((entry) => entry.isFile() && entry.name === 'package.json')) {
    workspaces.push(directory)
    return
  }
  for (const entry of entries) {
    if (entry.isDirectory()) await visit(resolve(directory, entry.name), workspaces)
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'))
}
