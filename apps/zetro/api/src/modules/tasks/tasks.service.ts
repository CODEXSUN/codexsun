import { randomUUID } from 'node:crypto'
import type { TaskRepository } from './tasks.repository.js'
import type { CreateTaskInput, UpdateTaskInput, ZetroTask } from './tasks.types.js'

export class TaskNotFoundError extends Error {}

export class TaskService {
  public constructor(private readonly repository: TaskRepository) {}

  public list(): readonly ZetroTask[] {
    return this.repository.list()
  }

  public async create(input: CreateTaskInput): Promise<ZetroTask> {
    const now = new Date().toISOString()
    const task: ZetroTask = {
      ...input,
      createdAt: now,
      id: randomUUID(),
      status: 'todo',
      updatedAt: now,
    }

    await this.repository.save(task)
    return task
  }

  public async update(taskId: string, input: UpdateTaskInput): Promise<ZetroTask> {
    const existing = this.repository.find(taskId)

    if (!existing) {
      throw new TaskNotFoundError('Task not found.')
    }

    const task = { ...existing, ...input, updatedAt: new Date().toISOString() }
    await this.repository.save(task)
    return task
  }
}
