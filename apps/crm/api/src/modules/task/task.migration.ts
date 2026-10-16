import { sql, type Kysely } from "kysely";
import { runMigrationBatch, type MigrationBatch } from "@codexsun/framework/db";
import type { TaskDatabase } from "./task.types.js";

export const taskMigrationBatch: MigrationBatch<TaskDatabase> = {
  batch: 1,
  description: "Standalone CRM task workflow.",
  scope: "crm.task",
  version: "1.0.97",
  steps: [
    {
      name: "crm.task.v1",
      description: "Create tasks, comments, job timers, and closure requests.",
      checksum: "crm.task.v1:v1",
      version: 1,
      up: async (db) => {
        await sql
          .raw(
            `CREATE TABLE IF NOT EXISTS crm_tasks (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL DEFAULT (LOWER(SUBSTRING(MD5(UUID()),1,8))) UNIQUE,
      title VARCHAR(255) NOT NULL, description TEXT NOT NULL, list_in_id INT NULL, priority_id INT NOT NULL,
      status_id INT NOT NULL, assigned_user_id INT NULL, due_date DATE NULL, created_by VARCHAR(191) NOT NULL,
      status VARCHAR(24) NOT NULL DEFAULT 'active', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY crm_tasks_assignee_status (assigned_user_id, status_id), KEY crm_tasks_creator (created_by), KEY crm_tasks_due (due_date),
      CONSTRAINT crm_tasks_list_fk FOREIGN KEY (list_in_id) REFERENCES crm_enquiry_lists(id) ON DELETE RESTRICT,
      CONSTRAINT crm_tasks_priority_fk FOREIGN KEY (priority_id) REFERENCES crm_enquiry_priorities(id) ON DELETE RESTRICT,
      CONSTRAINT crm_tasks_status_fk FOREIGN KEY (status_id) REFERENCES crm_enquiry_statuses(id) ON DELETE RESTRICT,
      CONSTRAINT crm_tasks_user_fk FOREIGN KEY (assigned_user_id) REFERENCES app_users(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
          )
          .execute(db);
        await sql
          .raw(
            `CREATE TABLE IF NOT EXISTS crm_task_comments (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL DEFAULT (LOWER(SUBSTRING(MD5(UUID()),1,8))) UNIQUE,
      task_id INT NOT NULL, body TEXT NOT NULL, created_by VARCHAR(191) NOT NULL,
      status VARCHAR(24) NOT NULL DEFAULT 'active', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY crm_task_comments_task (task_id, id), CONSTRAINT crm_task_comments_task_fk FOREIGN KEY (task_id) REFERENCES crm_tasks(id) ON DELETE CASCADE
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
          )
          .execute(db);
        await sql
          .raw(
            `CREATE TABLE IF NOT EXISTS crm_task_jobs (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL DEFAULT (LOWER(SUBSTRING(MD5(UUID()),1,8))) UNIQUE,
      task_id INT NOT NULL, started_by VARCHAR(191) NOT NULL, created_by VARCHAR(191) NOT NULL,
      started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      stopped_at DATETIME NULL, status VARCHAR(24) NOT NULL DEFAULT 'active',
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY crm_task_jobs_task (task_id, stopped_at), CONSTRAINT crm_task_jobs_task_fk FOREIGN KEY (task_id) REFERENCES crm_tasks(id) ON DELETE CASCADE
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
          )
          .execute(db);
        await sql
          .raw(
            `CREATE TABLE IF NOT EXISTS crm_task_closure_requests (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL DEFAULT (LOWER(SUBSTRING(MD5(UUID()),1,8))) UNIQUE,
      task_id INT NOT NULL, requested_by VARCHAR(191) NOT NULL, created_by VARCHAR(191) NOT NULL,
      reason TEXT NOT NULL, status VARCHAR(24) NOT NULL DEFAULT 'pending',
      reviewed_by VARCHAR(191) NULL, review_note TEXT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, KEY crm_task_closure_task (task_id, status),
      CONSTRAINT crm_task_closure_task_fk FOREIGN KEY (task_id) REFERENCES crm_tasks(id) ON DELETE CASCADE
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
          )
          .execute(db);
        await sql
          .raw(
            `CREATE TABLE IF NOT EXISTS crm_task_activity (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL DEFAULT (LOWER(SUBSTRING(MD5(UUID()),1,8))) UNIQUE,
      task_id INT NOT NULL, event_type VARCHAR(48) NOT NULL, description TEXT NOT NULL,
      actor VARCHAR(191) NOT NULL, created_by VARCHAR(191) NOT NULL,
      status VARCHAR(24) NOT NULL DEFAULT 'active', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY crm_task_activity_task (task_id, id),
      CONSTRAINT crm_task_activity_task_fk FOREIGN KEY (task_id) REFERENCES crm_tasks(id) ON DELETE CASCADE
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
          )
          .execute(db);
      }
    },
    {
      name: "crm.task.public-id-v2",
      description: "Normalize task module public UUIDs to eight lowercase hex characters.",
      checksum: "crm.task.public-id-v2:v1",
      version: 2,
      up: async (db) => {
        for (const table of [
          "crm_tasks",
          "crm_task_comments",
          "crm_task_jobs",
          "crm_task_closure_requests",
          "crm_task_activity"
        ]) {
          const collisions = await sql<{ total: number }>`SELECT COUNT(*) AS total FROM (
            SELECT CASE WHEN uuid REGEXP '^[0-9A-Fa-f]{8}$' THEN LOWER(uuid) ELSE LOWER(SUBSTRING(MD5(uuid),1,8)) END AS next_uuid
            FROM ${sql.raw(table)} GROUP BY next_uuid HAVING COUNT(*) > 1
          ) AS duplicate_uuids`.execute(db);
          if (Number(collisions.rows[0]?.total ?? 0) > 0)
            throw new Error(
              `Cannot migrate ${table}: public UUID conversion would create duplicates.`
            );
          await sql
            .raw(
              `UPDATE ${table} SET uuid = CASE
            WHEN uuid REGEXP '^[0-9A-Fa-f]{8}$' THEN LOWER(uuid)
            ELSE LOWER(SUBSTRING(MD5(uuid),1,8)) END`
            )
            .execute(db);
          await sql
            .raw(
              `ALTER TABLE ${table} MODIFY uuid CHAR(8) NOT NULL DEFAULT (LOWER(SUBSTRING(MD5(UUID()),1,8)))`
            )
            .execute(db);
        }
      }
    },
    {
      name: "crm.task.standard-columns-v3",
      description: "Add standard lifecycle and audit columns to existing task tables.",
      checksum: "crm.task.standard-columns-v3:v1",
      version: 3,
      up: async (db) => {
        await ensureColumn(
          db,
          "crm_tasks",
          "status",
          "status VARCHAR(24) NOT NULL DEFAULT 'active'"
        );
        await ensureColumn(
          db,
          "crm_task_comments",
          "status",
          "status VARCHAR(24) NOT NULL DEFAULT 'active'"
        );
        await ensureColumn(
          db,
          "crm_task_comments",
          "updated_at",
          "updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        );
        await ensureColumn(db, "crm_task_jobs", "created_by", "created_by VARCHAR(191) NULL");
        await sql
          .raw(
            "UPDATE crm_task_jobs SET created_by = started_by WHERE created_by IS NULL OR created_by = ''"
          )
          .execute(db);
        await sql
          .raw("ALTER TABLE crm_task_jobs MODIFY created_by VARCHAR(191) NOT NULL")
          .execute(db);
        await ensureColumn(
          db,
          "crm_task_jobs",
          "created_at",
          "created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP"
        );
        await sql
          .raw("UPDATE crm_task_jobs SET created_at = started_at WHERE created_at IS NULL")
          .execute(db);
        await sql
          .raw(
            "ALTER TABLE crm_task_jobs MODIFY created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"
          )
          .execute(db);
        await ensureColumn(
          db,
          "crm_task_jobs",
          "status",
          "status VARCHAR(24) NOT NULL DEFAULT 'active'"
        );
        await sql
          .raw("UPDATE crm_task_jobs SET status = 'inactive' WHERE stopped_at IS NOT NULL")
          .execute(db);
        await ensureColumn(
          db,
          "crm_task_jobs",
          "updated_at",
          "updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        );
        await ensureColumn(
          db,
          "crm_task_closure_requests",
          "created_by",
          "created_by VARCHAR(191) NULL"
        );
        await sql
          .raw(
            "UPDATE crm_task_closure_requests SET created_by = requested_by WHERE created_by IS NULL OR created_by = ''"
          )
          .execute(db);
        await sql
          .raw("ALTER TABLE crm_task_closure_requests MODIFY created_by VARCHAR(191) NOT NULL")
          .execute(db);
        await ensureColumn(db, "crm_task_activity", "created_by", "created_by VARCHAR(191) NULL");
        await sql
          .raw(
            "UPDATE crm_task_activity SET created_by = actor WHERE created_by IS NULL OR created_by = ''"
          )
          .execute(db);
        await sql
          .raw("ALTER TABLE crm_task_activity MODIFY created_by VARCHAR(191) NOT NULL")
          .execute(db);
        await ensureColumn(
          db,
          "crm_task_activity",
          "status",
          "status VARCHAR(24) NOT NULL DEFAULT 'active'"
        );
        await ensureColumn(
          db,
          "crm_task_activity",
          "updated_at",
          "updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        );
      }
    }
  ]
};
export const migrateTaskModule = (db: Kysely<TaskDatabase>) =>
  runMigrationBatch(db, taskMigrationBatch);

async function ensureColumn(
  database: Kysely<TaskDatabase>,
  table: string,
  column: string,
  definition: string
) {
  const existing = await sql<{
    total: number;
  }>`SELECT COUNT(*) AS total FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=${table} AND COLUMN_NAME=${column}`.execute(
    database
  );
  if (!Number(existing.rows[0]?.total ?? 0))
    await sql.raw(`ALTER TABLE ${table} ADD COLUMN ${definition}`).execute(database);
}
