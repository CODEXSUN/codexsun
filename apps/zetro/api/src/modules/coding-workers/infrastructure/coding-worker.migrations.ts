export const codingWorkerMigrations = [
  {
    version: 1,
    sql: `
      CREATE TABLE coding_worker_attempts (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        repository_path TEXT NOT NULL,
        module_path TEXT NOT NULL,
        worktree_path TEXT NOT NULL UNIQUE,
        branch_name TEXT NOT NULL UNIQUE,
        revision TEXT NOT NULL,
        runtime TEXT NOT NULL CHECK (runtime IN ('generic', 'node', 'python-venv')),
        environment_path TEXT,
        tool_profile TEXT NOT NULL CHECK (tool_profile = 'daily-coding'),
        acceptance_criteria_json TEXT NOT NULL,
        checks_json TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status = 'prepared'),
        created_at INTEGER NOT NULL
      ) STRICT;

      CREATE INDEX coding_worker_attempts_task_idx
        ON coding_worker_attempts(task_id, created_at DESC);
    `,
  },
  {
    version: 2,
    sql: `
      ALTER TABLE coding_worker_attempts
        ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'awaiting-verification';
      ALTER TABLE coding_worker_attempts
        ADD COLUMN verification_json TEXT NOT NULL DEFAULT '[]';
      ALTER TABLE coding_worker_attempts
        ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0;
    `,
  },
  {
    version: 3,
    sql: `
      CREATE TABLE coding_worker_attempts_next (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        repository_path TEXT NOT NULL,
        module_path TEXT NOT NULL,
        worktree_path TEXT NOT NULL UNIQUE,
        branch_name TEXT NOT NULL UNIQUE,
        revision TEXT NOT NULL,
        runtime TEXT NOT NULL CHECK (runtime = 'isolated-worktree'),
        environment_path TEXT,
        tool_profile TEXT NOT NULL CHECK (tool_profile = 'daily-coding'),
        acceptance_criteria_json TEXT NOT NULL,
        checks_json TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status = 'prepared'),
        created_at INTEGER NOT NULL,
        approval_status TEXT NOT NULL,
        verification_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      ) STRICT;

      INSERT INTO coding_worker_attempts_next
        SELECT id, task_id, repository_path, module_path, worktree_path, branch_name, revision,
               'isolated-worktree', environment_path, tool_profile, acceptance_criteria_json,
               checks_json, status, created_at, approval_status, verification_json, updated_at
        FROM coding_worker_attempts;

      DROP TABLE coding_worker_attempts;
      ALTER TABLE coding_worker_attempts_next RENAME TO coding_worker_attempts;
      CREATE INDEX coding_worker_attempts_task_idx
        ON coding_worker_attempts(task_id, created_at DESC);
    `,
  },
] as const
