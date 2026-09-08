import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { ZetroTask } from './tasks.types.js'

export class TaskRepository {
  private tasks: ZetroTask[] = []

  public constructor(
    private readonly filePath: string,
    private readonly defaultProjectId: string,
  ) {}

  public async initialize(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true })

    try {
      const stored = JSON.parse(await readFile(this.filePath, 'utf8')) as Array<
        Omit<ZetroTask, 'archived' | 'pinned' | 'projectId'> & {
          archived?: boolean
          pinned?: boolean
          projectId?: string
        }
      >
      const needsMigration = stored.some(
        ({ archived, pinned, projectId }) =>
          archived === undefined || pinned === undefined || !projectId,
      )
      this.tasks = stored.map((task) => ({
        ...task,
        archived: task.archived ?? false,
        pinned: task.pinned ?? false,
        projectId: task.projectId ?? this.defaultProjectId,
      }))
      if (needsMigration) await this.persist()
    } catch (error) {
      if (!isMissingFile(error)) {
        throw error
      }

      await this.persist()
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

    await this.persist()
  }

  public find(taskId: string): ZetroTask | undefined {
    return this.tasks.find((task) => task.id === taskId)
  }

  private async persist(): Promise<void> {
    const temporaryPath = `${this.filePath}.tmp`
    await writeFile(temporaryPath, `${JSON.stringify(this.tasks, null, 2)}\n`, 'utf8')
    await rename(temporaryPath, this.filePath)
  }
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}
