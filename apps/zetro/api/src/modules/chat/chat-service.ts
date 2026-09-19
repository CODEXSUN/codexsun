import { spawn } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import type { ZetroChatAttachment, ZetroChatConversation, ZetroChatConversationView, ZetroChatRuntime, ZetroChatRuntimeSelection, ZetroChatStreamEvent, ZetroCodexDeviceCode } from "@codexsun/zetro-contracts";
import { ChatStore } from "./chat-store.js";
import { ChatAttachmentStore } from "./chat-attachment-store.js";
import { CodexDeviceCode } from "./codex-device-code.js";
import { findAnalysisRoot } from "./analysis-root.js";

export class ChatService {
  private readonly deviceCode = new CodexDeviceCode();
  constructor(private readonly store: ChatStore, private readonly attachments: ChatAttachmentStore) {}

  createConversation(title = "New idea"): ZetroChatConversation {
    return this.store.createConversation(title);
  }

  listConversations(archived = false): ZetroChatConversation[] {
    return this.store.listConversations(archived);
  }

  updateConversation(id: string, update: { archived?: boolean; pinned?: boolean; stage?: ZetroChatConversation["stage"]; title?: string }): ZetroChatConversation | undefined {
    return this.store.updateConversation(id, update);
  }

  deleteConversation(id: string): boolean {
    return this.store.deleteConversation(id);
  }

  deleteArchivedConversations(): number {
    return this.store.deleteArchivedConversations();
  }

  getConversation(id: string): ZetroChatConversationView | undefined {
    const conversation = this.store.getConversation(id);
    return conversation ? { conversation, messages: this.store.listMessages(id) } : undefined;
  }

  async getRuntime(): Promise<ZetroChatRuntime> {
    const connected = await probeLocalCodex();
    const settings = readCodexSettings();
    return {
      connected,
      message: connected ? "Connected to the local Codex CLI." : "Local Codex is not connected. Open Settings to sign in.",
      model: settings.model,
      models: orderedModels(settings.model),
      provider: "Codex",
      providers: ["Codex"],
      reasoning: settings.reasoning,
      reasoningLevels: ["Low", "Medium", "High", "XHigh"],
    };
  }

  async updateRuntime(runtime: ZetroChatRuntimeSelection): Promise<ZetroChatRuntime> {
    writeCodexSettings(runtime);
    return this.getRuntime();
  }

  async generateDeviceCode(): Promise<ZetroCodexDeviceCode> {
    return this.deviceCode.generate(codexCommand());
  }

  getDeviceCode(): ZetroCodexDeviceCode {
    return this.deviceCode.status();
  }

