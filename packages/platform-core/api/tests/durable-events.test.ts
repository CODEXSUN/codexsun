import assert from 'node:assert/strict'
import test from 'node:test'
import {
  PlatformDurableEventDispatcher,
  PlatformDurableEventRegistry,
  type PlatformDurableEvent,
  type PlatformDurableEventConsumer,
  type PlatformDurableEventDelivery,
  type PlatformDurableEventStore,
} from '../src/index.js'

test('durable dispatcher completes a claimed event exactly once for one consumer', async () => {
  const store = new MemoryDurableEventStore([delivery(0)])
  const dispatcher = new PlatformDurableEventDispatcher(store, { clock })
  const received: string[] = []

  const result = await dispatcher.dispatch(consumer(async (event) => received.push(event.eventId)))

  assert.deepEqual(result, { attempted: 1, completed: 1, failed: 0 })
  assert.deepEqual(received, ['event-1'])
  assert.equal(store.completed.length, 1)
  assert.equal(store.recovered, 1)
})

test('durable dispatcher stores a bounded retry after a consumer failure', async () => {
  const store = new MemoryDurableEventStore([delivery(1)])
  const dispatcher = new PlatformDurableEventDispatcher(store, {
    clock,
    maxAttempts: 3,
    retryDelay: () => 500,
  })

  const result = await dispatcher.dispatch(
    consumer(async () => {
      throw new Error('temporary failure')
    }),
  )

  assert.deepEqual(result, { attempted: 1, completed: 0, failed: 1 })
  assert.equal(store.failures[0]?.failure.message, 'temporary failure')
  assert.equal(store.failures[0]?.nextAttemptAt?.toISOString(), '2026-09-11T00:00:00.500Z')
})

test('durable dispatcher marks the final failed attempt without another retry', async () => {
  const store = new MemoryDurableEventStore([delivery(3)])
  const terminalFailures: string[] = []
  const dispatcher = new PlatformDurableEventDispatcher(store, {
    clock,
    maxAttempts: 3,
    onTerminalFailure: (failedDelivery, failure) => {
      terminalFailures.push(`${failedDelivery.event.eventId}:${failure.message}`)
    },
  })

  await dispatcher.dispatch(
    consumer(async () => {
      throw new Error('permanent failure')
    }),
  )

  assert.equal(store.failures[0]?.nextAttemptAt, undefined)
  assert.deepEqual(terminalFailures, ['event-1:permanent failure'])
})

test('durable registry rejects a consumer for an undeclared event', () => {
  const registry = new PlatformDurableEventRegistry(
    [manifest('billing', [{ id: 'orders.placed', versionRange: '^1.0.0' }])],
    new MemoryDurableEventStore([]),
  )

  assert.throws(
    () =>
      registry.forModule('billing').register({
        eventTypes: ['orders.cancelled'],
        handle: async () => {},
      }),
    /cannot consume undeclared event/u,
  )
})

function clock(): Date {
  return new Date('2026-09-11T00:00:00.000Z')
}

function consumer(
  handle: (event: PlatformDurableEvent) => Promise<void>,
): PlatformDurableEventConsumer {
  return { consumerId: 'orders.billing', eventTypes: ['orders.placed'], handle }
}

function delivery(attempts: number): PlatformDurableEventDelivery {
  return {
    attempts,
    consumerId: 'orders.billing',
    event: {
      eventId: 'event-1',
      eventType: 'orders.placed',
      occurredAt: '2026-09-11T00:00:00.000Z',
      payload: { orderId: 'order-1' },
      publisherId: 'orders',
      version: '1.0.0',
    },
    state: 'processing',
  }
}

class MemoryDurableEventStore implements PlatformDurableEventStore {
  readonly completed: PlatformDurableEventDelivery[] = []
  readonly failures: {
    delivery: PlatformDurableEventDelivery
    failure: Error
    nextAttemptAt?: Date
  }[] = []
  recovered = 0

  constructor(private readonly deliveries: PlatformDurableEventDelivery[]) {}

  async append(): Promise<void> {}

  async claim(): Promise<PlatformDurableEventDelivery | undefined> {
    return this.deliveries.shift()
  }

  async complete(delivery: PlatformDurableEventDelivery): Promise<void> {
    this.completed.push(delivery)
  }

  async fail(
    delivery: PlatformDurableEventDelivery,
    failure: Error,
    nextAttemptAt: Date | undefined,
  ): Promise<void> {
    this.failures.push({ delivery, failure, nextAttemptAt })
  }

  async recoverExpired(): Promise<void> {
    this.recovered += 1
  }
}

function manifest(id: string, consumes: readonly { id: string; versionRange: string }[]) {
  return {
    capabilities: [],
    configuration: [],
    consumes,
    dependencies: [],
    description: `${id} test module`,
    extensionPoints: [],
    extensions: [],
    id,
    kind: 'feature' as const,
    lifecycle: { activate() {}, deactivate() {}, install() {}, uninstall() {}, upgrade() {} },
    owner: 'platform-tests',
    platformVersionRange: '^0.1.0',
    publicContracts: [],
    publishes: [],
    scope: 'platform',
    version: '1.0.0',
  }
}
