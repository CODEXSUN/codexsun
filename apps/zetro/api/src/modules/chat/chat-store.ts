import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { ZetroChatConversation, ZetroChatMessage, ZetroChatRole } from "@codexsun/zetro-contracts";

type ConversationRow = {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
  message_count: number;
  pinned: number;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  role: ZetroChatRole;
  content: string;
  created_at: number;
};

export class ChatStore {
  private readonly database: DatabaseSync;

  constructor(databasePath: string) {
    mkdirSync(dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS zetro_conversations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        pinned INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS zetro_messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES zetro_conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'error')),
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS zetro_messages_by_conversation
        ON zetro_messages(conversation_id, created_at);
    `);
    try {
      this.database.exec("ALTER TABLE zetro_conversations ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0;");
    } catch {
      // Existing databases already have the pinned column.
    }
  }

  close(): void {
    this.database.close();
  }

  createConversation(title: string): ZetroChatConversation {
    const now = Date.now();
    const conversation = { id: randomUUID(), title, pinned: false, createdAt: toIso(now), updatedAt: toIso(now), messageCount: 0 };
    this.database.prepare("INSERT INTO zetro_conversations (id, title, pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").run(conversation.id, title, 0, now, now);
    return conversation;
  }

  listConversations(): ZetroChatConversation[] {
    const rows = this.database.prepare(`
      SELECT conversations.id, conversations.title, conversations.pinned, conversations.created_at, conversations.updated_at,
        COUNT(messages.id) AS message_count
      FROM zetro_conversations AS conversations
      LEFT JOIN zetro_messages AS messages ON messages.conversation_id = conversations.id
      GROUP BY conversations.id
      ORDER BY conversations.updated_at DESC
    `).all() as unknown as ConversationRow[];
    return rows.map(toConversation);
  }

  getConversation(id: string): ZetroChatConversation | undefined {
    const row = this.database.prepare(`
      SELECT conversations.id, conversations.title, conversations.pinned, conversations.created_at, conversations.updated_at,
        COUNT(messages.id) AS message_count
      FROM zetro_conversations AS conversations
      LEFT JOIN zetro_messages AS messages ON messages.conversation_id = conversations.id
      WHERE conversations.id = ? GROUP BY conversations.id
    `).get(id) as unknown as ConversationRow | undefined;
    return row ? toConversation(row) : undefined;
  }

  listMessages(conversationId: string): ZetroChatMessage[] {
    const rows = this.database.prepare(
      "SELECT id, conversation_id, role, content, created_at FROM zetro_messages WHERE conversation_id = ? ORDER BY created_at",
    ).all(conversationId) as unknown as MessageRow[];
    return rows.map(toMessage);
  }

  addMessage(conversationId: string, role: ZetroChatRole, content: string): ZetroChatMessage {
    const now = Date.now();
    const message = { id: randomUUID(), conversationId, role, content, createdAt: toIso(now) };
    this.database.prepare("INSERT INTO zetro_messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)").run(message.id, conversationId, role, content, now);
    this.database.prepare("UPDATE zetro_conversations SET updated_at = ? WHERE id = ?").run(now, conversationId);
    return message;
  }

  updateConversation(id: string, update: { pinned?: boolean; title?: string }): ZetroChatConversation | undefined {
    const current = this.getConversation(id);
    if (!current) return undefined;
    const now = Date.now();
    const title = update.title ?? current.title;
    const pinned = update.pinned ?? current.pinned;
    this.database.prepare("UPDATE zetro_conversations SET title = ?, pinned = ?, updated_at = ? WHERE id = ?").run(title, Number(pinned), now, id);
    return this.getConversation(id);
  }

  deleteConversation(id: string): boolean {
    return this.database.prepare("DELETE FROM zetro_conversations WHERE id = ?").run(id).changes > 0;
  }
}

function toIso(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

function toConversation(row: ConversationRow): ZetroChatConversation {
  return { id: row.id, title: row.title, pinned: Boolean(row.pinned), createdAt: toIso(row.created_at), updatedAt: toIso(row.updated_at), messageCount: Number(row.message_count) };
}

function toMessage(row: MessageRow): ZetroChatMessage {
  return { id: row.id, conversationId: row.conversation_id, role: row.role, content: row.content, createdAt: toIso(row.created_at) };
}
