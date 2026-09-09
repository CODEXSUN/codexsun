import assert from 'node:assert/strict'
import { test } from 'node:test'
import Fastify from 'fastify'
import { createPlatformLogger, PlatformApiObservability, PlatformTelemetry } from '../src/index.js'

const identity = { application: 'test-app', component: 'test-api', version: '1.2.3' }
const testEnvironment = {
  APP_ENV: 'test',
  LOG_LEVEL: 'silent',
  LOG_PRETTY: 'false',
  OTEL_SDK_DISABLED: 'true',
}

test('adds validated request and correlation identifiers', async () => {
  const observability = new PlatformApiObservability(identity, testEnvironment)
  observability.start()
  const server = Fastify(observability.fastifyOptions())
  observability.register(server)
  server.addHook('onClose', () => observability.shutdown())
  server.get('/health', async () => ({ status: 'ok' }))

  const response = await server.inject({
    headers: { 'x-correlation-id': 'correlation-1', 'x-request-id': 'request-1' },
    method: 'GET',
    url: '/health',
  })

  assert.equal(response.headers['x-correlation-id'], 'correlation-1')
  assert.equal(response.headers['x-request-id'], 'request-1')
  assert.deepEqual(observability.logger.bindings(), {
    application: 'test-app',
    component: 'test-api',
    environment: 'test',
    service: 'test-api',
    version: '1.2.3',
  })
  await server.close()
})

test('replaces invalid caller identifiers', async () => {
  const observability = new PlatformApiObservability(identity, testEnvironment)
  const server = Fastify(observability.fastifyOptions())
  observability.register(server)
  server.addHook('onClose', () => observability.shutdown())
  server.get('/health', async () => ({ status: 'ok' }))

  const response = await server.inject({
    headers: { 'x-correlation-id': 'invalid value', 'x-request-id': 'invalid value' },
    method: 'GET',
    url: '/health',
  })

  assert.match(String(response.headers['x-request-id']), /^[0-9a-f-]{36}$/u)
  assert.equal(response.headers['x-correlation-id'], response.headers['x-request-id'])
  await server.close()
})

test('keeps telemetry inactive when the SDK is disabled', async () => {
  const telemetry = new PlatformTelemetry(identity, testEnvironment)
  assert.equal(telemetry.start(), false)
  await telemetry.shutdown()
})

test('writes production JSON with identity, redaction, and serialized errors', () => {
  let output = ''
  const logger = createPlatformLogger(
    identity,
    { ...testEnvironment, APP_ENV: 'production', LOG_LEVEL: 'info' },
    { write: (message) => (output += message) },
  )

  logger.error(
    { err: new Error('failed safely'), headers: { authorization: 'secret-value' } },
    'request failed',
  )
  const record = JSON.parse(output) as Record<string, unknown>

  assert.equal(record.application, 'test-app')
  assert.equal(record.component, 'test-api')
  assert.equal(record.environment, 'production')
  assert.equal(record.version, '1.2.3')
  assert.deepEqual(record.headers, { authorization: '[REDACTED]' })
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(record.err as Record<string, unknown>).filter(([key]) => key !== 'stack'),
    ),
    { message: 'failed safely', type: 'Error' },
  )
})
