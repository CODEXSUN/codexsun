#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { copyFile, cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { DeploymentPlanner, renderDockerCompose } from '../dist/packages/runtime/index.js'
import { startLocalDeployment } from './runtime-local.mjs'

const projectRoot = resolve(import.meta.dirname, '..')
const command = process.argv[2] ?? 'validate'
const profileId = process.argv[3] ?? 'development'
const componentId = process.argv[4]

const plan = await loadPlan(profileId)

if (command === 'validate') {
  await validateWorkspaceBindings(plan)
  process.stdout.write(
    `[runtime] profile ${profileId} is valid with ${plan.applications.length} application(s) and ${plan.components.length} component(s).\n`,
  )
} else if (command === 'plan') {
  process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`)
} else if (command === 'compose') {
  const output = await writeDeploymentFiles(plan)
  process.stdout.write(`[runtime] wrote ${portable(relative(projectRoot, output))}.\n`)
} else if (command === 'build') {
  for (const component of plan.components) await buildComponent(plan, component.id)
  await writeDeploymentFiles(plan)
  process.stdout.write(`[runtime] built profile ${profileId}.\n`)
} else if (command === 'build-component') {
  if (!componentId) throw new Error('The build-component command requires a component ID.')
  await buildComponent(plan, componentId)
} else if (command === 'start') {
  await startLocalDeployment(plan, projectRoot)
} else {
  throw new Error('Use validate, plan, compose, build, build-component, or start.')
}

async function loadPlan(selectedProfileId) {
  const catalog = await readJson(join(projectRoot, 'deployments/catalog.json'))
  const profile = await readJson(
    join(projectRoot, 'deployments/profiles', `${selectedProfileId}.json`),
  )
  return new DeploymentPlanner(catalog).createPlan(profile)
}

async function buildComponent(planToBuild, selectedComponentId) {
  const component = planToBuild.components.find(({ id }) => id === selectedComponentId)
  if (!component)
    throw new Error(
      `Profile "${planToBuild.profile.id}" has no component "${selectedComponentId}".`,
    )

  for (const workspace of component.buildWorkspaces) {
    runWorkspaceBuild(workspace, planToBuild.profile.buildEnvironment)
  }
  const componentRoot = deploymentComponentRoot(planToBuild.profile.id, component.id)
  await rm(componentRoot, { force: true, recursive: true })
  await mkdir(componentRoot, { recursive: true })

  if (component.runtime === 'static') {
    await cp(resolve(projectRoot, component.outputPath), join(componentRoot, 'public'), {
      recursive: true,
    })
  } else {
    await stageNodeComponent(component, componentRoot)
  }
  process.stdout.write(`[runtime] built ${component.id}.\n`)
}

async function stageNodeComponent(component, componentRoot) {
  const root = join(componentRoot, 'root')
  const workspaces = await readWorkspacePackages()
  const dependencies = {}
  await copyIntoRoot(resolve(projectRoot, component.outputPath), root)

  for (const workspaceName of component.buildWorkspaces) {
    const workspace = workspaces.get(workspaceName)
    if (!workspace) throw new Error(`Build workspace "${workspaceName}" does not exist.`)
    collectExternalDependencies(dependencies, workspace.manifest.dependencies)

    if (!workspaceName.startsWith('@codexsun/') || !workspace.manifest.main) continue
    const installedPackage = join(projectRoot, 'node_modules', ...workspaceName.split('/'))
    const outputFile = resolve(installedPackage, workspace.manifest.main)
    assertInsideDist(outputFile)
    await copyIntoRoot(dirname(outputFile), root)
    const packageName = workspaceName.slice('@codexsun/'.length)
    const localPackage = join(root, 'local-packages', packageName)
    await mkdir(localPackage, { recursive: true })
    await writeFile(
      join(localPackage, 'package.json'),
      `${JSON.stringify({ ...workspace.manifest, devDependencies: undefined }, null, 2)}\n`,
    )
    dependencies[workspaceName] = `file:local-packages/${packageName}`
  }

  await writeFile(
    join(root, 'package.json'),
    `${JSON.stringify({ dependencies, name: `codexsun-${component.id}`, private: true, type: 'module' }, null, 2)}\n`,
  )
  await writeFile(join(root, 'start.mjs'), `await import('./${component.startFile}')\n`)
  createProductionLock(root)
}

async function copyIntoRoot(source, root) {
  const relativeSource = relative(projectRoot, source)
  if (relativeSource.startsWith('..')) throw new Error('Deployment output escaped the repository.')
  const target = join(root, relativeSource)
  await mkdir(dirname(target), { recursive: true })
  await cp(source, target, { recursive: true })
}

async function readWorkspacePackages() {
  const packages = new Map()
  for (const manifestPath of await findPackageManifests(projectRoot)) {
    if (manifestPath.includes(`${sep}node_modules${sep}`)) continue
    const manifest = await readJson(manifestPath)
    if (typeof manifest.name !== 'string') continue
    packages.set(manifest.name, { directory: dirname(manifestPath), manifest })
  }
  return packages
}

async function validateWorkspaceBindings(planToValidate) {
  const workspaces = await readWorkspacePackages()
  for (const workspace of planToValidate.buildWorkspaces) {
    if (!workspaces.has(workspace)) {
      throw new Error(`Deployment plan references missing workspace "${workspace}".`)
    }
  }
}

async function findPackageManifests(root) {
  const results = []
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue
    const path = join(root, entry.name)
    if (entry.isDirectory()) results.push(...(await findPackageManifests(path)))
    else if (entry.name === 'package.json') results.push(path)
  }
  return results
}

function collectExternalDependencies(target, source = {}) {
  for (const [name, version] of Object.entries(source)) {
    if (!name.startsWith('@codexsun/')) target[name] = version
  }
}

function runWorkspaceBuild(workspace, buildEnvironment) {
  const { argumentsList, executable } = npmCommand(['run', 'build', '--workspace', workspace])
  const result = spawnSync(executable, argumentsList, {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...process.env, ...buildEnvironment },
    stdio: 'inherit',
  })
  if (result.status !== 0) {
    const cause = result.error ? `: ${result.error.message}` : ''
    throw new Error(`Build failed for workspace "${workspace}"${cause}.`)
  }
}

function createProductionLock(root) {
  const { argumentsList, executable } = npmCommand([
    'install',
    '--package-lock-only',
    '--ignore-scripts',
    '--no-audit',
  ])
  const result = spawnSync(executable, argumentsList, {
    cwd: root,
    encoding: 'utf8',
    stdio: 'inherit',
  })
  if (result.status !== 0) {
    const cause = result.error ? `: ${result.error.message}` : ''
    throw new Error(`The production dependency lock could not be created${cause}.`)
  }
}

function npmCommand(argumentsList) {
  if (process.platform !== 'win32') return { argumentsList, executable: 'npm' }
  return {
    argumentsList: ['/d', '/s', '/c', 'npm.cmd', ...argumentsList],
    executable: process.env.ComSpec ?? 'cmd.exe',
  }
}

async function writeDeploymentFiles(planToWrite) {
  const output = join(projectRoot, 'dist/deployments', planToWrite.profile.id)
  await mkdir(output, { recursive: true })
  await writeFile(join(output, 'compose.yaml'), renderDockerCompose(planToWrite))
  await writeFile(join(output, 'manifest.json'), `${JSON.stringify(planToWrite, null, 2)}\n`)
  await copyFile(join(projectRoot, '.env.example'), join(output, 'environment.example'))
  return output
}

function deploymentComponentRoot(selectedProfileId, selectedComponentId) {
  return join(projectRoot, 'dist/deployments', selectedProfileId, 'components', selectedComponentId)
}

function assertInsideDist(path) {
  const relativePath = relative(join(projectRoot, 'dist'), path)
  if (relativePath.startsWith('..') || relativePath === '') {
    throw new Error(`Workspace output "${portable(path)}" is outside root dist.`)
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'))
}

function portable(path) {
  return path.split(sep).join('/')
}
