import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { DeploymentEvidenceService } from '../src/modules/orchestration/application/deployment-evidence.service.js'
import type { OrchestrationTarget } from '../src/modules/orchestration/domain/orchestration.ports.js'
import { LocalDeploymentInspector } from '../src/modules/orchestration/infrastructure/local-deployment.inspector.js'
import { DeploymentRecordStore } from '../src/modules/orchestration/infrastructure/deployment-record.store.js'

const platformTarget: OrchestrationTarget = {
  applicationId: 'platform',
  controllable: true,
  healthPath: '/health',
  id: 'platform-api',
  kind: 'api',
  port: 6010,
  protected: false,
}

test('deployment evidence appends redacted manual verification records', async (context) => {
  const root = await mkdtemp(join(tmpdir(), 'codexsun-orship-deployment-'))
  context.after(() => rm(root, { force: true, recursive: true }))
  const store = new DeploymentRecordStore(root)
  const service = new DeploymentEvidenceService(
    {
      async list() {
        return [platformTarget]
      },
    },
    new LocalDeploymentInspector(root),
    store,
    () => new Date('2026-09-09T12:00:00.000Z'),
  )

  const record = await service.createRecord({
    action: 'verify',
    exitCode: 0,
    output: 'token=visible postgres://operator:password@db.example/app',
    status: 'verified',
  })

  assert.equal(record.status, 'verified')
  assert.equal(record.output, 'token=[REDACTED] postgres://[REDACTED]')
  assert.deepEqual(await service.listRecords(), { records: [record] })
  const file = await readFile(
    join(root, 'storage/app/private/orship/deployments/platform/records.jsonl'),
    'utf8',
  )
  assert.equal(file.trim(), JSON.stringify(record))
})
