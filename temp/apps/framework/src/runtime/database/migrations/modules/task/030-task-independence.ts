import { taskTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

export const taskIndependenceMigration: Migration = {
  id: '030-task-independence',
  name: 'Task independence',
  async up({ db }) {
    await db.execute(`
      ALTER TABLE ${taskTableNames.tasks}
      ADD COLUMN task_context_json LONGTEXT NULL AFTER description
    `).catch((error: unknown) => {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (message.includes('duplicate column name')) {
        return
      }
      throw error
    })

    await db.execute(`
      ALTER TABLE ${taskTableNames.tasks}
      ADD COLUMN task_health_json LONGTEXT NULL AFTER task_context_json
    `).catch((error: unknown) => {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (message.includes('duplicate column name')) {
        return
      }
      throw error
    })

    await db.execute(`
      ALTER TABLE ${taskTableNames.tasks}
      ADD COLUMN status_changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER status
    `).catch((error: unknown) => {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (message.includes('duplicate column name')) {
        return
      }
      throw error
    })

    await db.execute(`
      UPDATE ${taskTableNames.tasks}
      SET
        task_context_json = COALESCE(task_context_json, JSON_OBJECT()),
        task_health_json = COALESCE(
          task_health_json,
          JSON_OBJECT(
            'status', 'normal',
            'lastEvaluatedAt', DATE_FORMAT(UTC_TIMESTAMP(), '%Y-%m-%dT%H:%i:%s.000Z'),
            'signals', JSON_OBJECT()
          )
        ),
        status_changed_at = COALESCE(status_changed_at, updated_at, created_at, CURRENT_TIMESTAMP)
    `)

    await db.execute(`
      CREATE INDEX idx_tasks_status_changed_at ON ${taskTableNames.tasks} (status_changed_at)
    `).catch((error: unknown) => {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      if (message.includes('duplicate key name')) {
        return
      }
      throw error
    })
  },
}


