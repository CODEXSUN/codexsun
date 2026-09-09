import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import type { DeveloperToolsService } from '../src/modules/developer-tools/index.js'
import { GitDeliveryRepository } from '../src/modules/git-delivery/git-delivery.repository.js'
import { readReleaseProfile } from '../src/modules/git-delivery/git-delivery.runner.js'
import {
  GitDeliveryPolicyError,
  GitDeliveryService,
} from '../src/modules/git-delivery/git-delivery.service.js'
import type { ProjectService } from '../src/modules/projects/index.js'

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
  try {
    const repository = new GitDeliveryRepository(join(root, 'delivery.json'))
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
    const service = new GitDeliveryService(repository, projects, developerTools)
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
    assert.equal(flow.status, 'complete')
    assert.equal(flow.steps.find(({ id }) => id === 'commit')?.status, 'complete')
    assert.deepEqual(actions, [
      { action: 'commit', message: '#10 - Add delivery flow', stageAll: true },
    ])
    assert.equal(service.list('00000000-0000-4000-8000-000000000001').flows.length, 1)
  } finally {
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
  const service = new GitDeliveryService(repository, projects, developerTools)
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
