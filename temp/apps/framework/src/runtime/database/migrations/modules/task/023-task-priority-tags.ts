import { taskTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

export const taskPriorityTagsMigration: Migration = {
  id: '023-task-priority-tags',
  name: 'Add task priority and tags',
  async up({ db }) {
    await db.execute(`
      ALTER TABLE ${taskTableNames.tasks}
      ADD COLUMN priority VARCHAR(16) NOT NULL DEFAULT 'medium' AFTER status
    `).catch(async (error: unknown) => {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (!message.includes('duplicate column')) {
        throw error
      }
    })

    await db.execute(`
      ALTER TABLE ${taskTableNames.tasks}
      ADD COLUMN tags_json JSON NULL AFTER due_date
    `).catch(async (error: unknown) => {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (!message.includes('duplicate column')) {
        throw error
      }
    })

    await db.execute(`
      UPDATE ${taskTableNames.tasks}
      SET tags_json = JSON_ARRAY()
      WHERE tags_json IS NULL
    `)
  },
}


