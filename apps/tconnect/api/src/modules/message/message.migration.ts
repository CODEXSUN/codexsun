import { sql, type Kysely } from "kysely";
import type { TconnectDatabase } from "../../context.js";
import { referenceCollation } from "../../migration-collation.js";
export async function migrateMessage(database: Kysely<TconnectDatabase>) {
  const conversationCollation = await referenceCollation(database, "tconnect_conversations");
  const userCollation = await referenceCollation(database, "app_users");
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS tconnect_messages (
 id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,uuid CHAR(8) NOT NULL UNIQUE,conversation_uuid CHAR(8) ${conversationCollation} NOT NULL,
 sender_user_uuid VARCHAR(8) ${userCollation} NOT NULL,sender_side VARCHAR(24) NOT NULL,body TEXT NOT NULL,status VARCHAR(24) NOT NULL DEFAULT 'active',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY(conversation_uuid) REFERENCES tconnect_conversations(uuid),FOREIGN KEY(sender_user_uuid) REFERENCES app_users(uuid),
 INDEX(conversation_uuid,id),INDEX(sender_user_uuid,created_at)
 ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(database);
}
