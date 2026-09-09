import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { LocalSystemTaskQueue } from '../src/modules/system-tasks/system-tasks.queue.js'
import { SystemTaskRepository } from '../src/modules/system-tasks/system-tasks.repository.js'
import { SystemTaskService } from '../src/modules/system-tasks/system-tasks.service.js'
import { openTestDatabase } from './test-database.js'

test('runs a durable system task and stores its execution steps', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'zetro-system-task-'))
  const database = await openTestDatabase(directory)
  context.after(async () => {
    await database.close()
    await rm(directory, { force: true, recursive: true })
  })
  const service = new SystemTaskService(
    new SystemTaskRepository(database),
    new LocalSystemTaskQueue(),
  )
  service.register('test.task', async (input, taskContext) => {
    await taskContext.step('completed', 'Verified the test task.')
    return input
  })
  await service.initialize()
  await service.start()
  const task = await service.enqueue({
    input: { safe: true },
    title: 'Test task',
    type: 'test.task',
  })
  const completed = await waitForTask(service, task.id)
  assert.equal(completed.status, 'completed')
  assert.deepEqual(completed.result, { safe: true })
  assert.equal(completed.steps[0]?.message, 'Verified the test task.')
  await service.close()
})

test('recovers an interrupted task as pending after restart', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'zetro-system-recovery-'))
  const database = await openTestDatabase(directory)
  context.after(async () => {
    await database.close()
    await rm(directory, { force: true, recursive: true })
  })
  const repository = new SystemTaskRepository(database)
  await repository.initialize()
  const now = new Date().toISOString()
  await repository.insert({
    attempts: 1,
    completedAt: null,
    createdAt: now,
    error: null,
    id: 'interrupted',
    input: {},
    maxAttempts: 2,
    projectId: null,
    recoveryCount: 0,
    result: null,
    startedAt: now,
    status: 'running',
    title: 'Interrupted task',
    type: 'test.task',
    updatedAt: now,
  })
  const service = new SystemTaskService(repository, new LocalSystemTaskQueue())
  service.register('test.task', async () => ({ recovered: true }))
  await service.initialize()
  const recovered = await service.get('interrupted')
  assert.equal(recovered.status, 'pending')
  assert.equal(recovered.recoveryCount, 1)
  assert.match(recovered.steps[0]?.message ?? '', /Recovered/)
  await service.close()
})

async function waitForTask(service: SystemTaskService, taskId: string) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const task = await service.get(taskId)
    if (task.status === 'completed' || task.status === 'failed') return task
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 10))
  }
  throw new Error('The system task did not finish.')
}
