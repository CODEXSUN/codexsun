import assert from "node:assert/strict";
import test from "node:test";
import { ChatStore } from "../chat-store.js";

test("stores a conversation and its message history", () => {
  const store = new ChatStore(":memory:");

  try {
    const conversation = store.createConversation("Release notes");
    store.addMessage(conversation.id, "user", "Help me refine the release message.");
    store.addMessage(conversation.id, "assistant", "Start with the user outcome and the verified change.");

    assert.equal(store.listConversations()[0]?.messageCount, 2);
    assert.deepEqual(
      store.listMessages(conversation.id).map((message) => message.role),
      ["user", "assistant"],
    );
  } finally {
    store.close();
  }
});

test("persists conversation title and pin changes, then deletes the conversation", () => {
  const store = new ChatStore(":memory:");

  try {
    const conversation = store.createConversation("Initial idea");
    const updated = store.updateConversation(conversation.id, { pinned: true, title: "Refined idea" });
    assert.equal(updated?.pinned, true);
    assert.equal(updated?.title, "Refined idea");
    assert.equal(store.deleteConversation(conversation.id), true);
    assert.equal(store.getConversation(conversation.id), undefined);
  } finally {
    store.close();
  }
});
