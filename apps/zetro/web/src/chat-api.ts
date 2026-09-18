import {
  zetroChatConversationListResponseSchema,
  zetroChatConversationResponseSchema,
  type ZetroChatConversation,
  type ZetroChatMessage,
  type ZetroChatRuntime,
  type ZetroChatRuntimeSelection,
  zetroChatStreamEventSchema,
  zetroChatRuntimeResponseSchema,
  type ZetroChatStreamEvent,
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

export async function getChatRuntime(): Promise<ZetroChatRuntime> {
  return zetroChatRuntimeResponseSchema.parse(await read(await fetch(`${conversationUrl}/runtime`))).data;
}

export async function sendMessage(id: string, content: string, runtime?: ZetroChatRuntimeSelection): Promise<ConversationView> {
  const response = await fetch(`${conversationUrl}/${id}/messages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content, runtime }),
  });
  return zetroChatConversationResponseSchema.parse(await read(response)).data;
}

export async function streamMessage(id: string, content: string, runtime: ZetroChatRuntimeSelection, onEvent: (event: ZetroChatStreamEvent) => void, signal?: AbortSignal): Promise<void> {
  const response = await fetch(`${conversationUrl}/${id}/messages/stream`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "text/event-stream" },
    body: JSON.stringify({ content, runtime }),
    signal,
  });
  if (!response.ok || !response.body) throw new Error(`The Zetro API stream failed (${response.status}).`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  for (;;) {
    const result = await reader.read();
    if (result.done) break;
    pending += decoder.decode(result.value, { stream: true });
    const records = pending.split("\n\n");
    pending = records.pop() ?? "";
    for (const record of records) {
      const data = record.split("\n").find((line) => line.startsWith("data: "))?.slice(6);
      if (data) onEvent(zetroChatStreamEventSchema.parse(JSON.parse(data)));
    }
  }
}

async function read(response: Response): Promise<unknown> {
  const body = await response.text();
  if (!body.trim()) {
    throw new Error(`The Zetro API returned an empty response (${response.status}).`);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    throw new Error(`The Zetro API returned an invalid response (${response.status}).`);
  }
  if (response.ok) return payload;
  const error = payload as { error?: unknown };
  throw new Error(typeof error.error === "string" ? error.error : "The Zetro API request failed.");
}
