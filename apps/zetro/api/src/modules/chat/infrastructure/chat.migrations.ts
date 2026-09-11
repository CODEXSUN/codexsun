export type ChatMigration = {
  sql: string
  version: number
}

export const chatMigrations: ChatMigration[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE chat_sessions (
        id TEXT PRIMARY KEY,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      ) STRICT;

      CREATE TABLE chat_turns (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
        prompt TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('working', 'complete', 'stopped', 'failed')),
        started_at INTEGER NOT NULL,
        completed_at INTEGER,
        error_message TEXT
      ) STRICT;

      CREATE INDEX chat_turns_session_started_idx
        ON chat_turns(session_id, started_at, id);

      CREATE TABLE chat_turn_events (
        id INTEGER PRIMARY KEY,
        turn_id TEXT NOT NULL REFERENCES chat_turns(id) ON DELETE CASCADE,
        sequence INTEGER NOT NULL,
        event_json TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        UNIQUE(turn_id, sequence)
      ) STRICT;

      CREATE INDEX chat_turn_events_turn_sequence_idx
        ON chat_turn_events(turn_id, sequence);
    `,
  },
  {
    version: 2,
    sql: `
      ALTER TABLE chat_sessions ADD COLUMN provider_thread_id TEXT;

      CREATE UNIQUE INDEX chat_sessions_provider_thread_idx
        ON chat_sessions(provider_thread_id)
        WHERE provider_thread_id IS NOT NULL;
    `,
  },
  {
    version: 3,
    sql: `
      ALTER TABLE chat_sessions RENAME TO chat_conversations;
      ALTER TABLE chat_turns RENAME COLUMN session_id TO conversation_id;

      DROP INDEX chat_turns_session_started_idx;
      CREATE INDEX chat_turns_conversation_started_idx
        ON chat_turns(conversation_id, started_at, id);

      DROP INDEX chat_sessions_provider_thread_idx;
      CREATE UNIQUE INDEX chat_conversations_provider_thread_idx
        ON chat_conversations(provider_thread_id)
        WHERE provider_thread_id IS NOT NULL;
    `,
  },
  {
    version: 4,
    sql: `
      ALTER TABLE chat_conversations ADD COLUMN title TEXT;
      ALTER TABLE chat_conversations ADD COLUMN archived_at INTEGER;

      UPDATE chat_conversations
      SET title = (
        SELECT SUBSTR(TRIM(prompt), 1, 120)
        FROM chat_turns
        WHERE conversation_id = chat_conversations.id
        ORDER BY started_at, id
        LIMIT 1
      );

      CREATE INDEX chat_conversations_registry_idx
        ON chat_conversations(archived_at, updated_at DESC, id);
    `,
  },
  {
    version: 5,
    sql: `
      ALTER TABLE chat_turns ADD COLUMN provider_connection_id TEXT;
      ALTER TABLE chat_turns ADD COLUMN provider_kind TEXT;
      ALTER TABLE chat_turns ADD COLUMN provider_label TEXT;
      ALTER TABLE chat_turns ADD COLUMN provider_model TEXT;
      ALTER TABLE chat_turns ADD COLUMN provider_reasoning_effort TEXT;
    `,
  },
]
