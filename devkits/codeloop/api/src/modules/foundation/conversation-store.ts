import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

export type ConversationStatus = "idle" | "running" | "completed";

export type StoredConversation = {
  id: string;
  ownerId: string;
  projectId: string;
  title: string;
  status: ConversationStatus;
  createdAt: string;
  updatedAt: string;
};

export type StoredMessage = {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "error";
  content: string;
  trace?: readonly { type: string; message: string; data?: unknown }[];
  createdAt: string;
};

export type ConversationDetail = StoredConversation & {
  messages: readonly StoredMessage[];
};

type ConversationRow = {
  id: string;
  owner_id: string;
  project_id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  trace_json: string | null;
  created_at: string;
};

export class ConversationStore {
  private readonly database: DatabaseSync;

  constructor(databasePath: string) {
    if (!existsSync(databasePath)) mkdirSync(dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
  }

  initialize(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS codeloop_conversations (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'idle',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS codeloop_messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'error')),
        content TEXT NOT NULL,
        trace_json TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_codeloop_conversations_owner ON codeloop_conversations(owner_id, project_id, updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_codeloop_messages_conv ON codeloop_messages(conversation_id, created_at ASC);
    `);
  }

  listConversations(ownerId: string, projectId?: string): readonly StoredConversation[] {
    const query = projectId
      ? "SELECT id, owner_id, project_id, title, status, created_at, updated_at FROM codeloop_conversations WHERE owner_id = ? AND project_id = ? ORDER BY updated_at DESC"
      : "SELECT id, owner_id, project_id, title, status, created_at, updated_at FROM codeloop_conversations WHERE owner_id = ? ORDER BY updated_at DESC";

    const params = projectId ? [ownerId, projectId] : [ownerId];
    const rows = this.database.prepare(query).all(...params) as ConversationRow[];

    return rows.map((r) => ({
      id: r.id,
      ownerId: r.owner_id,
      projectId: r.project_id,
      title: r.title,
      status: (r.status as ConversationStatus) || "idle",
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  getConversation(ownerId: string, conversationId: string): ConversationDetail | null {
    const convRow = this.database
      .prepare("SELECT id, owner_id, project_id, title, status, created_at, updated_at FROM codeloop_conversations WHERE id = ? AND owner_id = ?")
      .get(conversationId, ownerId) as ConversationRow | undefined;

    if (!convRow) return null;

    const messageRows = this.database
      .prepare("SELECT id, conversation_id, role, content, trace_json, created_at FROM codeloop_messages WHERE conversation_id = ? ORDER BY created_at ASC")
      .all(conversationId) as MessageRow[];

    const messages: StoredMessage[] = messageRows.map((m) => {
      let trace: { type: string; message: string; data?: unknown }[] | undefined;
      if (m.trace_json) {
        try {
          trace = JSON.parse(m.trace_json);
        } catch {
          trace = undefined;
        }
      }
      return {
        id: m.id,
        conversationId: m.conversation_id,
        role: m.role as "user" | "assistant" | "error",
        content: m.content,
        trace,
        createdAt: m.created_at,
      };
    });

    return {
      id: convRow.id,
      ownerId: convRow.owner_id,
      projectId: convRow.project_id,
      title: convRow.title,
      status: (convRow.status as ConversationStatus) || "idle",
      createdAt: convRow.created_at,
      updatedAt: convRow.updated_at,
      messages,
    };
  }

  createConversation(
    ownerId: string,
    input: { id?: string; projectId: string; title?: string }
  ): StoredConversation {
    const id = input.id || `conv-${Date.now()}`;
    const now = new Date().toISOString();
    const title = input.title?.trim() || "New conversation";
    const status: ConversationStatus = "idle";

    this.database
      .prepare("INSERT INTO codeloop_conversations (id, owner_id, project_id, title, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(id, ownerId, input.projectId, title, status, now, now);

    return {
      id,
      ownerId,
      projectId: input.projectId,
      title,
      status,
      createdAt: now,
      updatedAt: now,
    };
  }

  updateConversation(
    ownerId: string,
    conversationId: string,
    updates: { title?: string; status?: ConversationStatus }
  ): StoredConversation | null {
    const now = new Date().toISOString();
    const existing = this.database
      .prepare("SELECT id, owner_id, project_id, title, status, created_at, updated_at FROM codeloop_conversations WHERE id = ? AND owner_id = ?")
      .get(conversationId, ownerId) as ConversationRow | undefined;

    if (!existing) return null;

    const newTitle = updates.title !== undefined ? updates.title.trim() : existing.title;
    const newStatus = updates.status !== undefined ? updates.status : existing.status;

    this.database
      .prepare("UPDATE codeloop_conversations SET title = ?, status = ?, updated_at = ? WHERE id = ? AND owner_id = ?")
      .run(newTitle, newStatus, now, conversationId, ownerId);

    return {
      id: existing.id,
      ownerId: existing.owner_id,
      projectId: existing.project_id,
      title: newTitle,
      status: newStatus as ConversationStatus,
      createdAt: existing.created_at,
      updatedAt: now,
    };
  }

  deleteConversation(ownerId: string, conversationId: string): boolean {
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database.prepare("DELETE FROM codeloop_messages WHERE conversation_id = ?").run(conversationId);
      this.database.prepare("DELETE FROM codeloop_conversations WHERE id = ? AND owner_id = ?").run(conversationId, ownerId);
      this.database.exec("COMMIT");
      return true;
    } catch (err) {
      this.database.exec("ROLLBACK");
      throw err;
    }
  }

  addMessage(
    conversationId: string,
    message: {
      id?: string;
      role: "user" | "assistant" | "error";
      content: string;
      trace?: readonly { type: string; message: string }[];
    }
  ): StoredMessage {
    const id = message.id || `msg-${Date.now()}-${message.role}`;
    const now = new Date().toISOString();
    const traceJson = message.trace && message.trace.length > 0 ? JSON.stringify(message.trace) : null;

    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database
        .prepare("INSERT INTO codeloop_messages (id, conversation_id, role, content, trace_json, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .run(id, conversationId, message.role, message.content, traceJson, now);

      this.database
        .prepare("UPDATE codeloop_conversations SET updated_at = ? WHERE id = ?")
        .run(now, conversationId);

      this.database.exec("COMMIT");
    } catch (err) {
      this.database.exec("ROLLBACK");
      throw err;
    }

    return {
      id,
      conversationId,
      role: message.role,
      content: message.content,
      trace: message.trace,
      createdAt: now,
    };
  }

  close(): void {
    this.database.close();
  }
}