  async sendMessage(conversationId: string, content: string, runtime?: ZetroChatRuntimeSelection): Promise<ZetroChatConversationView> {
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

  async streamMessage(conversationId: string, content: string, publish: (event: ZetroChatStreamEvent) => void, signal?: AbortSignal, runtime?: ZetroChatRuntimeSelection, attachments: ZetroChatAttachment[] = []): Promise<ZetroChatConversationView> {
    if (!this.store.getConversation(conversationId)) throw new ConversationNotFoundError();
    this.store.addMessage(conversationId, "user", content);

    try {
      publish({ type: "processing", message: runtimeLabel(runtime) });
      const analysis = await findAnalysisRoot(content);
      if (analysis) {
        this.store.setAnalysisRoot(conversationId, analysis.path);
        publish({ type: "review", message: `Read-only analysis root accepted: ${analysis.path}` });
      }
      const response = await this.runWithAttachments([this.transcript(conversationId), analysis?.prompt].filter(Boolean).join("\n\n"), attachments, publish, signal, runtime, analysis?.path);
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

  private async runWithAttachments(prompt: string, attachments: ZetroChatAttachment[], publish: (event: ZetroChatStreamEvent) => void, signal?: AbortSignal, runtime?: ZetroChatRuntimeSelection, cwd?: string): Promise<string> {
    if (!attachments.length) return runLocalCodexStream(prompt, publish, signal, runtime, [], cwd);
    const materialized = await this.attachments.materialize(attachments);
    try {
      return runLocalCodexStream([prompt, ...materialized.promptContext].join("\n\n"), publish, signal, runtime, materialized.images, cwd);
    } finally {
      await materialized.dispose();
    }
  }
}

export class ConversationNotFoundError extends Error {
  constructor() {
    super("Conversation not found.");
  }
}

function runLocalCodex(prompt: string, runtime?: ZetroChatRuntimeSelection): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(codexCommand(), codexArguments(false, runtime), { shell: false, windowsHide: true });
    child.stdin.end(prompt);
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

function runLocalCodexStream(prompt: string, publish: (event: ZetroChatStreamEvent) => void, signal?: AbortSignal, runtime?: ZetroChatRuntimeSelection, images: string[] = [], cwd?: string): Promise<string> {
  if (!images.length) return runLocalCodexAppServer(prompt, publish, signal, runtime, cwd);
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Codex response was stopped."));
      return;
    }
    const child = spawn(codexCommand(), codexArguments(true, runtime, images), { cwd, shell: false, windowsHide: true });
    child.stdin.end(prompt);
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

function runLocalCodexAppServer(prompt: string, publish: (event: ZetroChatStreamEvent) => void, signal?: AbortSignal, runtime?: ZetroChatRuntimeSelection, cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Codex response was stopped."));
      return;
    }

    const child = spawn(codexCommand(), ["app-server"], { cwd, shell: false, windowsHide: true });
    let settled = false;
    let stderr = "";
    let threadId: string | undefined;
    let turnId: string | undefined;
    let response = "";

    const send = (message: unknown) => child.stdin.write(`${JSON.stringify(message)}\n`);
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener("abort", stopChild);
      child.kill();
      if (error) reject(error);
      else if (response.trim()) resolve(response.trim());
      else reject(new Error(redact(stderr.trim() || "Local Codex did not return a reply.")));
    };
    const stopChild = () => {
      if (threadId && turnId) {
        send({ method: "turn/interrupt", id: 3, params: { threadId, turnId } });
        return;
      }
      child.kill();
    };

    signal?.addEventListener("abort", stopChild, { once: true });
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => (stderr += chunk));
    child.once("error", () => finish(new Error("Zetro could not start the local Codex CLI. Set ZETRO_CODEX_COMMAND or sign in to Codex locally.")));
    child.once("close", () => {
      if (settled) return;
      finish(signal?.aborted ? new Error("Codex response was stopped.") : undefined);
    });
    createInterface({ input: child.stdout }).on("line", (line) => {
      const event = parseAppServerEvent(line);
      if (!event) return;

      if (event.id === 0 && event.result) {
        send({ method: "initialized", params: {} });
        send({ method: "thread/start", id: 1, params: runtime?.model && runtime.model !== "Default" ? { model: runtime.model } : {} });
        return;
      }
      if (event.id === 1 && event.result?.thread?.id) {
        threadId = event.result.thread.id;
        send({
          method: "turn/start",
          id: 2,
          params: {
            threadId,
            input: [{ type: "text", text: prompt }],
            cwd,
            approvalPolicy: "never",
            sandboxPolicy: { type: "readOnly" },
            ...(runtime?.model && runtime.model !== "Default" ? { model: runtime.model } : {}),
            ...(runtime?.reasoning && runtime.reasoning !== "Default" ? { effort: runtime.reasoning.toLowerCase() } : {}),
          },
        });
        return;
      }
      if (event.id === 2 && event.result?.turn?.id) {
        turnId = event.result.turn.id;
        return;
      }
      if (event.method === "item/agentMessage/delta" && event.params?.delta) {
        response += event.params.delta;
        publish({ type: "response", message: response, raw: redact(line) });
        return;
      }
      if (event.method === "item/completed" && event.params?.item?.type === "agentMessage" && event.params.item.text && !response) {
        response = event.params.item.text;
        publish({ type: "response", message: response, raw: redact(line) });
        return;
      }
      if (event.method === "turn/completed") {
        if (event.params?.turn?.status === "failed") {
          finish(new Error(redact(event.params?.turn?.error?.message || "Local Codex did not return a reply.")));
        } else {
          finish();
        }
        return;
      }

      const streamEvent = parseAppServerStreamEvent(event, line);
      if (streamEvent) publish(streamEvent);
    });
    send({ method: "initialize", id: 0, params: { clientInfo: { name: "zetro", title: "Zetro", version: "1.0.26" } } });
  });
}

type AppServerEvent = {
  id?: number;
  method?: string;
  result?: { thread?: { id?: string }; turn?: { id?: string } };
  params?: {
    delta?: string;
    item?: { command?: string; path?: string; query?: string; text?: string; type?: string };
    turn?: { error?: { message?: string }; status?: string };
  };
};

function parseAppServerEvent(line: string): AppServerEvent | undefined {
  try {
    return JSON.parse(line) as AppServerEvent;
  } catch {
    return undefined;
  }
}

