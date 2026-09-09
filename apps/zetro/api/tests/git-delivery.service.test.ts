import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { ZetroDatabase } from '../src/infrastructure/zetro-database.js'
import type { DeveloperToolsService } from '../src/modules/developer-tools/index.js'
import { GitDeliveryRepository } from '../src/modules/git-delivery/git-delivery.repository.js'
import { readReleaseProfile } from '../src/modules/git-delivery/git-delivery.runner.js'
import {
  GitDeliveryPolicyError,
  GitDeliveryService,
} from '../src/modules/git-delivery/git-delivery.service.js'
import type { ProjectService } from '../src/modules/projects/index.js'
import { LocalSystemTaskQueue } from '../src/modules/system-tasks/system-tasks.queue.js'
import { SystemTaskRepository } from '../src/modules/system-tasks/system-tasks.repository.js'
import { SystemTaskService } from '../src/modules/system-tasks/system-tasks.service.js'

test('Git delivery detects repository-owned release commands', async () => {
  const root = await mkdtemp(join(tmpdir(), 'zetro-delivery-profile-'))
  try {
    await writeFile(
      join(root, 'package.json'),
      JSON.stringify({
        scripts: { 'changelog:append': 'node changelog.mjs', 'version:bump': 'node bump.mjs' },
        version: '1.4.9',
      }),
    )
    assert.deepEqual(await readReleaseProfile(root), {
      canBumpVersion: true,
      canWriteChangelog: true,
      currentVersion: '1.4.9',
      nextVersion: '1.4.10',
    })
  } finally {
    await rm(root, { force: true, recursive: true })
  }
})

test('Git delivery records a reviewed local commit system task', async () => {
  const root = await mkdtemp(join(tmpdir(), 'zetro-delivery-flow-'))
  const database = await ZetroDatabase.openSqlite(join(root, 'zetro.sqlite'))
  const systemTasks = new SystemTaskService(
    new SystemTaskRepository(database),
    new LocalSystemTaskQueue(),
  )
  try {
    await systemTasks.initialize()
    const repository = new GitDeliveryRepository(database, join(root, 'delivery.json'))
    await repository.initialize()
    const actions: unknown[] = []
    const snapshot = {
      branch: 'codex/delivery',
      changedFiles: ['README.md'],
      head: 'a'.repeat(40),
      remoteUrl: 'https://github.com/CODEXSUN/codexsun.git',
      upstream: 'origin/codex/delivery',
    }
    const projects = {
      get: () => ({ githubUrl: snapshot.remoteUrl, repositoryPath: root }),
    } as unknown as ProjectService
    const developerTools = {
      deliverySnapshot: async () => snapshot,
      runAction: async (_projectId: string, action: unknown) => actions.push(action),
    } as unknown as DeveloperToolsService
    const service = new GitDeliveryService(repository, projects, developerTools, systemTasks)
    await systemTasks.start()
    const input = {
      bumpVersion: false,
      commitMessage: '#10 - Add delivery flow',
      databaseUpdate: 'no' as const,
      expectedFiles: ['README.md'],
      expectedHead: snapshot.head,
      note: 'Added the delivery flow.',
      push: false,
      syncStrategy: 'none' as const,
      title: 'Add delivery flow',
      writeChangelog: false,
    }
    const flow = await service.run('00000000-0000-4000-8000-000000000001', input)
    const completed = await waitForFlow(service, flow.projectId, flow.id)
    assert.equal(completed.status, 'complete')
    assert.equal(completed.steps.find(({ id }) => id === 'commit')?.status, 'complete')
    assert.deepEqual(actions, [
      { action: 'commit', message: '#10 - Add delivery flow', stageAll: true },
    ])
    assert.equal(service.list('00000000-0000-4000-8000-000000000001').flows.length, 1)
  } finally {
    await systemTasks.close()
    await database.close()
    await rm(root, { force: true, recursive: true })
  }
})

test('Git delivery rejects repository changes after preview', async () => {
  const repository = {
    getGlobal: () => ({ enabled: true }),
    getProject: () => ({ enabled: true, inheritGlobal: true }),
  } as unknown as GitDeliveryRepository
  const projects = { get: () => ({ repositoryPath: 'unused' }) } as unknown as ProjectService
  const developerTools = {
    deliverySnapshot: async () => ({ changedFiles: ['new.ts'], head: 'b'.repeat(40) }),
  } as unknown as DeveloperToolsService
  const systemTasks = { register() {} } as unknown as SystemTaskService
  const service = new GitDeliveryService(repository, projects, developerTools, systemTasks)
  await assert.rejects(
    service.run('00000000-0000-4000-8000-000000000001', {
      bumpVersion: false,
      commitMessage: 'Reviewed change',
      databaseUpdate: 'no',
      expectedFiles: ['old.ts'],
      expectedHead: 'a'.repeat(40),
      note: 'Reviewed change.',
      push: false,
      syncStrategy: 'none',
      title: 'Reviewed change',
      writeChangelog: false,
    }),
    GitDeliveryPolicyError,
  )
})

async function waitForFlow(service: GitDeliveryService, projectId: string, flowId: string) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const flow = service.list(projectId).flows.find(({ id }) => id === flowId)
    if (flow && ['blocked', 'complete', 'failed', 'stopped'].includes(flow.status)) return flow
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  throw new Error('Git delivery system task did not complete.')
}
