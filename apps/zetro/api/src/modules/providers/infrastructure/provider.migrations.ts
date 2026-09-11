export type ProviderMigration = { sql: string; version: number }

export const providerMigrations: ProviderMigration[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE provider_connections (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL CHECK (kind IN ('codex-app-server', 'openai-compatible')),
        label TEXT NOT NULL,
        base_url TEXT,
        model TEXT,
        reasoning_effort TEXT NOT NULL,
        auth_status TEXT NOT NULL,
        account_label TEXT,
        enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      ) STRICT;

      CREATE TABLE provider_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        selected_connection_id TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      ) STRICT;
    `,
  },
  {
    version: 2,
    sql: `
      CREATE TABLE provider_connections_v2 (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL CHECK (kind IN ('codex-app-server', 'openai-compatible', 'cxz-codex', 'ollama', 'opencode')),
        label TEXT NOT NULL,
        base_url TEXT,
        model TEXT,
        reasoning_effort TEXT NOT NULL,
        auth_status TEXT NOT NULL,
        account_label TEXT,
        enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      ) STRICT;
      INSERT INTO provider_connections_v2 SELECT * FROM provider_connections;
      DROP TABLE provider_connections;
      ALTER TABLE provider_connections_v2 RENAME TO provider_connections;
    `,
  },
  {
    version: 3,
    sql: `
      CREATE TABLE provider_connections_v3 (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL CHECK (kind IN ('codex-app-server', 'cxz-codex')),
        label TEXT NOT NULL,
        base_url TEXT,
        model TEXT,
        reasoning_effort TEXT NOT NULL,
        auth_status TEXT NOT NULL,
        account_label TEXT,
        enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      ) STRICT;
      INSERT INTO provider_connections_v3
        SELECT * FROM provider_connections
        WHERE id IN ('codex-local', 'cxz-codex');
      DROP TABLE provider_connections;
      ALTER TABLE provider_connections_v3 RENAME TO provider_connections;
      UPDATE provider_settings
        SET selected_connection_id = 'codex-local'
        WHERE selected_connection_id NOT IN ('codex-local', 'cxz-codex');
    `,
  },
]
