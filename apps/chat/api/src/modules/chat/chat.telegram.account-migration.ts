import { sql, type Kysely } from "kysely";

export async function applyChatTelegramAccountSchema(
  database: Kysely<Record<string, Record<string, unknown>>>
) {
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS chat_telegram_accounts (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL UNIQUE,
    company_id INT NOT NULL, actor_email VARCHAR(191) NOT NULL, api_id INT NOT NULL,
    phone_label VARCHAR(32) NOT NULL, account_label VARCHAR(191) NOT NULL DEFAULT '',
    credentials_encrypted LONGTEXT NOT NULL, auth_state VARCHAR(24) NOT NULL DEFAULT 'disconnected',
    operation_id VARCHAR(32) NOT NULL DEFAULT '', auth_expires_at DATETIME NULL,
    auth_attempts INT NOT NULL DEFAULT 0, code_requested_at DATETIME NULL,
    lease_until DATETIME NULL, last_error VARCHAR(500) NULL, last_synced_at DATETIME NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'active', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY chat_telegram_account_owner(company_id, actor_email)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS chat_telegram_dialogs (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL UNIQUE,
    account_uuid CHAR(8) NOT NULL, peer_key VARCHAR(64) NOT NULL, title VARCHAR(191) NOT NULL,
    peer_encrypted TEXT NOT NULL, channel_uuid CHAR(8) NULL,
    last_received_id INT NOT NULL DEFAULT 0, last_sent_id INT NOT NULL DEFAULT 0,
    status VARCHAR(24) NOT NULL DEFAULT 'active', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY chat_telegram_dialog_peer(account_uuid, peer_key),
    UNIQUE KEY chat_telegram_dialog_channel(channel_uuid),
    FOREIGN KEY (account_uuid) REFERENCES chat_telegram_accounts(uuid),
    FOREIGN KEY (channel_uuid) REFERENCES chat_channels(uuid)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS chat_telegram_account_messages (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, uuid CHAR(8) NOT NULL UNIQUE,
    dialog_uuid CHAR(8) NOT NULL, local_message_id INT NOT NULL, remote_message_id INT NULL,
    random_id VARCHAR(32) NOT NULL, direction VARCHAR(24) NOT NULL, status VARCHAR(24) NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY chat_telegram_account_local(dialog_uuid, local_message_id),
    UNIQUE KEY chat_telegram_account_remote(dialog_uuid, remote_message_id),
    FOREIGN KEY (dialog_uuid) REFERENCES chat_telegram_dialogs(uuid),
    FOREIGN KEY (local_message_id) REFERENCES chat_messages(id)
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
  // Retain bot history, but disable its credentials when upgrading to user accounts.
  await sql`UPDATE chat_telegram_connections SET status='inactive', token_encrypted=''`.execute(
    database
  );
}
