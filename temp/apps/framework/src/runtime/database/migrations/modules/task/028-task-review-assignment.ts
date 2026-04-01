import { authTableNames, taskTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

export const taskReviewAssignmentMigration: Migration = {
  id: '028-task-review-assignment',
  name: 'Task review assignment',
  async up({ db }) {
    await db.execute(`
      ALTER TABLE ${taskTableNames.tasks}
      ADD COLUMN review_assigned_to VARCHAR(64) NULL AFTER assignee_id
    `).catch((error: unknown) => {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (message.includes('duplicate column name')) {
        return
      }
      throw error
    })

    await db.execute(`
      ALTER TABLE ${taskTableNames.tasks}
      ADD CONSTRAINT fk_tasks_review_assigned_to
      FOREIGN KEY (review_assigned_to) REFERENCES ${authTableNames.users}(id)
    `).catch((error: unknown) => {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (message.includes('duplicate key') || message.includes('duplicate constraint')) {
        return
      }
      throw error
    })

    await db.execute(`
      CREATE INDEX idx_tasks_review_assigned_to ON ${taskTableNames.tasks} (review_assigned_to)
    `).catch((error: unknown) => {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (message.includes('duplicate key name')) {
        return
      }
      throw error
    })
  },
}


