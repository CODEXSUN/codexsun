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
