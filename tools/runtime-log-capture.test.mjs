import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createRuntimeLogCapture, formatRuntimeLogLine } from './runtime-log-capture.mjs'

test('formats structured API events as compact component lines', () => {
  const formatted = formatRuntimeLogLine(
    'platform-api',
    JSON.stringify({
      application: 'platform',
      component: 'platform-api',
      durationSeconds: 0.0142,
      environment: 'development',
      event: 'http.request.completed',
      level: 30,
      method: 'GET',
      msg: 'request completed',
      requestId: '12345678-1234-1234-1234-123456789012',
      route: '/health',
      statusCode: 200,
      time: '2026-09-09T02:44:25.316Z',
      version: '0.1.4',
    }),
  )

  assert.match(
    formatted.clean,
    /INFO[ ]{2}\[platform\/api\s*\] GET \/health -> 200 14ms req=12345678/u,
  )
  assert.doesNotMatch(formatted.clean, /application|environment|version/u)
})

test('stores readable, structured, and failure-only component logs', async (context) => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'codexsun-runtime-log-'))
  context.after(() => rm(projectRoot, { force: true, recursive: true }))
  const capture = await createRuntimeLogCapture({ componentId: 'docs-api', projectRoot })

  capture.write(
    'stdout',
    `${JSON.stringify({ application: 'docs', component: 'docs-api', level: 30, msg: 'ready', time: '2026-09-09T02:44:25.316Z' })}\n`,
  )
  capture.write(
    'stderr',
    `${JSON.stringify({ application: 'docs', component: 'docs-api', err: { message: 'boom' }, event: 'runtime.failed', level: 50, msg: 'startup failed', time: '2026-09-09T02:44:26.316Z' })}\n`,
  )
  await capture.close()

  const runtimeRoot = join(projectRoot, 'storage/app/private/runtime')
  const clean = await readFile(join(runtimeRoot, 'logs/docs-api.log'), 'utf8')
  const structured = await readFile(join(runtimeRoot, 'logs/docs-api.jsonl'), 'utf8')
  const failures = await readFile(join(runtimeRoot, 'failures/docs-api.jsonl'), 'utf8')

  assert.match(clean, /docs\/api/u)
  assert.match(clean, /startup failed: boom/u)
  assert.equal(structured.trim().split('\n').length, 2)
  assert.equal(failures.trim().split('\n').length, 1)
  assert.equal(JSON.parse(failures).event, 'runtime.failed')
})
