import { randomUUID } from 'node:crypto'
import type { Kysely } from 'kysely'
import type { ZetroDatabase } from '../../infrastructure/zetro-database.js'
import type { SystemTasksDatabase } from './system-tasks.database.js'
import { systemTaskMigrations } from './system-tasks.migrations.js'
import type { SystemTaskDetail, SystemTaskRecord, SystemTaskStep } from './system-tasks.types.js'

export class SystemTaskRepository {
  private readonly database: Kysely<SystemTasksDatabase>

  public constructor(private readonly databaseProvider: ZetroDatabase) {
    this.database = databaseProvider.forModule<SystemTasksDatabase>()
  }

  public async initialize(): Promise<void> {
    await this.databaseProvider.migrate('zetro.system-tasks.api', systemTaskMigrations)
  }

  public async list(projectId?: string): Promise<SystemTaskRecord[]> {
    let query = this.database.selectFrom('zetro_system_tasks').select('data')
    if (projectId) query = query.where('project_id', '=', projectId)
    const rows = await query.orderBy('created_at', 'desc').limit(100).execute()
    return rows.map(({ data }) => JSON.parse(data) as SystemTaskRecord)
  }

  public async get(taskId: string): Promise<SystemTaskDetail | undefined> {
    const task = await this.database
      .selectFrom('zetro_system_tasks')
      .select('data')
      .where('id', '=', taskId)
      .executeTakeFirst()
    if (!task) return undefined
    const steps = await this.database
      .selectFrom('zetro_system_task_steps')
      .select('data')
      .where('task_id', '=', taskId)
      .orderBy('completed_at')
      .execute()
    return {
      ...(JSON.parse(task.data) as SystemTaskRecord),
      steps: steps.map(({ data }) => JSON.parse(data) as SystemTaskStep),
    }
  }

  public async listActive(): Promise<SystemTaskRecord[]> {
    const rows = await this.database
      .selectFrom('zetro_system_tasks')
      .select('data')
      .where('status', 'in', ['pending', 'running', 'stopping'])
      .execute()
    return rows.map(({ data }) => JSON.parse(data) as SystemTaskRecord)
  }

  public async insert(task: SystemTaskRecord): Promise<void> {
    await this.database.insertInto('zetro_system_tasks').values(toTaskRow(task)).execute()
  }

  public async save(task: SystemTaskRecord): Promise<void> {
    await this.database
      .updateTable('zetro_system_tasks')
      .set(toTaskRow(task))
      .where('id', '=', task.id)
      .execute()
  }

  public async claim(taskId: string): Promise<boolean> {
    const updatedAt = new Date().toISOString()
    const result = await this.database
      .updateTable('zetro_system_tasks')
      .set({ status: 'running', updated_at: updatedAt })
      .where('id', '=', taskId)
      .where('status', '=', 'pending')
      .executeTakeFirst()
    return Number(result.numUpdatedRows) === 1
  }

  public async appendStep(step: SystemTaskStep): Promise<void> {
    await this.database
      .insertInto('zetro_system_task_steps')
      .values({
        completed_at: step.completedAt,
        data: JSON.stringify(step),
        id: step.id,
        task_id: step.taskId,
      })
      .execute()
  }

  public async recoverInterrupted(): Promise<SystemTaskRecord[]> {
    const tasks = await this.listActive()
    const interrupted = tasks.filter(({ status }) => status === 'running' || status === 'stopping')
    for (const task of interrupted) {
      const now = new Date().toISOString()
      task.recoveryCount += 1
      task.status = 'pending'
      task.updatedAt = now
      task.error = 'Zetro restarted while this task was active. The task is ready to resume.'
      await this.save(task)
      await this.appendStep({
        completedAt: now,
        id: randomUUID(),
        message: 'Recovered after an interrupted Zetro process.',
        status: 'info',
        taskId: task.id,
      })
    }
    return interrupted
  }
}

function toTaskRow(task: SystemTaskRecord) {
  return {
    created_at: task.createdAt,
    data: JSON.stringify(task),
    id: task.id,
    project_id: task.projectId,
    status: task.status,
    type: task.type,
    updated_at: task.updatedAt,
  }
}
