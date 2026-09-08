import { randomUUID } from 'node:crypto'
import type { TaskRepository } from './tasks.repository.js'
import type { CreateTaskInput, UpdateTaskInput, ZetroTask } from './tasks.types.js'

export class TaskNotFoundError extends Error {}

export class TaskService {
  public constructor(private readonly repository: TaskRepository) {}

  public list(projectId: string, archived = false): readonly ZetroTask[] {
    return this.repository.list(projectId, archived)
  }

  public async create(input: CreateTaskInput): Promise<ZetroTask> {
    const now = new Date().toISOString()
    const task: ZetroTask = {
      ...input,
      archived: false,
      createdAt: now,
      id: randomUUID(),
      pinned: false,
      status: 'todo',
      updatedAt: now,
    }

    await this.repository.save(task)
    return task
  }

  public async update(
    taskId: string,
    projectId: string,
    input: UpdateTaskInput,
  ): Promise<ZetroTask> {
    const existing = this.repository.find(taskId)

    if (!existing || existing.projectId !== projectId) {
      throw new TaskNotFoundError('Task not found.')
    }

    const task = { ...existing, ...input, updatedAt: new Date().toISOString() }
    await this.repository.save(task)
    return task
  }
}
