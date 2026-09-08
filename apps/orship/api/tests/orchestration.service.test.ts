import assert from 'node:assert/strict'
import test from 'node:test'
import type { ServiceSnapshot } from '@codexsun/orship-contracts'
import { OrchestrationService } from '../src/modules/orchestration/application/orchestration.service.js'
import type {
  OrchestrationProcessGateway,
  OrchestrationTarget,
} from '../src/modules/orchestration/domain/orchestration.ports.js'

const target: OrchestrationTarget = {
  applicationId: 'platform',
  controllable: true,
  healthPath: '/health',
  id: 'platform-api',
  kind: 'api',
  port: 6010,
  protected: false,
}

test('orchestration service summarizes live process state and delegates controls', async () => {
  const actions: string[] = []
  const gateway: OrchestrationProcessGateway = {
    async act(service, action) {
      actions.push(`${service.id}:${action}`)
    },
    async inspect() {
      return [snapshot()]
    },
    async readLogs(service) {
      return { lines: ['ready'], serviceId: service.id, updatedAt: '2026-09-08T00:00:00.000Z' }
    },
  }
  const service = new OrchestrationService(
    {
      async list() {
        return [target]
      },
    },
    gateway,
    () => new Date('2026-09-08T00:00:00.000Z'),
  )

  assert.deepEqual((await service.getOverview()).summary, {
    degraded: 0,
    offline: 0,
    online: 1,
    total: 1,
  })
  assert.equal((await service.runAction('platform-api', 'stop')).service.state, 'online')
  assert.deepEqual(actions, ['platform-api:stop'])
})

test('orchestration service blocks its protected control plane', async () => {
  const service = new OrchestrationService(
    {
      async list() {
        return [{ ...target, controllable: false, protected: true }]
      },
    },
    {
      async act() {},
      async inspect() {
        return [snapshot()]
      },
      async readLogs() {
        return { lines: [], serviceId: target.id, updatedAt: new Date().toISOString() }
      },
    },
  )
  await assert.rejects(() => service.runAction('platform-api', 'stop'), /cannot be controlled/u)
})

function snapshot(): ServiceSnapshot {
  return {
    applicationId: 'platform',
    checkedAt: '2026-09-08T00:00:00.000Z',
    controllable: true,
    cpuSeconds: 2,
    healthUrl: 'http://127.0.0.1:6010/health',
    healthy: true,
    id: 'platform-api',
    kind: 'api',
    latencyMs: 3,
    logsAvailable: true,
    memoryBytes: 1024,
    pid: 42,
    port: 6010,
    protected: false,
    state: 'online',
    uptimeSeconds: 20,
  }
}
