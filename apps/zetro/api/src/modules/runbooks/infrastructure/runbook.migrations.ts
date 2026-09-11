export const runbookMigrations = [
  {
    version: 1,
    sql: `
      CREATE TABLE runbooks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        prompt TEXT NOT NULL,
        repository_path TEXT NOT NULL,
        module_path TEXT NOT NULL,
        interval_minutes INTEGER NOT NULL,
        enabled INTEGER NOT NULL,
        next_run_at INTEGER NOT NULL,
        last_run_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      ) STRICT;
      CREATE TABLE runbook_runs (
        id TEXT PRIMARY KEY,
        runbook_id TEXT NOT NULL,
        triggered_by TEXT NOT NULL,
        status TEXT NOT NULL,
        branch_name TEXT NOT NULL,
        worktree_path TEXT NOT NULL,
        report TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        started_at INTEGER,
        completed_at INTEGER
      ) STRICT;
      CREATE INDEX runbook_runs_runbook_idx ON runbook_runs(runbook_id, created_at DESC);
    `,
  },
  {
    version: 2,
    sql: `
      ALTER TABLE runbooks ADD COLUMN schedule_mode TEXT NOT NULL DEFAULT 'repeating';
    `,
  },
  {
    version: 3,
    sql: `
      ALTER TABLE runbook_runs ADD COLUMN initiator_json TEXT NOT NULL DEFAULT '{}';
    `,
  },
] as const
