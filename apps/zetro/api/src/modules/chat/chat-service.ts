import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import type { ZetroChatConversation, ZetroChatMessage, ZetroChatRuntime, ZetroChatRuntimeSelection, ZetroChatStreamEvent, ZetroCodexDeviceCode } from "@codexsun/zetro-contracts";
import { ChatStore } from "./chat-store.js";
import { CodexDeviceCode } from "./codex-device-code.js";

export class ChatService {
  private readonly deviceCode = new CodexDeviceCode();
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

  async getRuntime(): Promise<ZetroChatRuntime> {
    const connected = await probeLocalCodex();
    return {
      connected,
      message: connected ? "Connected to the local Codex CLI." : "Local Codex is not connected. Open Settings to sign in.",
      model: "Default",
      models: ["Default", "gpt-5.6-sol", "gpt-5.6-terra", "gpt-6-astra"],
      provider: "Codex",
      providers: ["Codex"],
      reasoning: "Default",
      reasoningLevels: ["Default", "Low", "Medium", "High", "XHigh"],
    };
  }

  async generateDeviceCode(): Promise<ZetroCodexDeviceCode> {
    return this.deviceCode.generate(codexCommand());
  }

  getDeviceCode(): ZetroCodexDeviceCode {
    return this.deviceCode.status();
  }

  async sendMessage(conversationId: string, content: string, runtime?: ZetroChatRuntimeSelection): Promise<ChatConversation> {
    if (!this.store.getConversation(conversationId)) throw new ConversationNotFoundError();
    this.store.addMessage(conversationId, "user", content);

    try {
      this.store.addMessage(conversationId, "assistant", await runLocalCodex(this.transcript(conversationId), runtime));
    } catch (error) {
      this.store.addMessage(conversationId, "error", error instanceof Error ? error.message : "Local Codex did not return a reply.");
    }

    const result = this.getConversation(conversationId);
    if (!result) throw new ConversationNotFoundError();
    return result;
  }

  async streamMessage(conversationId: string, content: string, publish: (event: ZetroChatStreamEvent) => void, signal?: AbortSignal, runtime?: ZetroChatRuntimeSelection): Promise<ChatConversation> {
    if (!this.store.getConversation(conversationId)) throw new ConversationNotFoundError();
    this.store.addMessage(conversationId, "user", content);

    try {
      publish({ type: "processing", message: runtimeLabel(runtime) });
      const response = await runLocalCodexStream(this.transcript(conversationId), publish, signal, runtime);
      this.store.addMessage(conversationId, "assistant", response);
      publish({ type: "complete", message: "Codex response saved to this conversation." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Local Codex did not return a reply.";
      this.store.addMessage(conversationId, "error", message);
      publish({ type: "error", message });
    }

    const result = this.getConversation(conversationId);
    if (!result) throw new ConversationNotFoundError();
    return result;
  }

  close(): void {
    this.deviceCode.stop();
    this.store.close();
  }

  private transcript(conversationId: string): string {
    const conversation = this.store.listMessages(conversationId).map((message) => `${message.role}: ${message.content}`).join("\n\n");
    return `Use the $zetro-idea-workshop skill. You are Zetro, a concise collaborative idea partner. Stay in the idea stage. Do not create tasks, plans, worktrees, code changes, commands, or approvals. Help the user explore, revise, compare, and finish an idea.\n\n${conversation}`;
  }
}

export type ChatConversation = { conversation: ZetroChatConversation; messages: ZetroChatMessage[] };

export class ConversationNotFoundError extends Error {
  constructor() {
    super("Conversation not found.");
  }
}

function runLocalCodex(prompt: string, runtime?: ZetroChatRuntimeSelection): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(codexCommand(), codexArguments(prompt, false, runtime), { shell: false, windowsHide: true });
    child.stdin.end();
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

function runLocalCodexStream(prompt: string, publish: (event: ZetroChatStreamEvent) => void, signal?: AbortSignal, runtime?: ZetroChatRuntimeSelection): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Codex response was stopped."));
      return;
    }
    const child = spawn(codexCommand(), codexArguments(prompt, true, runtime), { shell: false, windowsHide: true });
    child.stdin.end();
    const stopChild = () => child.kill();
    signal?.addEventListener("abort", stopChild, { once: true });
    const output: string[] = [];
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    createInterface({ input: child.stdout }).on("line", (line) => {
      const event = parseCodexEvent(line);
      if (!event) return;
      publish(event);
      if (event.type === "response") output.push(event.message);
    });
    child.stderr.on("data", (chunk: string) => (stderr += chunk));
    child.on("error", () => reject(new Error("Zetro could not start the local Codex CLI. Set ZETRO_CODEX_COMMAND or sign in to Codex locally.")));
    child.on("close", (code) => {
      signal?.removeEventListener("abort", stopChild);
      const response = output.at(-1)?.trim();
      if (code === 0 && response) return resolve(response);
      reject(new Error(signal?.aborted ? "Codex response was stopped." : redact(stderr.trim() || "Local Codex did not return a reply.")));
    });
  });
}

function parseCodexEvent(line: string): ZetroChatStreamEvent | undefined {
  try {
    const event = JSON.parse(line) as { item?: { command?: string; path?: string; query?: string; text?: string; type?: string }; type?: string };
    const item = event.item;
    const itemType = item?.type;
    const raw = redact(line);
    if (itemType === "command_execution") return { type: "command", message: redact(item?.command || "Running a read-only command."), raw };
    if (itemType === "agent_message" && item?.text) return { type: "response", message: redact(item.text), raw };
    if (itemType === "reasoning") return { type: "review", message: "Reviewing the idea and constraints.", raw };
    if (itemType === "web_search" || itemType === "mcp_tool_call") return { type: "request", message: redact(item?.query || itemType), raw };
    if (itemType === "file_change") return { type: "change", message: redact(item?.path || "Changed files."), raw };
    return { type: "processing", message: event.type || itemType || "Codex event", raw };
  } catch {
    return undefined;
  }
}

function redact(value: string): string {
  return value.replace(/(api[_-]?key|access[_-]?token|token|secret|password)\s*[:=]\s*[^\s,}"']+/gi, "$1=[REDACTED]");
}

function codexArguments(prompt: string, json: boolean, runtime?: ZetroChatRuntimeSelection): string[] {
  const argumentsList = ["exec", "--ephemeral", "--sandbox", "read-only"];
  if (json) argumentsList.push("--json");
  if (runtime?.model && runtime.model !== "Default") argumentsList.push("--model", runtime.model);
  if (runtime?.reasoning && runtime.reasoning !== "Default") argumentsList.push("--config", `model_reasoning_effort=${JSON.stringify(runtime.reasoning.toLowerCase())}`);
  argumentsList.push(prompt);
  return argumentsList;
}

function codexCommand(): string {
  return process.env.ZETRO_CODEX_COMMAND || "codex";
}

function runtimeLabel(runtime?: ZetroChatRuntimeSelection): string {
  const model = runtime?.model === "Default" || !runtime ? "default model" : runtime.model;
  const reasoning = runtime?.reasoning === "Default" || !runtime ? "default reasoning" : `${runtime.reasoning.toLowerCase()} reasoning`;
  return `Starting local Codex with ${model} and ${reasoning} in read-only mode.`;
}

function probeLocalCodex(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(codexCommand(), ["login", "status"], { shell: false, windowsHide: true });
    const timeout = setTimeout(() => child.kill(), 3_000);
    child.once("error", () => resolve(false));
    child.once("close", (code) => {
      clearTimeout(timeout);
      resolve(code === 0);
    });
  });
}
