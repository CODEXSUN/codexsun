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
]
