import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { TaskRepository } from '../src/modules/tasks/tasks.repository.js'
import {
  TaskNotFoundError,
  TaskPolicyError,
  TaskService,
} from '../src/modules/tasks/tasks.service.js'
import { openTestDatabase } from './test-database.js'

const firstProjectId = '00000000-0000-4000-8000-000000000001'
const secondProjectId = '11111111-1111-4111-8111-111111111111'

test('isolates task lists and updates by project', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'zetro-tasks-'))
  context.after(() => rm(directory, { force: true, recursive: true }))
  const database = await openTestDatabase(directory)
  context.after(() => database.close())
  const repository = new TaskRepository(database, join(directory, 'tasks.json'), firstProjectId)
  await repository.initialize()
  const service = new TaskService(repository)

  const first = await service.create({
    description: '',
    priority: 'medium',
    projectId: firstProjectId,
    title: 'First project task',
  })
  await service.create({
    description: '',
    priority: 'high',
    projectId: secondProjectId,
    title: 'Second project task',
  })

  assert.equal(service.list(firstProjectId).length, 1)
  assert.equal(service.list(secondProjectId).length, 1)
  assert.equal(first.archived, false)
  assert.equal(first.parentTaskId, null)
  assert.equal(first.pinned, false)
  assert.equal(first.planningKind, 'task')
  assert.equal(first.workflow, null)
  await assert.rejects(
    service.update(first.id, secondProjectId, { status: 'done' }),
    TaskNotFoundError,
  )
  assert.equal((await service.update(first.id, firstProjectId, { status: 'done' })).status, 'done')
  assert.equal((await service.update(first.id, firstProjectId, { pinned: true })).pinned, true)
  assert.equal((await service.update(first.id, firstProjectId, { archived: true })).archived, true)
  assert.equal(
    (await service.update(first.id, firstProjectId, { workflow: 'review' })).workflow,
    'review',
  )
  assert.equal(service.list(firstProjectId).length, 0)
  assert.equal(service.list(firstProjectId, true).length, 1)
  const parent = await service.create({
    description: '',
    priority: 'medium',
    projectId: firstProjectId,
    title: 'Delivery task',
  })
  const childInput = {
    description: '',
    priority: 'medium' as const,
    projectId: firstProjectId,
    title: 'Implementation',
    parentTaskId: parent.id,
    planningKind: 'subtask' as const,
  }
  await assert.rejects(
    service.create({ ...childInput, projectId: secondProjectId }),
    TaskPolicyError,
  )
  await assert.rejects(service.create({ ...childInput, parentTaskId: 'missing' }), TaskPolicyError)
  const child = await service.create(childInput)
  await assert.rejects(
    service.update(parent.id, firstProjectId, { status: 'done' }),
    TaskPolicyError,
  )
  await service.update(child.id, firstProjectId, { archived: true })
  await assert.rejects(
    service.update(parent.id, firstProjectId, { status: 'done' }),
    TaskPolicyError,
  )
  await service.update(child.id, firstProjectId, { status: 'done' })
  await service.update(parent.id, firstProjectId, { status: 'done' })
  await assert.rejects(service.create(childInput), TaskPolicyError)
  await assert.rejects(
    service.update(child.id, firstProjectId, { status: 'in_progress' }),
    TaskPolicyError,
  )
  await service.update(parent.id, firstProjectId, { status: 'in_progress' })
  await service.update(child.id, firstProjectId, { archived: false, status: 'in_progress' })
})

test('starts one traceable system-task attempt from a reviewed plan', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'zetro-tasks-'))
  context.after(() => rm(directory, { force: true, recursive: true }))
  const database = await openTestDatabase(directory)
  context.after(() => database.close())
  const repository = new TaskRepository(database, join(directory, 'tasks.json'), firstProjectId)
  await repository.initialize()
  const service = new TaskService(repository)
  const received: string[] = []
  service.setExecutionRunner({
    start: async ({ prompt }) => {
      received.push(prompt)
      return { id: '00000000-0000-4000-8000-000000000002' }
    },
  })
  const task = await service.create({
    description: 'Make the task handoff visible.',
    plan: {
      acceptanceCriteria: ['The task displays the reviewed plan.'],
      checks: ['npm.cmd run test:tasks --workspace @codexsun/zetro-api'],
      scope: {
        application: 'zetro',
        documentationPaths: ['assist/records/zetro'],
        folderPath: 'apps/zetro',
        module: 'project-tasks',
      },
      sourceConversationId: null,
    },
    priority: 'medium',
    projectId: firstProjectId,
    title: 'Show the reviewed plan',
  })

  const started = await service.start(task.id, firstProjectId)

  assert.equal(started.status, 'in_progress')
  assert.equal(started.executionAttempt?.systemTaskId, '00000000-0000-4000-8000-000000000002')
  assert.match(received[0] ?? '', /Acceptance criteria/)
  assert.match(received[0] ?? '', /Required checks/)
  await assert.rejects(service.start(task.id, firstProjectId), TaskPolicyError)
  await assert.rejects(service.update(task.id, firstProjectId, { status: 'done' }), TaskPolicyError)
})