function parseAppServerStreamEvent(event: AppServerEvent, line: string): ZetroChatStreamEvent | undefined {
  const item = event.params?.item;
  const itemType = item?.type;
  const raw = redact(line);
  if (event.method === "item/reasoning/summaryTextDelta") return { type: "review", message: "Reviewing the idea and constraints.", raw };
  if (event.method === "item/commandExecution/outputDelta") return { type: "command", message: "Running a read-only command.", raw };
  if (itemType === "commandExecution") return { type: "command", message: redact(item?.command || "Running a read-only command."), raw };
  if (itemType === "reasoning") return { type: "review", message: "Reviewing the idea and constraints.", raw };
  if (itemType === "webSearch" || itemType === "mcpToolCall") return { type: "request", message: redact(item?.query || itemType), raw };
  if (itemType === "fileChange") return { type: "change", message: redact(item?.path || "Changed files."), raw };
  return event.method ? { type: "processing", message: event.method, raw } : undefined;
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

function codexArguments(json: boolean, runtime?: ZetroChatRuntimeSelection, images: string[] = []): string[] {
  const argumentsList = ["exec", "--ephemeral", "--sandbox", "read-only"];
  if (json) argumentsList.push("--json");
  for (const image of images) argumentsList.push("--image", image);
  if (runtime?.model && runtime.model !== "Default") argumentsList.push("--model", runtime.model);
  if (runtime?.reasoning && runtime.reasoning !== "Default") argumentsList.push("--config", `model_reasoning_effort=${JSON.stringify(runtime.reasoning.toLowerCase())}`);
  argumentsList.push("-");
  return argumentsList;
}

function codexCommand(): string {
  return process.env.ZETRO_CODEX_COMMAND || installedWindowsCodex() || "codex";
}

function installedWindowsCodex(): string | undefined {
  if (process.platform !== "win32" || !process.env.LOCALAPPDATA) return undefined;
  const binDirectory = join(process.env.LOCALAPPDATA, "OpenAI", "Codex", "bin");
  try {
    return readdirSync(binDirectory).sort().reverse().map((version) => join(binDirectory, version, "codex.exe")).find(existsSync);
  } catch {
    return undefined;
  }
}

function readCodexSettings(): { model: ZetroChatRuntimeSelection["model"]; reasoning: ZetroChatRuntimeSelection["reasoning"] } {
  const config = readCodexConfig();
  return {
    model: parseModel(config, "model") ?? "gpt-5.6-terra",
    reasoning: parseReasoning(config, "model_reasoning_effort") ?? "Medium",
  };
}

function writeCodexSettings(runtime: ZetroChatRuntimeSelection): void {
  const configPath = codexConfigPath();
  const current = readCodexConfig();
  const withModel = updateTomlValue(current, "model", runtime.model);
  writeFileSync(configPath, updateTomlValue(withModel, "model_reasoning_effort", runtime.reasoning.toLowerCase()), "utf8");
}

function readCodexConfig(): string {
  try {
    return readFileSync(codexConfigPath(), "utf8");
  } catch {
    return "";
  }
}

function codexConfigPath(): string {
  return join(homedir(), ".codex", "config.toml");
}

function updateTomlValue(config: string, key: string, value: string): string {
  const setting = `${key} = ${JSON.stringify(value)}`;
  const expression = new RegExp(`^\\s*${key}\\s*=.*$`, "m");
  if (expression.test(config)) return config.replace(expression, setting);
  const lines = config.split(/\\r?\\n/);
  const firstTable = lines.findIndex((line) => /^\\s*\[/.test(line));
  lines.splice(firstTable < 0 ? lines.length : firstTable, 0, setting);
  return lines.join("\n").replace(/\n+$/, "\n");
}

function parseModel(config: string, key: string): ZetroChatRuntimeSelection["model"] | undefined {
  return readTomlString(config, key);
}

function parseReasoning(config: string, key: string): ZetroChatRuntimeSelection["reasoning"] | undefined {
  const value = readTomlString(config, key)?.toLowerCase();
  const levels = { low: "Low", medium: "Medium", high: "High", xhigh: "XHigh" } as const;
  return value && value in levels ? levels[value as keyof typeof levels] : undefined;
}

function readTomlString(config: string, key: string): string | undefined {
  return new RegExp(`^\\s*${key}\\s*=\\s*["']([^"']+)["']\\s*$`, "m").exec(config)?.[1];
}

function orderedModels(selected: ZetroChatRuntimeSelection["model"]): ZetroChatRuntimeSelection["model"][] {
  return [selected, ...["gpt-5.6-sol", "gpt-5.6-terra", "gpt-6-astra"].filter((model) => model !== selected)];
}

function runtimeLabel(runtime?: ZetroChatRuntimeSelection): string {
  const model = runtime?.model === "Default" || !runtime ? "default model" : runtime.model;
  const reasoning = runtime?.reasoning === "Default" || !runtime ? "default reasoning" : `${runtime.reasoning.toLowerCase()} reasoning`;
  return `Starting local Codex with ${model} and ${reasoning} in read-only mode.`;
}

function probeLocalCodex(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(codexCommand(), ["login", "status"], { shell: false, windowsHide: true });
    const timeout = setTimeout(() => child.kill(), 10_000);
    child.stdout.resume();
    child.stderr.resume();
    child.once("error", () => {
      clearTimeout(timeout);
      resolve(false);
    });
    child.once("close", (code) => {
      clearTimeout(timeout);
      resolve(code === 0);
    });
  });
}
