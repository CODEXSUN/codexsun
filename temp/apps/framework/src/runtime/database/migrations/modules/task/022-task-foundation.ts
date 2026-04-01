import { authTableNames, taskTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

export const taskFoundationMigration: Migration = {
  id: '022-task-foundation',
  name: 'Task management foundation',
  async up({ db }) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${taskTableNames.tasks} (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        assignee_id VARCHAR(64) NULL,
        creator_id VARCHAR(64) NOT NULL,
        due_date DATETIME NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_tasks_assignee FOREIGN KEY (assignee_id) REFERENCES ${authTableNames.users}(id) ON DELETE SET NULL,
        CONSTRAINT fk_tasks_creator FOREIGN KEY (creator_id) REFERENCES ${authTableNames.users}(id),
        INDEX idx_tasks_status (status),
        INDEX idx_tasks_assignee (assignee_id),
        INDEX idx_tasks_creator (creator_id),
        INDEX idx_tasks_due_date (due_date),
        INDEX idx_tasks_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${taskTableNames.activities} (
        id VARCHAR(64) PRIMARY KEY,
        task_id VARCHAR(64) NOT NULL,
        author_id VARCHAR(64) NOT NULL,
        activity_type VARCHAR(32) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_task_activities_task FOREIGN KEY (task_id) REFERENCES ${taskTableNames.tasks}(id) ON DELETE CASCADE,
        CONSTRAINT fk_task_activities_author FOREIGN KEY (author_id) REFERENCES ${authTableNames.users}(id),
        INDEX idx_task_activities_task (task_id),
        INDEX idx_task_activities_author (author_id),
        INDEX idx_task_activities_type (activity_type),
        INDEX idx_task_activities_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
  },
}


