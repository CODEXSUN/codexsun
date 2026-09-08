import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DeclaredPlatformEventBus,
  InMemoryPlatformEventBus,
} from '../dist/packages/platform-core/api/index.js'

test('module event bus enforces declared publish and consume contracts', async () => {
  const clock = () => new Date('2026-09-08T00:00:00.000Z')
  const declared = new DeclaredPlatformEventBus(
    [
      manifest('publisher', [{ id: 'task.created', version: '1.0.0' }], []),
      manifest('consumer', [], [{ id: 'task.created', versionRange: '^1.0.0' }]),
    ],
    new InMemoryPlatformEventBus(),
    clock,
  )
  const received = []
  declared.forModule('consumer').subscribe('task.created', (event) => received.push(event))

  await declared.forModule('publisher').publish({
    correlationId: 'event-test',
    id: 'task.created',
    payload: { taskId: 'task-1' },
    version: '1.0.0',
  })

  assert.deepEqual(received, [
    {
      correlationId: 'event-test',
      id: 'task.created',
      occurredAt: '2026-09-08T00:00:00.000Z',
      payload: { taskId: 'task-1' },
      publisherId: 'publisher',
      version: '1.0.0',
    },
  ])
  await assert.rejects(
    () =>
      declared.forModule('publisher').publish({
        id: 'task.deleted',
        payload: {},
        version: '1.0.0',
      }),
    /cannot publish undeclared event/u,
  )
  assert.throws(
    () => declared.forModule('consumer').subscribe('task.deleted', () => {}),
    /cannot consume undeclared event/u,
  )
})

test('event publication reports subscriber failures to the publisher', async () => {
  const bus = new InMemoryPlatformEventBus()
  bus.subscribe('task.created', () => {
    throw new Error('consumer failed')
  })

  await assert.rejects(
    () =>
      bus.publish({
        id: 'task.created',
        occurredAt: new Date().toISOString(),
        payload: {},
        publisherId: 'publisher',
        version: '1.0.0',
      }),
    AggregateError,
  )
})

function manifest(id, publishes, consumes) {
  return {
    capabilities: [`${id}.read`],
    configuration: [],
    consumes,
    dependencies: [],
    description: `${id} test module`,
    extensionPoints: [],
    extensions: [],
    id,
    kind: 'feature',
    lifecycle: lifecycle(),
    owner: 'platform-tests',
    platformVersionRange: '^0.1.0',
    publicContracts: [],
    publishes,
    scope: 'platform',
    version: '1.0.0',
  }
}

function lifecycle() {
  return {
    activate() {},
    deactivate() {},
    install() {},
    uninstall() {},
    upgrade() {},
  }
}
