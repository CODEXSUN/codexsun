import type { ZetroChatConversationReader, ZetroIdeaBrief, ZetroUpsertIdeaBrief } from "@codexsun/zetro-contracts";
import { BriefStore } from "./brief-store";

export class BriefNotFoundError extends Error {
  constructor() {
    super("Final brief not found.");
  }
}

export class BriefReferenceError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class BriefService {
  constructor(private readonly store: BriefStore, private readonly chat: ZetroChatConversationReader) {}

  getBrief(conversationId: string): ZetroIdeaBrief | undefined {
    return this.store.getByConversation(conversationId);
  }

  getFinalBrief(id: string): ZetroIdeaBrief {
    const brief = this.store.get(id);
    if (!brief || brief.status !== "final") throw new BriefNotFoundError();
    return brief;
  }

  saveBrief(conversationId: string, input: ZetroUpsertIdeaBrief): ZetroIdeaBrief {
    const conversation = this.chat.getConversation(conversationId);
    if (!conversation) throw new BriefReferenceError("Conversation not found.");
    const messageIds = new Set(conversation.messages.map((message) => message.id));
    if (input.sourceMessageIds.some((id: string) => !messageIds.has(id))) {
      throw new BriefReferenceError("A source message does not belong to this conversation.");
    }
    return this.store.save(conversationId, input);
  }

  close(): void {
    this.store.close();
  }
}
