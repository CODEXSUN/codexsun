import { appendFile } from 'node:fs/promises'
import { mkdirSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { resolve } from 'node:path'
import type { DockerContainerAction } from '@codexsun/orship-contracts'

export class DockerControlStore {
  private readonly database: DatabaseSync
  private readonly logPath: string

  constructor(projectRoot: string) {
    const directory = resolve(projectRoot, 'storage/app/private/orship/docker')
    mkdirSync(directory, { recursive: true })
    this.logPath = resolve(directory, 'actions.jsonl')
    this.database = new DatabaseSync(resolve(directory, 'memory.sqlite'))
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS docker_action_memory (
        id INTEGER PRIMARY KEY,
        container_id TEXT NOT NULL,
        action TEXT NOT NULL,
        occurred_at TEXT NOT NULL,
        outcome TEXT NOT NULL
      ) STRICT
    `)
  }

  async record(containerId: string, action: DockerContainerAction, outcome: string): Promise<void> {
    const occurredAt = new Date().toISOString()
    this.database
      .prepare(
        'INSERT INTO docker_action_memory (container_id, action, occurred_at, outcome) VALUES (?, ?, ?, ?)',
      )
      .run(containerId, action, occurredAt, outcome)
    await appendFile(
      this.logPath,
      `${JSON.stringify({ action, containerId, occurredAt, outcome })}\n`,
      'utf8',
    )
  }

  close(): void {
    this.database.close()
  }
}
