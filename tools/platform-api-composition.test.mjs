import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import test from 'node:test'
import { buildPlatformApi } from '../dist/apps/platform/api/app.js'
import { readEnvironment } from '../dist/apps/platform/api/config.js'
import { PlatformShutdownRegistry } from '../dist/packages/platform-core/api/index.js'

const lifecycle = {
  activate() {},
  deactivate() {},
  install() {},
  uninstall() {},
  upgrade() {},
}

test('Platform API registers module plugins in framework dependency order', async () => {
  const registrationOrder = []
  const environment = readEnvironment({
    ...process.env,
    APP_ENV: 'test',
    LOG_PRETTY: 'false',
    PLATFORM_API_PORT: '6197',
    PLATFORM_WEB_ORIGIN: 'http://127.0.0.1:6297',
  })
  const systemModule = createModule('system', '1.0.0', [], registrationOrder)
  const identityModule = createModule(
    'identity',
    '1.0.0',
    [{ id: 'system', versionRange: '^1.0.0' }],
    registrationOrder,
  )
  const { server } = await buildPlatformApi({
    database: fakeDatabase(),
    environment,
    moduleRuntime: false,
    modules: [identityModule, systemModule],
    storage: fakeStorage(),
  })

  try {
    await server.ready()
    assert.deepEqual(registrationOrder, ['system', 'identity'])
  } finally {
    await server.close()
  }
})

test('Platform API reports composed modules and readiness components', async () => {
  const { server } = await buildPlatformApi({
    database: fakeDatabase(),
    environment: testEnvironment(),
    moduleRuntime: false,
    readinessProbes: [
      { check: async () => {}, name: 'database' },
      { check: async () => {}, name: 'storage' },
    ],
    storage: fakeStorage(),
  })

  try {
    const runtime = await server.inject({ method: 'GET', url: '/api/system/runtime' })
    const readiness = await server.inject({ method: 'GET', url: '/health/ready' })

    assert.equal(runtime.statusCode, 200)
    assert.deepEqual(
      runtime.json().data.modules.map(({ id }) => id),
      ['module-runtime', 'system'],
    )
    assert.equal(readiness.statusCode, 200)
    assert.deepEqual(readiness.json().data.components, [
      { moduleId: 'platform', name: 'database', status: 'ready' },
      { moduleId: 'platform', name: 'storage', status: 'ready' },
    ])
  } finally {
    await server.close()
  }
})

test('Platform modules contribute owned readiness probes', async () => {
  const module = createModule('search', '1.0.0', [], [])
  module.readiness = [
    {
      check: async () => {},
      moduleId: 'search',
      name: 'search-index',
      timeoutMs: 50,
    },
  ]
  const { server } = await buildPlatformApi({
    database: fakeDatabase(),
    environment: testEnvironment(),
    moduleRuntime: false,
    modules: [module],
    storage: fakeStorage(),
  })

  try {
    const response = await server.inject({ method: 'GET', url: '/health/ready' })
    assert.equal(response.statusCode, 200)
    assert.deepEqual(
      response.json().data.components.find(({ name }) => name === 'search-index'),
      { moduleId: 'search', name: 'search-index', status: 'ready' },
    )
  } finally {
    await server.close()
  }
})

test('Platform readiness reports every failed dependency', async () => {
  const { server } = await buildPlatformApi({
    database: fakeDatabase(),
    environment: testEnvironment(),
    moduleRuntime: false,
    readinessProbes: [
      {
        check: async () => {
          throw new Error('offline')
        },
        name: 'database',
      },
      { check: async () => {}, name: 'storage' },
    ],
    storage: fakeStorage(),
  })

  try {
    const response = await server.inject({ method: 'GET', url: '/health/ready' })
    assert.equal(response.statusCode, 503)
    assert.equal(response.json().data.status, 'not-ready')
    assert.equal(response.json().data.components[0].status, 'not-ready')
  } finally {
    await server.close()
  }
})

test('Platform request context carries correlation, locale, request, and cancellation data', async () => {
  const contextModule = createModule('context', '1.0.0', [], [])
  contextModule.createPlugin = (context) => async (server) => {
    server.get('/context', async () => {
      const active = context.requestContext.require()
      return {
        actorKind: active.actor.kind,
        correlationId: active.correlationId,
        locale: active.locale,
        requestId: active.requestId,
        signalAborted: active.signal.aborted,
      }
    })
  }
  const { server } = await buildPlatformApi({
    database: fakeDatabase(),
    environment: testEnvironment(),
    moduleRuntime: false,
    modules: [contextModule],
    resolveActor: () => ({ id: 'test-user', kind: 'user' }),
    storage: fakeStorage(),
  })

  try {
    const response = await server.inject({
      headers: { 'accept-language': 'en-IN,en;q=0.9', 'x-correlation-id': 'context-test' },
      method: 'GET',
      url: '/context',
    })
    assert.equal(response.statusCode, 200)
    assert.deepEqual(response.json(), {
      actorKind: 'user',
      correlationId: 'context-test',
      locale: 'en-IN',
      requestId: response.headers['x-request-id'],
      signalAborted: false,
    })
  } finally {
    await server.close()
  }
})

test('Platform shutdown tasks close once in reverse order', async () => {
  const events = []
  const shutdown = new PlatformShutdownRegistry()
  shutdown.register({ close: () => events.push('first'), name: 'first' })
  shutdown.register({ close: () => events.push('second'), name: 'second' })

  await shutdown.closeAll()
  await shutdown.closeAll()

  assert.deepEqual(events, ['second', 'first'])
})

function createModule(id, version, dependencies, registrationOrder) {
  return {
    createPlugin: () => async () => {
      registrationOrder.push(id)
    },
    manifest: {
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
      owner: 'platform-tests',
      platformVersionRange: '^0.1.0',
      publicContracts: [],
      publishes: [],
      scope: 'platform',
      version,
    },
  }
}

function fakeDatabase() {
  return { check: async () => {}, client: {}, close: async () => {} }
}

function fakeStorage() {
  return {
    check: async () => {},
    privateDirectory: resolve('storage/app/private'),
    publicDirectory: resolve('storage/app/public'),
  }
}

function testEnvironment() {
  return readEnvironment({
    ...process.env,
    APP_ENV: 'test',
    LOG_PRETTY: 'false',
    PLATFORM_API_PORT: '6197',
    PLATFORM_WEB_ORIGIN: 'http://127.0.0.1:6297',
  })
}
