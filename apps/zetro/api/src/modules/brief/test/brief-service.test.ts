import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import type { ZetroChatConversationReader, ZetroUpsertIdeaBrief } from "@codexsun/zetro-contracts";
import { BriefReferenceError, BriefService } from "../brief-service.js";
import { BriefStore } from "../brief-store.js";

function input(messageId: string): ZetroUpsertIdeaBrief {
  return { audience: "Developers", constraints: "No task execution", exclusions: "No code changes", outcome: "A clear brief", projectReference: null, projectScope: "all-projects", risks: "Missing context", scope: "Registry lifecycle", sourceMessageIds: [messageId], status: "final", successSignals: "Review approved", title: "Registry review" };
}

test("accepts source messages that belong to its conversation", () => {
  const conversationId = randomUUID();
  const messageId = randomUUID();
  const reader: ZetroChatConversationReader = { getConversation: (id) => id === conversationId ? { conversation: { analysisRoot: null, archived: false, createdAt: new Date().toISOString(), id, messageCount: 1, pinned: false, stage: "final", title: "Registry", updatedAt: new Date().toISOString() }, messages: [{ content: "Review registry", conversationId: id, createdAt: new Date().toISOString(), id: messageId, role: "user" }] } : undefined };
  const service = new BriefService(new BriefStore(":memory:"), reader);
  try {
    assert.equal(service.saveBrief(conversationId, input(messageId)).status, "final");
  } finally {
    service.close();
  }
});

test("rejects source messages from another conversation", () => {
  const conversationId = randomUUID();
  const reader: ZetroChatConversationReader = { getConversation: () => ({ conversation: { analysisRoot: null, archived: false, createdAt: new Date().toISOString(), id: conversationId, messageCount: 0, pinned: false, stage: "final", title: "Registry", updatedAt: new Date().toISOString() }, messages: [] }) };
  const service = new BriefService(new BriefStore(":memory:"), reader);
  try {
    assert.throws(() => service.saveBrief(conversationId, input(randomUUID())), BriefReferenceError);
  } finally {
    service.close();
  }
});
