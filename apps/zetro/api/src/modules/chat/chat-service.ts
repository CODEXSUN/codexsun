import { spawn } from "node:child_process";
import type { ZetroChatConversation, ZetroChatMessage } from "@codexsun/zetro-contracts";
import { ChatStore } from "./chat-store.js";

export class ChatService {
  constructor(private readonly store: ChatStore) {}

  createConversation(title = "New idea"): ZetroChatConversation {
    return this.store.createConversation(title);
  }

  listConversations(): ZetroChatConversation[] {
    return this.store.listConversations();
  }

  getConversation(id: string): ChatConversation | undefined {
    const conversation = this.store.getConversation(id);
    return conversation ? { conversation, messages: this.store.listMessages(id) } : undefined;
  }

  async sendMessage(conversationId: string, content: string): Promise<ChatConversation> {
    if (!this.store.getConversation(conversationId)) throw new ConversationNotFoundError();
    this.store.addMessage(conversationId, "user", content);

    try {
      this.store.addMessage(conversationId, "assistant", await runLocalCodex(this.transcript(conversationId)));
    } catch (error) {
      this.store.addMessage(conversationId, "error", error instanceof Error ? error.message : "Local Codex did not return a reply.");
    }

    const result = this.getConversation(conversationId);
    if (!result) throw new ConversationNotFoundError();
    return result;
  }

  close(): void {
    this.store.close();
  }

  private transcript(conversationId: string): string {
    const conversation = this.store.listMessages(conversationId).map((message) => `${message.role}: ${message.content}`).join("\n\n");
    return `You are Zetro, a concise collaborative idea partner. Help the user explore, revise, and finish an idea.\n\n${conversation}`;
  }
}

export type ChatConversation = { conversation: ZetroChatConversation; messages: ZetroChatMessage[] };

export class ConversationNotFoundError extends Error {
  constructor() {
    super("Conversation not found.");
  }
}

function runLocalCodex(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.env.ZETRO_CODEX_COMMAND || "codex", ["exec", "--ephemeral", "--sandbox", "read-only", prompt], { shell: false, windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => (stdout += chunk));
    child.stderr.on("data", (chunk: string) => (stderr += chunk));
    child.on("error", () => reject(new Error("Zetro could not start the local Codex CLI. Set ZETRO_CODEX_COMMAND or sign in to Codex locally.")));
    child.on("close", (code) => {
      if (code === 0 && stdout.trim()) return resolve(stdout.trim());
      reject(new Error(stderr.trim() || "Local Codex did not return a reply."));
    });
  });
}
