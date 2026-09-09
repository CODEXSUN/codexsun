import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ModuleCompositionError,
  ModuleLifecycleError,
  ModuleLifecycleExecutor,
  ModuleRegistry,
  ModuleRegistryError,
  parseModuleManifest,
} from '../dist/packages/framework/index.js'

const lifecycle = {
  activate() {},
  deactivate() {},
  install() {},
  uninstall() {},
  upgrade() {},
}

function moduleDefinition(id, version, dependencies = []) {
  return {
    capabilities: [`${id}.read`],
    configuration: [],
    consumes: [],
    dependencies,
    description: `${id} test module`,
    extensionPoints: [],
    extensions: [],
    id,
    kind: 'feature',
    lifecycle,
    owner: 'framework-tests',
    platformVersionRange: '^0.1.0',
    publicContracts: [],
    publishes: [],
    scope: 'test',
    version,
  }
}

test('registry resolves dependencies before consumers', () => {
  const registry = new ModuleRegistry()
  registry.register(
    moduleDefinition('identity', '1.2.0', [{ id: 'system', versionRange: '^1.0.0' }]),
  )
  registry.register(moduleDefinition('system', '1.0.0'))

  assert.deepEqual(
    registry.resolveCompositionOrder().map((module) => module.id),
    ['system', 'identity'],
  )
})

test('framework validates and preserves a module data schema contract', () => {
  const module = moduleDefinition('schema-owner', '1.1.0')
  module.dataSchema = { checksum: `sha256:${'a'.repeat(64)}`, version: '1.1.0' }

  const parsed = parseModuleManifest(module)
  assert.deepEqual(parsed.dataSchema, module.dataSchema)

  module.dataSchema.checksum = 'changed'
  assert.throws(() => parseModuleManifest(module), ModuleCompositionError)
})

test('composition resolves compatible add-on extensions in stable order', () => {
  const registry = new ModuleRegistry()
  const system = moduleDefinition('system', '1.0.0')
  system.extensionPoints = [{ cardinality: 'many', id: 'platform.commands', version: '1.0.0' }]
  registry.register(system)

  const addon = moduleDefinition('reporting-addon', '1.0.0', [
    { id: 'system', versionRange: '^1.0.0' },
  ])
  addon.kind = 'addon'
  addon.extensions = [
    {
      id: 'reporting.commands',
      order: 20,
      pointId: 'platform.commands',
      pointVersionRange: '^1.0.0',
    },
  ]
  registry.register(addon)

  const plan = registry.createCompositionPlan('0.1.0')
  assert.deepEqual(plan.extensions, [
    {
      contribution: {
        id: 'reporting.commands',
        order: 20,
        pointId: 'platform.commands',
        pointVersionRange: '^1.0.0',
      },
      contributorId: 'reporting-addon',
      point: { cardinality: 'many', id: 'platform.commands', version: '1.0.0' },
      providerId: 'system',
    },
  ])
  assert.equal(Object.isFrozen(plan.extensions[0]), true)
})

test('composition rejects unsafe extension bindings before startup', () => {
  const registry = new ModuleRegistry()
  const system = moduleDefinition('system', '1.0.0')
  system.extensionPoints = [{ cardinality: 'one', id: 'platform.shell', version: '1.0.0' }]
  registry.register(system)

  const addon = moduleDefinition('shell-addon', '1.0.0')
  addon.kind = 'addon'
  addon.extensions = [
    {
      id: 'shell-addon.shell',
      order: 10,
      pointId: 'platform.shell',
      pointVersionRange: '^2.0.0',
    },
    {
      id: 'shell-addon.missing',
      order: 20,
      pointId: 'platform.missing',
      pointVersionRange: '^1.0.0',
    },
  ]
  registry.register(addon)

  assert.throws(
    () => registry.createCompositionPlan('0.1.0'),
    (error) =>
      hasIssue(error, 'INCOMPATIBLE_EXTENSION_POINT') &&
      hasIssue(error, 'EXTENSION_DEPENDENCY_REQUIRED') &&
      hasIssue(error, 'MISSING_EXTENSION_POINT'),
  )
})

test('manifest parser reports incomplete and unknown fields without a runtime type error', () => {
  const invalid = moduleDefinition('unsafe-addon', '1.0.0')
  delete invalid.extensions
  invalid.unexpected = true

  assert.throws(
    () => parseModuleManifest(invalid),
    (error) =>
      error instanceof ModuleCompositionError &&
      error.issues.length === 2 &&
      error.issues.every(({ code }) => code === 'INVALID_MANIFEST') &&
      error.message.includes('extensions') &&
      error.message.includes('Unrecognized key'),
  )
})

