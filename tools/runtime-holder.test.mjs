import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import test from 'node:test'
import { DeploymentPlanner, renderDockerCompose } from '../dist/packages/runtime/index.js'

const projectRoot = resolve(import.meta.dirname, '..')
const catalog = await readJson('.container/catalog.json')
const developmentProfile = await readJson('.container/profiles/development.json')
const mainDevelopmentProfile = await readJson('.container/profiles/main-development.json')
const platformProfile = await readJson('.container/profiles/platform-only.json')

test('development profile composes every registered application and component', async () => {
  const plan = new DeploymentPlanner(catalog).createPlan(developmentProfile)
  const applicationDirectories = (await readdir(join(projectRoot, 'apps'), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map(({ name }) => name)
    .sort()

  assert.deepEqual(plan.applications.map(({ id }) => id).sort(), applicationDirectories)
  assert.deepEqual(
    plan.components.map(({ id }) => id),
    [
      'platform-api',
      'platform-web',
      'docs-api',
      'docs-web',
      'zetro-api',
      'zetro-web',
      'devkit-api',
      'devkit-web',
      'orship-api',
      'orship-web',
    ],
  )
  assert.equal(Object.isFrozen(plan), true)
})

test('platform-only profile omits unselected application artifacts', () => {
  const plan = new DeploymentPlanner(catalog).createPlan(platformProfile)

  assert.deepEqual(
    plan.applications.map(({ id }) => id),
    ['platform'],
  )
  assert.deepEqual(
    plan.components.map(({ id }) => id),
    ['platform-api', 'platform-web'],
  )
  assert.equal(plan.buildWorkspaces.includes('@codexsun/zetro-api'), false)
  assert.equal(plan.buildWorkspaces.includes('@codexsun/docs-api'), false)
  assert.equal(plan.buildWorkspaces.includes('@codexsun/orship-api'), false)
})

test('main development keeps Orship separate', () => {
  const plan = new DeploymentPlanner(catalog).createPlan(mainDevelopmentProfile)

  assert.deepEqual(
    plan.applications.map(({ id }) => id),
    ['platform', 'docs', 'zetro', 'devkit'],
  )
  assert.equal(
    plan.components.some(({ id }) => id.startsWith('orship-')),
    false,
  )
})

test('required applications resolve before the selected consumer', () => {
  const plan = new DeploymentPlanner(catalog).createPlan({
    ...developmentProfile,
    applications: ['docs'],
    id: 'docs-only-test',
  })

  assert.deepEqual(
    plan.applications.map(({ id }) => id),
    ['platform', 'docs'],
  )
})

test('profiles reject unknown selections, port conflicts, and incompatible runtime versions', () => {
  const planner = new DeploymentPlanner(catalog)
  assert.throws(
    () => planner.createPlan({ ...platformProfile, applications: ['missing'] }),
    /unknown application/u,
  )
  assert.throws(
    () =>
      planner.createPlan({
        ...platformProfile,
        portOverrides: { 'platform-api': 6010, 'platform-web': 6010 },
      }),
    /both use port 6010/u,
  )

  const incompatibleCatalog = structuredClone(catalog)
  incompatibleCatalog.runtimePackages.find(({ id }) => id === '@codexsun/framework').version =
    '1.0.0'
  assert.throws(
    () => new DeploymentPlanner(incompatibleCatalog).createPlan(platformProfile),
    /does not satisfy/u,
  )
})

test('Docker Compose contains one service per selected process boundary', () => {
  const plan = new DeploymentPlanner(catalog).createPlan(platformProfile)
  const compose = renderDockerCompose(plan)

  assert.match(compose, /platform-api:/u)
  assert.match(compose, /platform-web:/u)
  assert.doesNotMatch(compose, /docs-api:/u)
  assert.match(compose, /Dockerfile\.node/u)
  assert.match(compose, /Dockerfile\.static/u)
  assert.match(compose, /PLATFORM_API_HOST: 0\.0\.0\.0/u)
  assert.match(compose, /APP_ENV: production/u)
  assert.match(compose, /LOG_PRETTY: "false"/u)
})

test('selected add-ons bind only to declared target components', () => {
  const addonCatalog = structuredClone(catalog)
  addonCatalog.addons.push({
    componentIds: ['platform-api'],
    id: 'audit-addon',
    requires: [],
    runtimeBindings: [{ id: '@codexsun/runtime', versionRange: '^0.1.0' }],
    targetApplication: 'platform',
    version: '1.0.0',
    workspace: '@codexsun/audit-addon',
  })
  const plan = new DeploymentPlanner(addonCatalog).createPlan({
    ...platformProfile,
    addons: ['audit-addon'],
  })

  assert.equal(
    plan.components.find(({ id }) => id === 'platform-api').buildWorkspaces.at(-1),
    '@codexsun/audit-addon',
  )
  assert.match(renderDockerCompose(plan), /CODEXSUN_ADDONS: audit-addon/u)
})

async function readJson(relativePath) {
  return JSON.parse(await readFile(join(projectRoot, relativePath), 'utf8'))
}
