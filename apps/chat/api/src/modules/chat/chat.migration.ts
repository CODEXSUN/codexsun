import { runMigrationBatch, type MigrationBatch } from "@codexsun/framework/db";
import { sql, type Kysely } from "kysely";
import { applyChatTelegramSchema } from "./chat.telegram.migration.js";
import { applyChatTelegramAccountSchema } from "./chat.telegram.account-migration.js";

type ChatDatabase = Record<string, Record<string, unknown>>;

export const chatMigration = {
  key: "chat.001_foundation",
  moduleKey: "chat"
} as const;

export const chatMigrationBatch: MigrationBatch<ChatDatabase> = {
  batch: 1,
  description: "Chat module-owned schema baseline through release 1.0.91.",
  scope: "chat",
  steps: [
    {
      checksum: `${chatMigration.key}:v1`,
      description: "Company-scoped team channels and channel messages.",
      name: chatMigration.key,
      up: applyChatSchema,
      version: 1
    },
    {
      checksum: "chat.002_attachments:v1",
      description: "Message attachments with file metadata and content.",
      name: "chat.002_attachments",
      up: applyChatAttachmentSchema,
      version: 2
    },
    {
      checksum: "chat.003_members:v1",
      description: "Channel membership with admin roles.",
      name: "chat.003_members",
      up: applyChatMemberSchema,
      version: 3
    },
    {
      checksum: "chat.004_reads:v1",
      description: "Per-user channel read tracking for unread counts.",
      name: "chat.004_reads",
      up: applyChatReadSchema,
      version: 4
    },
    {
      checksum: "chat.005_replies_reactions_edits:v1",
      description: "Message replies, emoji reactions, and edit markers.",
      name: "chat.005_replies_reactions_edits",
      up: applyChatMessageExtrasSchema,
      version: 5
    },
    {
      checksum: "chat.006_telegram:v1",
      description: "Telegram connections, polling offsets, and durable delivery tracking.",
      name: "chat.006_telegram",
      up: applyChatTelegramSchema,
      version: 6
    },
    {
      checksum: "chat.007_telegram_account:v1",
      description: "User-owned MTProto sessions, dialog links and idempotent message mappings.",
      name: "chat.007_telegram_account",
      up: applyChatTelegramAccountSchema,
      version: 7
    },
    {
      checksum: "chat.008_read_cursor:v1",
      description: "Message ID watermark for timezone-independent unread counts.",
      name: "chat.008_read_cursor",
      up: applyChatReadCursorSchema,
      version: 8
    }
  ],
  version: "1.0.91"
};

export async function migrateChatModule(database: Kysely<ChatDatabase>) {
  await runMigrationBatch(database, chatMigrationBatch, { batchSize: 1 });
}

export async function rollbackChatModule(database: Kysely<ChatDatabase>) {
  void database;
  throw new Error("Chat rollback requires a reviewed, data-preserving migration plan.");
}

async function applyChatSchema(database: Kysely<ChatDatabase>) {
  await sql
    .raw(
      `
    CREATE TABLE IF NOT EXISTS chat_channels (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      uuid CHAR(8) NOT NULL UNIQUE,
      company_id INT NOT NULL DEFAULT 0,
      name VARCHAR(120) NOT NULL,
      kind VARCHAR(24) NOT NULL DEFAULT 'channel',
      status VARCHAR(24) NOT NULL DEFAULT 'active',
      created_by VARCHAR(191) NOT NULL,
      updated_by VARCHAR(191) NOT NULL DEFAULT '',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX chat_channels_company_idx (company_id, status, updated_at)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `
    )
    .execute(database);

  await sql
    .raw(
      `
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      uuid CHAR(8) NOT NULL UNIQUE,
      company_id INT NOT NULL DEFAULT 0,
      channel_id INT NOT NULL,
      sender_email VARCHAR(191) NOT NULL,
      body LONGTEXT NOT NULL,
      status VARCHAR(24) NOT NULL DEFAULT 'active',
      created_by VARCHAR(191) NOT NULL,
      updated_by VARCHAR(191) NOT NULL DEFAULT '',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX chat_messages_channel_idx (channel_id, created_at),
      INDEX chat_messages_company_idx (company_id, status, created_at),
      CONSTRAINT chat_messages_channel_fk FOREIGN KEY (channel_id) REFERENCES chat_channels (id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `
    )
    .execute(database);
}

