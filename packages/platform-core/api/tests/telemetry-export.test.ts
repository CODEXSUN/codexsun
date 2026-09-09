import assert from 'node:assert/strict'
import { isSpanContextValid, trace } from '@opentelemetry/api'
import { createServer } from 'node:http'
import { test } from 'node:test'
import Fastify from 'fastify'
import { PlatformApiObservability } from '../src/index.js'

test('exports HTTP traces and metrics to the configured OTLP collector', async () => {
  const receivedPaths: string[] = []
  const collector = createServer((request, response) => {
    receivedPaths.push(request.url ?? '')
    request.resume()
    response.writeHead(200).end()
  })

  await new Promise<void>((resolve) => collector.listen(0, '127.0.0.1', resolve))
  const address = collector.address()
  assert(address && typeof address === 'object')

  const observability = new PlatformApiObservability(
    { application: 'export-test', component: 'export-test-api', version: '1.2.3' },
    {
      APP_ENV: 'test',
      LOG_LEVEL: 'silent',
      LOG_PRETTY: 'false',
      OTEL_EXPORTER_OTLP_ENDPOINT: `http://127.0.0.1:${address.port}`,
      OTEL_METRIC_EXPORT_INTERVAL: '60000',
      OTEL_SDK_DISABLED: 'false',
    },
  )
  observability.start()

  const server = Fastify(observability.fastifyOptions())
  observability.register(server)
  server.addHook('onClose', () => observability.shutdown())
  server.get('/health', async () => ({
    activeRequestSpan: isSpanContextValid(trace.getActiveSpan()?.spanContext() ?? {}),
    status: 'ok',
  }))

  try {
    const response = await server.inject({ method: 'GET', url: '/health' })
    assert.equal(response.statusCode, 200)
    assert.equal(response.json().activeRequestSpan, true)
    await server.close()
  } finally {
    if (server.server.listening) await server.close()
    await new Promise<void>((resolve, reject) =>
      collector.close((error) => (error ? reject(error) : resolve())),
    )
  }

  assert(receivedPaths.includes('/v1/traces'))
  assert(receivedPaths.includes('/v1/metrics'))
})
