import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { TaskRepository } from '../src/modules/tasks/tasks.repository.js'
import { TaskNotFoundError, TaskService } from '../src/modules/tasks/tasks.service.js'
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
  assert.equal(first.pinned, false)
  await assert.rejects(
    service.update(first.id, secondProjectId, { status: 'done' }),
    TaskNotFoundError,
  )
  assert.equal((await service.update(first.id, firstProjectId, { status: 'done' })).status, 'done')
  assert.equal((await service.update(first.id, firstProjectId, { pinned: true })).pinned, true)
  assert.equal((await service.update(first.id, firstProjectId, { archived: true })).archived, true)
  assert.equal(service.list(firstProjectId).length, 0)
  assert.equal(service.list(firstProjectId, true).length, 1)
})
