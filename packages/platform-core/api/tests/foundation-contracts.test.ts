import assert from 'node:assert/strict'
import test from 'node:test'
import { z } from 'zod'
import {
  anonymousPlatformActor,
  DenyByDefaultPlatformAuthorizer,
  PlatformAuthorizationError,
  PlatformConfiguration,
  PlatformReadinessRegistry,
  requirePlatformAuthorization,
} from '../src/index.js'

test('configuration parses once and exposes selected public values', () => {
  const configuration = PlatformConfiguration.parse(
    z.object({ publicOrigin: z.url(), secret: z.string().min(1) }),
    { publicOrigin: 'https://example.com', secret: 'private' },
  )

  assert.equal(configuration.values.secret, 'private')
  assert.deepEqual(configuration.publicValues(['publicOrigin']), {
    publicOrigin: 'https://example.com',
  })
})

test('readiness registry keeps module ownership and bounds slow probes', async () => {
  const registry = new PlatformReadinessRegistry()
  registry.register({ check: async () => {}, moduleId: 'system', name: 'system' })
  registry.register({
    check: () => new Promise(() => {}),
    moduleId: 'slow-module',
    name: 'slow',
    timeoutMs: 5,
  })

  assert.deepEqual(await registry.checkAll(), [
    { moduleId: 'system', name: 'system', status: 'ready' },
    {
      message: 'The slow readiness probe timed out.',
      moduleId: 'slow-module',
      name: 'slow',
      status: 'not-ready',
    },
  ])
})

test('authorization denies by default without defining Identity policy', async () => {
  await assert.rejects(
    () =>
      requirePlatformAuthorization(new DenyByDefaultPlatformAuthorizer(), anonymousPlatformActor, {
        action: 'read',
        resource: 'system.runtime',
      }),
    PlatformAuthorizationError,
  )
})