test('registry reports missing and incompatible dependencies', () => {
  const missingRegistry = new ModuleRegistry()
  missingRegistry.register(
    moduleDefinition('identity', '1.0.0', [{ id: 'system', versionRange: '^1.0.0' }]),
  )
  assert.throws(
    () => missingRegistry.resolveCompositionOrder(),
    (error) => hasIssue(error, 'MISSING_DEPENDENCY'),
  )

  const incompatibleRegistry = new ModuleRegistry()
  incompatibleRegistry.register(moduleDefinition('system', '2.0.0'))
  incompatibleRegistry.register(
    moduleDefinition('identity', '1.0.0', [{ id: 'system', versionRange: '^1.0.0' }]),
  )
  assert.throws(
    () => incompatibleRegistry.resolveCompositionOrder(),
    (error) => hasIssue(error, 'INCOMPATIBLE_DEPENDENCY'),
  )
})

test('registry reports a complete dependency cycle path', () => {
  const registry = new ModuleRegistry()
  registry.register(
    moduleDefinition('system', '1.0.0', [{ id: 'identity', versionRange: '^1.0.0' }]),
  )
  registry.register(
    moduleDefinition('identity', '1.0.0', [{ id: 'system', versionRange: '^1.0.0' }]),
  )

  assert.throws(
    () => registry.resolveCompositionOrder(),
    (error) =>
      hasIssue(error, 'DEPENDENCY_CYCLE') &&
      error.message.includes('identity -> system -> identity'),
  )
})

test('registry returns every dependency issue and locks after planning', () => {
  const registry = new ModuleRegistry()
  registry.register(
    moduleDefinition('consumer', '1.0.0', [
      { id: 'missing-one', versionRange: '^1.0.0' },
      { id: 'missing-two', versionRange: '^1.0.0' },
    ]),
  )
  assert.throws(
    () => registry.createCompositionPlan('0.1.0'),
    (error) => error instanceof ModuleCompositionError && error.issues.length === 2,
  )

  const validRegistry = new ModuleRegistry()
  validRegistry.register(moduleDefinition('system', '1.0.0'))
  const plan = validRegistry.createCompositionPlan('0.1.0')
  assert.equal(Object.isFrozen(plan), true)
  assert.equal(Object.isFrozen(plan.modules), true)
  assert.throws(
    () => validRegistry.register(moduleDefinition('identity', '1.0.0')),
    (error) => error instanceof ModuleRegistryError && error.code === 'REGISTRY_LOCKED',
  )
})

test('manifest validation rejects duplicate capabilities and unsupported platforms', () => {
  const duplicateRegistry = new ModuleRegistry()
  const duplicate = moduleDefinition('system', '1.0.0')
  duplicate.capabilities = ['system.read', 'system.read']
  assert.throws(
    () => duplicateRegistry.register(duplicate),
    (error) => hasIssue(error, 'DUPLICATE_CAPABILITY'),
  )

  const platformRegistry = new ModuleRegistry()
  const unsupported = moduleDefinition('system', '1.0.0')
  unsupported.platformVersionRange = '^2.0.0'
  platformRegistry.register(unsupported)
  assert.throws(
    () => platformRegistry.createCompositionPlan('0.1.0'),
    (error) => hasIssue(error, 'INCOMPATIBLE_PLATFORM'),
  )
})

test('composition validates event publisher ownership, compatibility, and dependencies', () => {
  const missing = new ModuleRegistry()
  const missingConsumer = moduleDefinition('consumer', '1.0.0')
  missingConsumer.consumes = [{ id: 'task.created', versionRange: '^1.0.0' }]
  missing.register(missingConsumer)
  assert.throws(
    () => missing.createCompositionPlan('0.1.0'),
    (error) => hasIssue(error, 'MISSING_EVENT_PUBLISHER'),
  )

  const invalid = new ModuleRegistry()
  const publisher = moduleDefinition('publisher', '1.0.0')
  publisher.publishes = [{ id: 'task.created', version: '2.0.0' }]
  invalid.register(publisher)
  const consumer = moduleDefinition('consumer', '1.0.0')
  consumer.consumes = [{ id: 'task.created', versionRange: '^1.0.0' }]
  invalid.register(consumer)
  assert.throws(
    () => invalid.createCompositionPlan('0.1.0'),
    (error) =>
      hasIssue(error, 'INCOMPATIBLE_EVENT') && hasIssue(error, 'EVENT_DEPENDENCY_REQUIRED'),
  )

  const valid = new ModuleRegistry()
  publisher.publishes = [{ id: 'task.created', version: '1.2.0' }]
  consumer.dependencies = [{ id: 'publisher', versionRange: '^1.0.0' }]
  valid.register(publisher)
  valid.register(consumer)
  assert.deepEqual(
    valid.createCompositionPlan('0.1.0').modules.map(({ id }) => id),
    ['publisher', 'consumer'],
  )
})

