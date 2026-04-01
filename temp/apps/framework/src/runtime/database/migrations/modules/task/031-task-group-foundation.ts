import { authTableNames, taskTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

export const taskGroupFoundationMigration: Migration = {
  id: '031-task-group-foundation',
  name: 'Task group foundation',
  async up({ db }) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${taskTableNames.groups} (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        type VARCHAR(32) NOT NULL DEFAULT 'focus',
        status VARCHAR(32) NOT NULL DEFAULT 'active',
        created_by VARCHAR(64) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_task_groups_creator FOREIGN KEY (created_by) REFERENCES ${authTableNames.users}(id),
        INDEX idx_task_groups_status (status),
        INDEX idx_task_groups_type (type),
        INDEX idx_task_groups_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      ALTER TABLE ${taskTableNames.tasks}
      ADD COLUMN task_group_id VARCHAR(64) NULL AFTER task_health_json
    `).catch((error: unknown) => {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (message.includes('duplicate column name')) {
        return
      }
      throw error
    })

    await db.execute(`
      ALTER TABLE ${taskTableNames.tasks}
      ADD CONSTRAINT fk_tasks_task_group
      FOREIGN KEY (task_group_id) REFERENCES ${taskTableNames.groups}(id)
      ON DELETE SET NULL
    `).catch((error: unknown) => {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (message.includes('duplicate key') || message.includes('duplicate constraint')) {
        return
      }
      throw error
    })

    await db.execute(`
      CREATE INDEX idx_tasks_task_group_id ON ${taskTableNames.tasks} (task_group_id)
    `).catch((error: unknown) => {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (message.includes('duplicate key name')) {
        return
      }
      throw error
    })
  },
}


