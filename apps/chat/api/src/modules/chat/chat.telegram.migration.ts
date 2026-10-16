import { sql, type Kysely } from "kysely";

export async function applyChatTelegramSchema(
  database: Kysely<Record<string, Record<string, unknown>>>
) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS chat_telegram_connections (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL UNIQUE,
    channel_uuid CHAR(8) NOT NULL UNIQUE, company_id INT NOT NULL,
    actor_email VARCHAR(191) NOT NULL, bot_id VARCHAR(32) NOT NULL UNIQUE,
    bot_username VARCHAR(191) NOT NULL, chat_id VARCHAR(32) NOT NULL,
    token_encrypted TEXT NOT NULL, next_update_id BIGINT NOT NULL DEFAULT 0,
    last_sent_id INT NOT NULL DEFAULT 0, status VARCHAR(24) NOT NULL DEFAULT 'active',
    lease_until DATETIME NULL, last_error VARCHAR(500) NULL, last_synced_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chat_telegram_channel_fk FOREIGN KEY (channel_uuid) REFERENCES chat_channels(uuid)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS chat_telegram_deliveries (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL UNIQUE,
    connection_id INT NOT NULL, message_id INT NOT NULL,
    telegram_message_id BIGINT NULL, status VARCHAR(24) NOT NULL DEFAULT 'sending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY chat_telegram_delivery_unique(connection_id, message_id),
    CONSTRAINT chat_telegram_delivery_connection_fk FOREIGN KEY(connection_id) REFERENCES chat_telegram_connections(id),
    CONSTRAINT chat_telegram_delivery_message_fk FOREIGN KEY(message_id) REFERENCES chat_messages(id)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}
