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
] as const
