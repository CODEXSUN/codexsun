import { readFile } from 'node:fs/promises'
import type { Kysely } from 'kysely'
import type { ZetroDatabase } from '../../infrastructure/zetro-database.js'
import type { TasksDatabase } from './tasks.database.js'
import { tasksMigrations } from './tasks.migrations.js'
import type { ZetroTask } from './tasks.types.js'

export class TaskRepository {
  private tasks: ZetroTask[] = []
  private readonly database: Kysely<TasksDatabase>

  public constructor(
    private readonly databaseProvider: ZetroDatabase,
    private readonly legacyFilePath: string,
    private readonly defaultProjectId: string,
  ) {
    this.database = databaseProvider.forModule<TasksDatabase>()
  }

  public async initialize(): Promise<void> {
    await this.databaseProvider.migrate('zetro.tasks.api', tasksMigrations)
    const rows = await this.database.selectFrom('zetro_tasks').select('data').execute()
    this.tasks = rows.map(({ data }) => normalizeTask(JSON.parse(data) as ZetroTask))
    if (this.tasks.length > 0) return
    try {
      const stored = JSON.parse(await readFile(this.legacyFilePath, 'utf8')) as Array<
        Omit<ZetroTask, 'archived' | 'pinned' | 'projectId'> & {
          archived?: boolean
          pinned?: boolean
          projectId?: string
        }
      >
      this.tasks = stored
        .map((task) => ({
          ...task,
          archived: task.archived ?? false,
          pinned: task.pinned ?? false,
          projectId: task.projectId ?? this.defaultProjectId,
        }))
        .map(normalizeTask)
      for (const task of this.tasks) await this.insert(task)
    } catch (error) {
      if (!isMissingFile(error)) {
        throw error
      }

      return
    }
  }

  public list(projectId: string, archived = false): readonly ZetroTask[] {
    return this.tasks
      .filter((task) => task.projectId === projectId && task.archived === archived)
      .sort((left, right) => {
        if (left.pinned !== right.pinned) return left.pinned ? -1 : 1
        return right.updatedAt.localeCompare(left.updatedAt)
      })
  }

  public async save(task: ZetroTask): Promise<void> {
    const index = this.tasks.findIndex((candidate) => candidate.id === task.id)

    if (index === -1) {
      this.tasks.push(task)
    } else {
      this.tasks[index] = task
    }

    if (index === -1) await this.insert(task)
    else {
      await this.database
        .updateTable('zetro_tasks')
        .set(toRow(task))
        .where('id', '=', task.id)
        .execute()
    }
  }

  public find(taskId: string): ZetroTask | undefined {
    return this.tasks.find((task) => task.id === taskId)
  }

  private async insert(task: ZetroTask): Promise<void> {
    await this.database.insertInto('zetro_tasks').values(toRow(task)).execute()
  }
}

function normalizeTask(task: ZetroTask): ZetroTask {
  return {
    ...task,
    parentTaskId: task.parentTaskId ?? null,
    planningKind: task.planningKind ?? 'task',
    workflow: task.workflow ?? null,
  }
}

function toRow(task: ZetroTask) {
  return {
    archived: task.archived ? 1 : 0,
    data: JSON.stringify(task),
    id: task.id,
    pinned: task.pinned ? 1 : 0,
    project_id: task.projectId,
    updated_at: task.updatedAt,
  }
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}
