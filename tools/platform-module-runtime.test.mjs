import assert from 'node:assert/strict'
import test from 'node:test'
import { ModuleRegistry } from '../dist/packages/framework/index.js'
import {
  DeclaredPlatformEventBus,
  PlatformDiagnosticRegistry,
} from '../dist/packages/platform-core/api/index.js'
import {
  MemoryModuleRuntimeRepository,
  ModuleRuntimeCoordinator,
} from '../dist/apps/platform/api/modules/module-runtime/index.js'

test('module runtime applies module-owned data in dependency order and skips it on restart', async () => {
  const operations = []
  const repository = new MemoryModuleRuntimeRepository()
  const runtime = runtimeModule()
  const feature = featureModule('feature', 'checksum-a', operations)
  const plan = composition([feature, runtime])
  const first = coordinator(plan, [feature, runtime], repository, operations)

  const preparation = await first.prepare()
  assert.deepEqual(preparation.appliedMigrationIds, ['feature:0001-feature'])
  assert.deepEqual(preparation.appliedSeedIds, ['feature:0001-feature-defaults'])
  assert.equal(first.canServe('feature'), false)
  assert.deepEqual([...preparation.newModuleIds], ['runtime', 'feature'])
  assert.deepEqual(operations, ['migration:feature', 'seed:feature'])
  assert.deepEqual(
    (await repository.listModules()).map(({ moduleId, state }) => [moduleId, state]),
    [
      ['feature', 'installed'],
      ['runtime', 'installed'],
    ],
  )

  await first.markActive()
  assert.equal(first.canServe('feature'), true)
  assert.equal((await repository.getModule('feature')).state, 'active')

  const restarted = coordinator(plan, [feature, runtime], repository, operations)
  const restartPreparation = await restarted.prepare()
  assert.deepEqual(restartPreparation.appliedMigrationIds, [])
  assert.deepEqual(restartPreparation.appliedSeedIds, [])
  assert.deepEqual([...restartPreparation.newModuleIds], [])
  assert.deepEqual(
    [...restartPreparation.previousVersions],
    [
      ['runtime', '1.0.0'],
      ['feature', '1.0.0'],
    ],
  )
  assert.deepEqual(operations, ['migration:feature', 'seed:feature'])
})

test('module runtime blocks changed migration checksums and records module failure', async () => {
  const operations = []
  const repository = new MemoryModuleRuntimeRepository()
  const runtime = runtimeModule()
  const firstFeature = featureModule('feature', 'checksum-a', operations)
  const plan = composition([runtime, firstFeature])
  await coordinator(plan, [runtime, firstFeature], repository, operations).prepare()

  const changedFeature = featureModule('feature', 'checksum-b', operations)
  await assert.rejects(
    () => coordinator(plan, [runtime, changedFeature], repository, operations).prepare(),
    /checksum changed after application/u,
  )
  const record = await repository.getModule('feature')
  assert.equal(record.state, 'failed')
  assert.equal(record.lastFailureCode, 'MODULE_PREPARATION_FAILED')
})

test('module runtime blocks schema drift after queued migrations run', async () => {
  const operations = []
  const repository = new MemoryModuleRuntimeRepository()
  const runtime = runtimeModule()
  const feature = featureModule('feature', 'checksum-a', operations)
  feature.manifest.dataSchema = { checksum: `sha256:${'a'.repeat(64)}`, version: '1.0.0' }
  feature.schema = {
    checksum: `sha256:${'a'.repeat(64)}`,
    inspect: async () => `sha256:${'b'.repeat(64)}`,
    version: '1.0.0',
  }

  await assert.rejects(
    () =>
      coordinator(
        composition([runtime, feature]),
        [runtime, feature],
        repository,
        operations,
      ).prepare(),
    /schema checksum mismatch/u,
  )
  assert.equal((await repository.getModule('feature')).state, 'failed')
})

function coordinator(plan, modules, repository, operations) {
  const diagnostics = new PlatformDiagnosticRegistry()
  const events = new DeclaredPlatformEventBus(plan.modules)
  return new ModuleRuntimeCoordinator(
    plan,
    modules,
    repository,
    {
      run: (action) => action({ context: operations, repository }),
    },
    diagnostics,
    events.forModule('runtime'),
    () => new Date('2026-09-08T00:00:00.000Z'),
  )
}

function composition(modules) {
  const registry = new ModuleRegistry()
  for (const module of modules) registry.register(module.manifest)
  return registry.createCompositionPlan('0.1.0')
}

function runtimeModule() {
  return moduleDefinition('runtime', [], {
    publishes: [{ id: 'module-runtime.module-prepared', version: '1.0.0' }],
  })
}

function featureModule(id, checksum, operations) {
  return moduleDefinition(id, [{ id: 'runtime', versionRange: '^1.0.0' }], {
    migrations: [
      {
        checksum,
        id: '0001-feature',
        up: async (context) => context.push(`migration:${id}`),
        version: '1.0.0',
      },
    ],
    seeds: [
      {
        checksum: 'seed-checksum-a',
        id: '0001-feature-defaults',
        run: async (context) => context.push(`seed:${id}`),
        version: '1.0.0',
      },
    ],
    operations,
  })
}

function moduleDefinition(id, dependencies, additions = {}) {
  return {
    createPlugin: () => async () => {},
    migrations: additions.migrations ?? [],
    seeds: additions.seeds ?? [],
    manifest: {
      capabilities: [`${id}.read`],
      configuration: [],
      consumes: [],
      dependencies,
      description: `${id} test module`,
      extensionPoints: [],
      extensions: [],
      id,
      kind: 'core',
      lifecycle: {
        activate() {},
        deactivate() {},
        install() {},
        uninstall() {},
        upgrade() {},
      },
      owner: 'platform-tests',
      platformVersionRange: '^0.1.0',
      publicContracts: [],
      publishes: additions.publishes ?? [],
      scope: 'platform',
      version: '1.0.0',
    },
  }
}
