import { randomUUID } from "node:crypto";

import type { Kysely } from "kysely";

import { zetroTableNames } from "../../database/table-names.js";
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js";
import type { ZetroOutputModeId } from "../../shared/index.js";
import type { ZetroModelProviderId } from "./model-provider-types.js";
import {
  listStorePayloads,
  listStoreRecords,
  replaceStoreRecords,
} from "../data/query-database.js";

export type ZetroChatSessionStatus = "active" | "archived";

export type ZetroChatSession = {
  id: string;
  title: string;
  providerId: ZetroModelProviderId;
  outputMode: ZetroOutputModeId;
  messageCount: number;
  status: ZetroChatSessionStatus;
  createdAt: string;
  updatedAt: string;
};

export type ZetroChatMessage = {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  tokens?: number;
  modelId?: string;
  finishReason?: string;
  createdAt: string;
};

export type ZetroCreateChatSessionInput = {
  providerId?: ZetroModelProviderId;
  outputMode?: ZetroOutputModeId;
  title?: string;
};

export type ZetroCreateChatMessageInput = {
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  tokens?: number;
  modelId?: string;
  finishReason?: string;
};

export async function listZetroChatSessions(
  database: Kysely<unknown>,
  filters?: { status?: ZetroChatSessionStatus },
) {
  let sessions = await listStorePayloads<ZetroChatSession>(
    database,
    zetroTableNames.chatSessions,
  );

  if (filters?.status) {
    sessions = sessions.filter((s) => s.status === filters.status);
  }

  return sessions.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function getZetroChatSession(
  database: Kysely<unknown>,
  sessionId: string,
) {
  const sessions = await listStorePayloads<ZetroChatSession>(
    database,
    zetroTableNames.chatSessions,
  );

  return sessions.find((s) => s.id === sessionId) ?? null;
}

export async function createZetroChatSession(
  database: Kysely<unknown>,
  input?: ZetroCreateChatSessionInput,
) {
  const now = new Date().toISOString();
  const session: ZetroChatSession = {
    id: `zetro-session-${randomUUID()}`,
    title: input?.title ?? `Chat ${new Date().toLocaleDateString()}`,
    providerId: input?.providerId ?? "none",
    outputMode: input?.outputMode ?? "normal",
    messageCount: 0,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  const records = await listStoreRecords<ZetroChatSession>(
    database,
    zetroTableNames.chatSessions,
  );

  await replaceStoreRecords(database, zetroTableNames.chatSessions, [
    ...records,
    {
      id: session.id,
      moduleKey: "session",
      sortOrder: (records.at(-1)?.sortOrder ?? 0) + 10,
      payload: session,
    },
  ]);

  return session;
}

export async function listZetroChatMessages(
  database: Kysely<unknown>,
  sessionId: string,
) {
  const messages = await listStorePayloads<ZetroChatMessage>(
    database,
    zetroTableNames.chatMessages,
  );

  return messages
    .filter((m) => m.sessionId === sessionId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
}

export async function createZetroChatMessage(
  database: Kysely<unknown>,
  input: ZetroCreateChatMessageInput,
) {
  const session = await getZetroChatSession(database, input.sessionId);

  if (!session) {
    throw new ApplicationError(
      "Zetro chat session not found.",
      { sessionId: input.sessionId },
      404,
    );
  }

  const now = new Date().toISOString();
  const message: ZetroChatMessage = {
    id: `zetro-message-${randomUUID()}`,
    sessionId: input.sessionId,
    role: input.role,
    content: input.content,
    tokens: input.tokens,
    modelId: input.modelId,
    finishReason: input.finishReason,
    createdAt: now,
  };

  const records = await listStoreRecords<ZetroChatMessage>(
    database,
    zetroTableNames.chatMessages,
  );

  await replaceStoreRecords(database, zetroTableNames.chatMessages, [
    ...records,
    {
      id: message.id,
      moduleKey: input.sessionId,
      sortOrder: (records.at(-1)?.sortOrder ?? 0) + 10,
      payload: message,
    },
  ]);

  const updatedSession: ZetroChatSession = {
    ...session,
    messageCount: session.messageCount + 1,
    updatedAt: now,
  };

  const sessionRecords = await listStoreRecords<ZetroChatSession>(
    database,
    zetroTableNames.chatSessions,
  );

  await replaceStoreRecords(
    database,
    zetroTableNames.chatSessions,
    sessionRecords.map((r) =>
      r.id === session.id ? { ...r, payload: updatedSession } : r,
    ),
  );

  return message;
}

export async function updateZetroChatSession(
  database: Kysely<unknown>,
  sessionId: string,
  updates: Partial<Pick<ZetroChatSession, "title" | "status" | "outputMode">>,
) {
  const session = await getZetroChatSession(database, sessionId);

  if (!session) {
    throw new ApplicationError(
      "Zetro chat session not found.",
      { sessionId },
      404,
    );
  }

  const now = new Date().toISOString();
  const updatedSession: ZetroChatSession = {
    ...session,
    ...updates,
    updatedAt: now,
  };

  const records = await listStoreRecords<ZetroChatSession>(
    database,
    zetroTableNames.chatSessions,
  );

  await replaceStoreRecords(
    database,
    zetroTableNames.chatSessions,
    records.map((r) =>
      r.id === sessionId ? { ...r, payload: updatedSession } : r,
    ),
  );

  return updatedSession;
}

export async function archiveZetroChatSession(
  database: Kysely<unknown>,
  sessionId: string,
) {
  return updateZetroChatSession(database, sessionId, { status: "archived" });
}
