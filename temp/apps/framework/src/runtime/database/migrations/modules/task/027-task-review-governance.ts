import { authTableNames, taskTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

export const taskReviewGovernanceMigration: Migration = {
  id: '027-task-review-governance',
  name: 'Task review governance',
  async up({ db }) {
    await db.execute(`
      ALTER TABLE ${taskTableNames.tasks}
      ADD COLUMN reviewed_by VARCHAR(64) NULL AFTER creator_id
    `).catch((error: unknown) => {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (message.includes('duplicate column name')) {
        return
      }
      throw error
    })

    await db.execute(`
      ALTER TABLE ${taskTableNames.tasks}
      ADD COLUMN reviewed_at DATETIME NULL AFTER reviewed_by
    `).catch((error: unknown) => {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (message.includes('duplicate column name')) {
        return
      }
      throw error
    })

    await db.execute(`
      ALTER TABLE ${taskTableNames.tasks}
      ADD COLUMN review_comment TEXT NULL AFTER reviewed_at
    `).catch((error: unknown) => {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (message.includes('duplicate column name')) {
        return
      }
      throw error
    })

    await db.execute(`
      ALTER TABLE ${taskTableNames.tasks}
      ADD CONSTRAINT fk_tasks_reviewed_by
      FOREIGN KEY (reviewed_by) REFERENCES ${authTableNames.users}(id)
    `).catch((error: unknown) => {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (message.includes('duplicate key') || message.includes('duplicate constraint')) {
        return
      }
      throw error
    })

    await db.execute(`
      CREATE INDEX idx_tasks_reviewed_by ON ${taskTableNames.tasks} (reviewed_by)
    `).catch((error: unknown) => {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (message.includes('duplicate key name')) {
        return
      }
      throw error
    })
  },
}