test('lifecycle activation rolls back completed modules', async () => {
  const events = []
  const registry = new ModuleRegistry()
  registry.register(lifecycleModule('system', [], events))
  registry.register(
    lifecycleModule('identity', [{ id: 'system', versionRange: '^1.0.0' }], events, true),
  )
  const executor = new ModuleLifecycleExecutor(registry.createCompositionPlan('0.1.0'))

  await assert.rejects(
    () => executor.activate(),
    (error) => error instanceof ModuleLifecycleError && error.moduleId === 'identity',
  )
  assert.deepEqual(events, ['activate:system', 'activate:identity', 'deactivate:system'])
  assert.equal(executor.state, 'failed')
})

test('lifecycle deactivation uses reverse dependency order', async () => {
  const events = []
  const registry = new ModuleRegistry()
  registry.register(lifecycleModule('system', [], events))
  registry.register(lifecycleModule('identity', [{ id: 'system', versionRange: '^1.0.0' }], events))
  const executor = new ModuleLifecycleExecutor(registry.createCompositionPlan('0.1.0'))

  await executor.activate()
  await executor.deactivate()

  assert.deepEqual(events, [
    'activate:system',
    'activate:identity',
    'deactivate:identity',
    'deactivate:system',
  ])
  assert.equal(executor.state, 'stopped')
})

test('lifecycle install rolls back and upgrade receives both versions', async () => {
  const events = []
  const registry = new ModuleRegistry()
  const system = lifecycleModule('system', [], events)
  system.lifecycle.install = () => events.push('install:system')
  system.lifecycle.uninstall = () => events.push('uninstall:system')
  system.lifecycle.upgrade = ({ previousVersion, targetVersion }) =>
    events.push(`upgrade:system:${previousVersion}:${targetVersion}`)
  registry.register(system)

  const failing = lifecycleModule('identity', [{ id: 'system', versionRange: '^1.0.0' }], events)
  failing.lifecycle.install = () => {
    events.push('install:identity')
    throw new Error('install failed')
  }
  registry.register(failing)
  const executor = new ModuleLifecycleExecutor(registry.createCompositionPlan('0.1.0'))

  await assert.rejects(() => executor.install(), ModuleLifecycleError)
  assert.deepEqual(events, ['install:system', 'install:identity', 'uninstall:system'])

  const upgradeRegistry = new ModuleRegistry()
  upgradeRegistry.register(system)
  const upgradeExecutor = new ModuleLifecycleExecutor(
    upgradeRegistry.createCompositionPlan('0.1.0'),
  )
  await upgradeExecutor.upgrade(new Map([['system', '0.9.0']]))
  assert.equal(events.at(-1), 'upgrade:system:0.9.0:1.0.0')
})

test('lifecycle installs selected modules and reports structured phase events', async () => {
  const actions = []
  const reports = []
  const registry = new ModuleRegistry()
  const system = lifecycleModule('system', [], actions)
  system.lifecycle.install = () => actions.push('install:system')
  registry.register(system)
  const identity = lifecycleModule('identity', [{ id: 'system', versionRange: '^1.0.0' }], actions)
  identity.lifecycle.install = () => actions.push('install:identity')
  registry.register(identity)
  const executor = new ModuleLifecycleExecutor(
    registry.createCompositionPlan('0.1.0'),
    undefined,
    (event) => reports.push(event),
  )

  await executor.install(new Set(['identity']))

  assert.deepEqual(actions, ['install:identity'])
  assert.deepEqual(reports, [
    { moduleId: 'identity', phase: 'install', status: 'started' },
    { moduleId: 'identity', phase: 'install', status: 'completed' },
  ])
})

function lifecycleModule(id, dependencies, events, failActivation = false) {
  const definition = moduleDefinition(id, '1.0.0', dependencies)
  return {
    ...definition,
    lifecycle: {
      ...definition.lifecycle,
      activate() {
        events.push(`activate:${id}`)
        if (failActivation) throw new Error('activation failed')
      },
      deactivate() {
        events.push(`deactivate:${id}`)
      },
    },
  }
}

function hasIssue(error, code) {
  return (
    error instanceof ModuleCompositionError && error.issues.some((issue) => issue.code === code)
  )
}
