import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import Fastify from 'fastify'
import { AgentTaskRepository } from '../infrastructure/agent-task.repository.js'
import { registerAgentTaskRoutes } from '../presentation/agent-task.routes.js'
import { AgentTaskService } from './agent-task.service.js'

const conversationId = 'a0b0c0d0-1111-4111-8111-111111111111'
const turnId = '48a7f6ea-3793-49da-b846-02592c2f2223'

test('chat handoff is idempotent and survives a repository restart', () => {
  withDatabase((databasePath) => {
    const first = new AgentTaskRepository(databasePath)
    const service = new AgentTaskService(first, completedSource)
    const created = service.createFromChat({ conversationId, turnId })
    const repeated = service.createFromChat({ conversationId, turnId })
    assert.equal(repeated.id, created.id)
    assert.equal(service.list().length, 1)
    assert.equal(service.get(created.id).sourceResponse, 'Use one approved scope.')
    service.close()

    const second = new AgentTaskRepository(databasePath)
    assert.equal(second.list()[0]?.id, created.id)
    assert.equal(second.get(created.id)?.approvalStatus, 'awaiting-approval')
    second.close()
  })
})

test('task routes list, create, and return complete drafts', async () => {
  await withDatabase(async (databasePath) => {
    const server = Fastify()
    const service = new AgentTaskService(new AgentTaskRepository(databasePath), completedSource)
    await registerAgentTaskRoutes(server, service)
    const created = await server.inject({
      method: 'POST',
      payload: { conversationId, turnId },
      url: '/api/zetro/v1/agent-tasks/from-chat',
    })
    assert.equal(created.statusCode, 201)
    const taskId = (created.json() as { id: string }).id
    assert.equal((await server.inject('/api/zetro/v1/agent-tasks')).json().tasks.length, 1)
    assert.equal(
      (await server.inject(`/api/zetro/v1/agent-tasks/${taskId}`)).json().sourcePrompt,
      'Build the approved feature',
    )
    const saved = await server.inject({
      method: 'PUT',
      payload: {
        acceptanceCriteria: ['The requested behavior works.'],
        checks: ['git diff --check'],
        modulePath: 'apps/example',
        repositoryPath: 'E:/Workspace/example',
      },
      url: `/api/zetro/v1/agent-tasks/${taskId}/plan`,
    })
    assert.equal(saved.statusCode, 200)
    assert.equal(saved.json().modulePath, 'apps/example')
    const confirmed = await server.inject({
      method: 'POST',
      payload: { confirmed: true },
      url: `/api/zetro/v1/agent-tasks/${taskId}/confirm-review`,
    })
    assert.equal(confirmed.statusCode, 200)
    assert.ok(confirmed.json().reviewConfirmedAt)
    await server.close()
    service.close()
  })
})

test('source validation prevents incomplete chat turns from becoming drafts', () => {
  withDatabase((databasePath) => {
    const service = new AgentTaskService(new AgentTaskRepository(databasePath), {
      getTaskSource() {
        throw new Error('Only a completed assistant response can become a task draft.')
      },
    })
    assert.throws(
      () => service.createFromChat({ conversationId, turnId }),
      /Only a completed assistant response/,
    )
    service.close()
  })
})

test('a task plan persists and must be complete before review confirmation', () => {
  withDatabase((databasePath) => {
    const service = new AgentTaskService(new AgentTaskRepository(databasePath), completedSource)
    const task = service.createFromChat({ conversationId, turnId })
    assert.throws(() => service.confirmReview(task.id), /Repository, scope/)
    const planned = service.updatePlan(task.id, {
      acceptanceCriteria: ['The requested behavior works.'],
      checks: ['git diff --check'],
      modulePath: 'apps/example',
      repositoryPath: 'E:/Workspace/example',
    })
    assert.equal(planned.modulePath, 'apps/example')
    const confirmed = service.confirmReview(task.id)
    assert.ok(confirmed.reviewConfirmedAt)
    service.close()
  })
})

const completedSource = {
  getTaskSource() {
    return { prompt: 'Build the approved feature', response: 'Use one approved scope.' }
  },
}

async function withDatabase(run: (databasePath: string) => void | Promise<void>) {
  const directory = mkdtempSync(join(tmpdir(), 'zetro-agent-task-test-'))
  try {
    await run(join(directory, 'zetro.sqlite'))
  } finally {
    rmSync(directory, { force: true, maxRetries: 3, recursive: true, retryDelay: 20 })
  }
}
