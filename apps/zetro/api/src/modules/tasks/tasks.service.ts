import { randomUUID } from 'node:crypto'
import type { TaskRepository } from './tasks.repository.js'
import type {
  CreateTaskInput,
  TaskExecutionRunner,
  UpdateTaskInput,
  ZetroTask,
} from './tasks.types.js'

export class TaskNotFoundError extends Error {}
export class TaskPolicyError extends Error {}

export class TaskService {
  private executionRunner: TaskExecutionRunner | null = null

  public constructor(private readonly repository: TaskRepository) {}

  public setExecutionRunner(runner: TaskExecutionRunner): void {
    this.executionRunner = runner
  }

  public list(projectId: string, archived = false): readonly ZetroTask[] {
    return this.repository.list(projectId, archived)
  }

  public async create(input: CreateTaskInput): Promise<ZetroTask> {
    if (input.parentTaskId) this.requireOpenParent(input.parentTaskId, input.projectId)
    const now = new Date().toISOString()
    const task: ZetroTask = {
      ...input,
      archived: false,
      createdAt: now,
      executionAttempt: null,
      id: randomUUID(),
      pinned: false,
      parentTaskId: input.parentTaskId ?? null,
      planningKind: input.planningKind ?? 'task',
      plan: input.plan ?? null,
      status: 'todo',
      updatedAt: now,
      workflow: null,
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

    if (input.status === 'done') {
      if (existing.plan) {
        throw new TaskPolicyError(
          'A governed task can be accepted only after its required checks and human review.',
        )
      }
      const children = [
        ...this.repository.list(projectId),
        ...this.repository.list(projectId, true),
      ].filter((task) => task.parentTaskId === taskId)
      if (children.some((task) => task.status !== 'done')) {
        throw new TaskPolicyError(
          'Complete every child task before completing its parent. Archiving does not count as completion.',
        )
      }
    }
    if (input.status && input.status !== 'done' && existing.parentTaskId) {
      this.requireOpenParent(existing.parentTaskId, projectId)
    }

    const task = { ...existing, ...input, updatedAt: new Date().toISOString() }
    await this.repository.save(task)
    return task
  }

  public async start(taskId: string, projectId: string): Promise<ZetroTask> {
    const task = this.requireTask(taskId, projectId)
    if (!task.plan) throw new TaskPolicyError('Create a reviewed task plan before starting implementation.')
    if (task.executionAttempt) throw new TaskPolicyError('This task already has an execution attempt. Review its result before starting another.')
    if (task.status === 'done' || task.archived) throw new TaskPolicyError('Restore and reopen this task before implementation.')
    if (!this.executionRunner) throw new TaskPolicyError('Task execution is unavailable. Check the local Zetro supervisor.')
    const attempt = await this.executionRunner.start({
      projectId,
      prompt: buildImplementationPrompt(task),
      scope: task.plan.scope,
    })
    const started = {
      ...task,
      executionAttempt: { startedAt: new Date().toISOString(), systemTaskId: attempt.id },
      status: 'in_progress' as const,
      updatedAt: new Date().toISOString(),
    }
    await this.repository.save(started)
    return started
  }

  private requireOpenParent(taskId: string, projectId: string): void {
    const parent = this.repository.find(taskId)
    if (!parent || parent.projectId !== projectId) {
      throw new TaskPolicyError('The parent task must belong to the same project.')
    }
    if (parent.archived || parent.status === 'done') {
      throw new TaskPolicyError(
        'Restore and reopen the parent before adding or reopening child work.',
      )
    }
  }

  private requireTask(taskId: string, projectId: string): ZetroTask {
    const task = this.repository.find(taskId)
    if (!task || task.projectId !== projectId) throw new TaskNotFoundError('Task not found.')
    return task
  }
}

function buildImplementationPrompt(task: ZetroTask): string {
  const plan = task.plan
  if (!plan) throw new TaskPolicyError('Task plan is unavailable.')
  return [
    `Implement task: ${task.title}`,
    task.description,
    'Acceptance criteria:',
    ...plan.acceptanceCriteria.map((criterion) => `- ${criterion}`),
    'Required checks:',
    ...plan.checks.map((check) => `- ${check}`),
    'Do not commit, push, install, migrate, or deploy without explicit approval.',
  ].join('\n')
}
