import {
  zetroChatConversationListResponseSchema,
  zetroChatConversationResponseSchema,
  type ZetroChatConversation,
  type ZetroChatMessage,
} from "@codexsun/zetro-contracts";

const conversationUrl = "/api/zetro/v1/chat/conversations";
export type ConversationView = { conversation: ZetroChatConversation; messages: ZetroChatMessage[] };

export async function listConversations(): Promise<ZetroChatConversation[]> {
  const response = await fetch(conversationUrl);
  return zetroChatConversationListResponseSchema.parse(await read(response)).data.conversations;
}

export async function createConversation(): Promise<ConversationView> {
  const response = await fetch(conversationUrl, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
  return zetroChatConversationResponseSchema.parse(await read(response)).data;
}

export async function getConversation(id: string): Promise<ConversationView> {
  return zetroChatConversationResponseSchema.parse(await read(await fetch(`${conversationUrl}/${id}`))).data;
}

export async function sendMessage(id: string, content: string): Promise<ConversationView> {
  const response = await fetch(`${conversationUrl}/${id}/messages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content }),
  });
  return zetroChatConversationResponseSchema.parse(await read(response)).data;
}

async function read(response: Response): Promise<unknown> {
  const payload: unknown = await response.json();
  if (response.ok) return payload;
  const error = payload as { error?: unknown };
  throw new Error(typeof error.error === "string" ? error.error : "The Zetro API request failed.");
}
