import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { DockerControlGateway } from '../src/modules/orchestration/infrastructure/docker-control.gateway.js'
import { DockerControlStore } from '../src/modules/orchestration/infrastructure/docker-control.store.js'

test('docker control remains unavailable until the local boundary is enabled', async (context) => {
  const root = await mkdtemp(join(tmpdir(), 'codexsun-orship-docker-'))
  context.after(() => rm(root, { force: true, recursive: true }))
  const store = new DockerControlStore(root)
  const gateway = new DockerControlGateway(
    join(root, 'missing-docker.sock'),
    'codexsun.orship.manage=true',
    false,
    store,
  )

  const result = await gateway.list()
  assert.equal(result.available, false)
  assert.deepEqual(result.containers, [])
  assert.equal(result.reason, 'Docker control is disabled.')

  await store.record('container-123', 'restart', 'Container restarted.')
  const actions = await readFile(
    join(root, 'storage/app/private/orship/docker/actions.jsonl'),
    'utf8',
  )
  assert.match(actions, /container-123/u)
  assert.match(actions, /restart/u)
  gateway.close()
})
