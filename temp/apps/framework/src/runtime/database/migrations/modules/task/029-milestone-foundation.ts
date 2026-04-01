import { authTableNames, taskTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

export const milestoneFoundationMigration: Migration = {
  id: '029-milestone-foundation',
  name: 'Milestone foundation',
  async up({ db }) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${taskTableNames.milestones} (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT NULL,
        entity_type VARCHAR(32) NULL,
        entity_id VARCHAR(64) NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'active',
        due_date DATETIME NULL,
        created_by VARCHAR(64) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_task_milestones_creator FOREIGN KEY (created_by) REFERENCES ${authTableNames.users}(id),
        INDEX idx_task_milestones_status (status),
        INDEX idx_task_milestones_entity (entity_type, entity_id),
        INDEX idx_task_milestones_due_date (due_date),
        INDEX idx_task_milestones_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      ALTER TABLE ${taskTableNames.tasks}
      ADD COLUMN milestone_id VARCHAR(64) NULL AFTER description
    `).catch((error: unknown) => {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (message.includes('duplicate column name')) {
        return
      }
      throw error
    })

    await db.execute(`
      ALTER TABLE ${taskTableNames.tasks}
      ADD CONSTRAINT fk_tasks_milestone
      FOREIGN KEY (milestone_id) REFERENCES ${taskTableNames.milestones}(id)
      ON DELETE SET NULL
    `).catch((error: unknown) => {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (message.includes('duplicate key') || message.includes('duplicate constraint')) {
        return
      }
      throw error
    })

    await db.execute(`
      CREATE INDEX idx_tasks_milestone_id ON ${taskTableNames.tasks} (milestone_id)
    `).catch((error: unknown) => {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (message.includes('duplicate key name')) {
        return
      }
      throw error
    })
  },
}