async function applyChatAttachmentSchema(database: Kysely<ChatDatabase>) {
  await sql
    .raw(
      `
    CREATE TABLE IF NOT EXISTS chat_attachments (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      uuid CHAR(8) NOT NULL UNIQUE,
      company_id INT NOT NULL DEFAULT 0,
      message_id INT NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(120) NOT NULL DEFAULT 'application/octet-stream',
      size_bytes INT NOT NULL DEFAULT 0,
      content_base64 LONGTEXT NOT NULL,
      status VARCHAR(24) NOT NULL DEFAULT 'active',
      created_by VARCHAR(191) NOT NULL,
      updated_by VARCHAR(191) NOT NULL DEFAULT '',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX chat_attachments_message_idx (message_id),
      CONSTRAINT chat_attachments_message_fk FOREIGN KEY (message_id) REFERENCES chat_messages (id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `
    )
    .execute(database);
}

async function applyChatMemberSchema(database: Kysely<ChatDatabase>) {
  await sql
    .raw(
      `
    CREATE TABLE IF NOT EXISTS chat_channel_members (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      uuid CHAR(8) NOT NULL UNIQUE,
      company_id INT NOT NULL DEFAULT 0,
      channel_id INT NOT NULL,
      user_email VARCHAR(191) NOT NULL,
      role VARCHAR(24) NOT NULL DEFAULT 'member',
      status VARCHAR(24) NOT NULL DEFAULT 'active',
      created_by VARCHAR(191) NOT NULL,
      updated_by VARCHAR(191) NOT NULL DEFAULT '',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY chat_channel_members_channel_user_unique (channel_id, user_email),
      INDEX chat_channel_members_channel_idx (channel_id, status),
      CONSTRAINT chat_channel_members_channel_fk FOREIGN KEY (channel_id) REFERENCES chat_channels (id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `
    )
    .execute(database);
}

async function applyChatReadSchema(database: Kysely<ChatDatabase>) {
  await sql
    .raw(
      `
    CREATE TABLE IF NOT EXISTS chat_channel_reads (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      uuid CHAR(8) NOT NULL UNIQUE,
      company_id INT NOT NULL DEFAULT 0,
      channel_id INT NOT NULL,
      user_email VARCHAR(191) NOT NULL,
      last_read_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(24) NOT NULL DEFAULT 'active',
      created_by VARCHAR(191) NOT NULL,
      updated_by VARCHAR(191) NOT NULL DEFAULT '',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY chat_channel_reads_channel_user_unique (channel_id, user_email),
      INDEX chat_channel_reads_channel_idx (channel_id),
      CONSTRAINT chat_channel_reads_channel_fk FOREIGN KEY (channel_id) REFERENCES chat_channels (id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `
    )
    .execute(database);
}

async function applyChatMessageExtrasSchema(database: Kysely<ChatDatabase>) {
  await sql
    .raw(
      `
    ALTER TABLE chat_messages
      ADD COLUMN IF NOT EXISTS reply_to_message_id INT NULL,
      ADD COLUMN IF NOT EXISTS edited_at DATETIME NULL,
      ADD INDEX IF NOT EXISTS chat_messages_reply_idx (reply_to_message_id)
  `
    )
    .execute(database);

  await sql
    .raw(
      `
    ALTER TABLE chat_messages
      ADD CONSTRAINT chat_messages_reply_fk
        FOREIGN KEY (reply_to_message_id) REFERENCES chat_messages (id)
  `
    )
    .execute(database);

  await sql
    .raw(
      `
    CREATE TABLE IF NOT EXISTS chat_message_reactions (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      uuid CHAR(8) NOT NULL UNIQUE,
      company_id INT NOT NULL DEFAULT 0,
      message_id INT NOT NULL,
      user_email VARCHAR(191) NOT NULL,
      emoji VARCHAR(16) NOT NULL,
      status VARCHAR(24) NOT NULL DEFAULT 'active',
      created_by VARCHAR(191) NOT NULL,
      updated_by VARCHAR(191) NOT NULL DEFAULT '',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY chat_message_reactions_unique (message_id, user_email, emoji),
      INDEX chat_message_reactions_message_idx (message_id),
      CONSTRAINT chat_message_reactions_message_fk FOREIGN KEY (message_id) REFERENCES chat_messages (id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `
    )
    .execute(database);
}

async function applyChatReadCursorSchema(database: Kysely<ChatDatabase>) {
  await sql`ALTER TABLE chat_channel_reads ADD COLUMN IF NOT EXISTS last_message_id INT NULL`.execute(
    database
  );
  await sql`UPDATE chat_channel_reads AS r SET last_message_id = COALESCE((
    SELECT MAX(message.id) FROM chat_messages AS message
    WHERE message.channel_id = r.channel_id AND message.company_id = r.company_id
      AND message.created_at <= r.last_read_at
  ), 0) WHERE last_message_id IS NULL`.execute(database);
}
