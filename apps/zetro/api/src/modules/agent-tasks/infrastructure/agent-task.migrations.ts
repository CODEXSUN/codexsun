export const agentTaskMigrations = [
  {
    version: 1,
    sql: `
      CREATE TABLE agent_task_drafts (
        id TEXT PRIMARY KEY,
        origin_conversation_id TEXT NOT NULL,
        origin_turn_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        source_prompt TEXT NOT NULL,
        source_response TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status = 'draft'),
        approval_status TEXT NOT NULL CHECK (approval_status = 'awaiting-approval'),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      ) STRICT;

      CREATE INDEX agent_task_drafts_updated_idx
        ON agent_task_drafts(updated_at DESC, id);
    `,
  },
  {
    version: 2,
    sql: `
      ALTER TABLE agent_task_drafts ADD COLUMN repository_path TEXT NOT NULL DEFAULT '';
      ALTER TABLE agent_task_drafts ADD COLUMN module_path TEXT NOT NULL DEFAULT '';
      ALTER TABLE agent_task_drafts ADD COLUMN acceptance_criteria_json TEXT NOT NULL DEFAULT '[]';
      ALTER TABLE agent_task_drafts ADD COLUMN checks_json TEXT NOT NULL DEFAULT '[]';
      ALTER TABLE agent_task_drafts ADD COLUMN review_confirmed_at INTEGER;
    `,
  },
  { version: 3, sql: `ALTER TABLE agent_task_drafts ADD COLUMN archived_at INTEGER;` },
] as const
