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
  {
    version: 6,
    sql: `
      ALTER TABLE chat_conversations
        ADD COLUMN provider_connection_id TEXT NOT NULL DEFAULT 'codex-local';
      ALTER TABLE chat_conversations ADD COLUMN provider_model TEXT;
      ALTER TABLE chat_conversations
        ADD COLUMN provider_reasoning_effort TEXT NOT NULL DEFAULT 'low';
      ALTER TABLE chat_conversations
        ADD COLUMN provider_status TEXT NOT NULL DEFAULT 'unverified'
        CHECK (provider_status IN ('unverified', 'verified'));
      ALTER TABLE chat_conversations ADD COLUMN provider_verified_at INTEGER;
      ALTER TABLE chat_conversations ADD COLUMN provider_latency_ms INTEGER;

      UPDATE chat_conversations
      SET
        provider_connection_id = COALESCE((
          SELECT provider_connection_id FROM chat_turns
          WHERE conversation_id = chat_conversations.id
            AND provider_connection_id IS NOT NULL
          ORDER BY started_at DESC, id DESC LIMIT 1
        ), provider_connection_id),
        provider_model = (
          SELECT provider_model FROM chat_turns
          WHERE conversation_id = chat_conversations.id
            AND provider_connection_id IS NOT NULL
          ORDER BY started_at DESC, id DESC LIMIT 1
        ),
        provider_reasoning_effort = COALESCE((
          SELECT provider_reasoning_effort FROM chat_turns
          WHERE conversation_id = chat_conversations.id
            AND provider_reasoning_effort IS NOT NULL
          ORDER BY started_at DESC, id DESC LIMIT 1
        ), provider_reasoning_effort);

      CREATE TABLE chat_provider_threads (
        conversation_id TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
        connection_id TEXT NOT NULL,
        thread_id TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (conversation_id, connection_id),
        UNIQUE (connection_id, thread_id)
      ) STRICT;

      INSERT INTO chat_provider_threads (conversation_id, connection_id, thread_id, updated_at)
      SELECT id, provider_connection_id, provider_thread_id, updated_at
      FROM chat_conversations
      WHERE provider_thread_id IS NOT NULL;
    `,
  },
  {
    version: 7,
    sql: `
      CREATE TABLE chat_handoff_items (
        turn_id TEXT PRIMARY KEY REFERENCES chat_turns(id) ON DELETE CASCADE,
        selected_at INTEGER NOT NULL
      ) STRICT;
      CREATE INDEX chat_handoff_items_selected_idx
        ON chat_handoff_items(selected_at DESC, turn_id);
    `,
  },
]
