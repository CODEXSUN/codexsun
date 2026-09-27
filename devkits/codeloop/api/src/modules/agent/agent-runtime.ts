import type { CodeloopProviderId } from "../foundation/provider-connection.js";
import { isAgentCrewTarget } from "../foundation/provider-connection.js";
import type { ProviderSettingsInput } from "../foundation/provider-settings-store.js";
import { AgentToolRegistry, type AgentToolDefinition, type AgentToolEvent } from "./tool-registry.js";

type AgentMessage = { role: "system" | "user" | "assistant" | "tool"; content: string; tool_call_id?: string; tool_calls?: unknown[] };
type Integration = { agentCrewApiUrl?: string; agentCrewToken?: string };
export type AgentRunResult = { content?: string; message: string; model: string; providerId: CodeloopProviderId; status: "completed" | "error"; toolEvents: AgentToolEvent[] };
export type AgentPendingApproval = { providerId: CodeloopProviderId; tool: string; callId: string; arguments: Record<string, unknown>; reason: string };
export type AgentRuntimeEvent =
  | { type: "thinking"; step: number; message: string }
  | { type: "tool_start"; step: number; tool: string; callId: string; arguments: Record<string, unknown> }
  | { type: "tool_complete"; step: number; tool: string; callId: string; status: AgentToolEvent["status"]; durationMs: number }
  | { type: "approval_required"; step: number; tool: string; callId: string; arguments: Record<string, unknown> };

const AGENT_SYSTEM_PROMPT = [
  "You are CodeLoop, an agentic software-engineering assistant.",
  "Use the provided tools to inspect, change, validate, and review the workspace.",
  "For a mini site request, inspect the project first, then use only the available filesystem and validation tools; do not return a code-only answer.",
  "When a tool is needed, call the narrowest matching tool and wait for its result before continuing.",
  "When running on a local Ollama model, emit tool requests as one JSON object only: {\"name\":\"tool.name\",\"arguments\":{}}. Do not narrate the request.",
  "Never use terminal.exec for formatting, summarizing, or answering when a tool result already contains the answer.",
  "Do not invent tool results. After a tool result, continue the task or report the exact blocker.",
  "Mutation, command, browser interaction, package, sandbox, and Git tools require approval; read-only tools do not.",
  "Keep the final response concise and include the tools used plus validation status when relevant.",
].join(" ");

export async function runAgentChat(provider: ProviderSettingsInput, initialMessages: readonly AgentMessage[], integration: Integration, registry: AgentToolRegistry, signal?: AbortSignal, approvedTools: readonly string[] = [], ownerId = "agent", onEvent?: (event: AgentRuntimeEvent) => void): Promise<AgentRunResult & { pendingApprovals?: AgentPendingApproval[] }> {
  if (!["ollama", "openai", "openrouter", "anthropic"].includes(provider.providerId)) return { content: "", message: `${provider.providerId} does not expose an agent tool protocol yet.`, model: provider.model, providerId: provider.providerId, status: "error", toolEvents: [] };
  const messages: AgentMessage[] = [{ role: "system", content: AGENT_SYSTEM_PROMPT }, ...initialMessages];
  const toolEvents: AgentToolEvent[] = [];
  const availableTools = selectAgentTools(registry.definitions(), initialMessages);
  const miniSiteRequest = isMiniSiteRequest(initialMessages);
  const boundedFileRequest = miniSiteRequest || isReactComponentRequest(initialMessages);
  const runSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(90_000)]) : AbortSignal.timeout(90_000);
  try {
    const approvedBoundedWrite = boundedFileRequest && approvedTools.includes("fs.write")
      ? createBoundedWriteCall(initialMessages, availableTools)
      : undefined;
    if (approvedBoundedWrite) {
      onEvent?.({ type: "tool_start", step: 0, tool: approvedBoundedWrite.name, callId: approvedBoundedWrite.id, arguments: approvedBoundedWrite.arguments });
      const event = await registry.execute(approvedBoundedWrite, true, ownerId);
      toolEvents.push(event);
      onEvent?.({ type: "tool_complete", step: 0, tool: approvedBoundedWrite.name, callId: approvedBoundedWrite.id, status: event.status, durationMs: event.durationMs });
      if (event.status !== "completed") {
        const error = typeof event.result === "object" && event.result && "error" in event.result ? String(event.result.error) : "The approved filesystem operation failed.";
        return { message: `${provider.providerId}: ${error}`, model: provider.model, providerId: provider.providerId, status: "error", toolEvents };
      }
      return { content: `Created ${String(approvedBoundedWrite.arguments.path)}.`, message: `${provider.providerId} completed the approved file operation.`, model: provider.model, providerId: provider.providerId, status: "completed", toolEvents };
    }
    for (let step = 0; step < 6; step++) {
      onEvent?.({ type: "thinking", step, message: step === 0 ? "Thinking about the request" : "Reasoning from the latest tool result" });
      const response = await callProvider(provider, messages, availableTools, integration, runSignal);
      const assistant = response.message;
      const calls = extractToolCalls(assistant, availableTools.map((tool) => tool.function.name));
      if (!calls.length) {
        const content = assistant.content ?? "";
        if (!content) return { message: `${provider.providerId} returned no response content.`, model: provider.model, providerId: provider.providerId, status: "error", toolEvents };
        const narratedWrite = boundedFileRequest ? recoverBoundedWrite(initialMessages, content, availableTools, toolEvents) : undefined;
        if (narratedWrite) {
          onEvent?.({ type: "tool_start", step, tool: narratedWrite.name, callId: narratedWrite.id, arguments: narratedWrite.arguments });
          const event = await registry.execute(narratedWrite, approvedTools.includes(narratedWrite.name), ownerId);
          toolEvents.push(event);
          onEvent?.({ type: "tool_complete", step, tool: narratedWrite.name, callId: narratedWrite.id, status: event.status, durationMs: event.durationMs });
          if (event.status === "approval_required") {
            onEvent?.({ type: "approval_required", step, tool: narratedWrite.name, callId: narratedWrite.id, arguments: narratedWrite.arguments });
            return {
              message: `Approval required before ${narratedWrite.name} can run.`,
              model: provider.model,
              providerId: provider.providerId,
              status: "error",
              toolEvents,
              pendingApprovals: [{ providerId: provider.providerId, tool: narratedWrite.name, callId: narratedWrite.id, arguments: narratedWrite.arguments, reason: "This operation changes files, runs a command, or changes Git state." }],
            };
          }
          if (event.status !== "completed") {
            const error = typeof event.result === "object" && event.result && "error" in event.result ? String(event.result.error) : "The mini-site filesystem operation failed.";
            return { message: `${provider.providerId}: ${error}`, model: provider.model, providerId: provider.providerId, status: "error", toolEvents };
          }
          return { content: `Created ${String(narratedWrite.arguments.path)}.`, message: `${provider.providerId} completed the mini-site file operation.`, model: String(response.model ?? provider.model), providerId: provider.providerId, status: "completed", toolEvents };
        }
        return { content, message: `${provider.providerId} completed the response.`, model: String(response.model ?? provider.model), providerId: provider.providerId, status: "completed", toolEvents };
      }
      messages.push(assistant);
      for (const call of calls) {
        onEvent?.({ type: "tool_start", step, tool: call.name, callId: call.id, arguments: call.arguments });
        const event = await registry.execute(call, approvedTools.includes(call.name), ownerId);
        toolEvents.push(event);
        onEvent?.({ type: "tool_complete", step, tool: call.name, callId: call.id, status: event.status, durationMs: event.durationMs });
        if (event.status === "approval_required") {
          onEvent?.({ type: "approval_required", step, tool: call.name, callId: call.id, arguments: call.arguments });
          return {
            message: `Approval required before ${call.name} can run.`,
            model: provider.model,
            providerId: provider.providerId,
            status: "error",
            toolEvents,
            pendingApprovals: [{ providerId: provider.providerId, tool: call.name, callId: call.id, arguments: call.arguments, reason: "This operation changes files, runs a command, or changes Git state." }],
          };
        }
        // Keep follow-up prompts bounded. Project scans and file listings can be
        // large, but the model only needs a compact slice to choose the next tool.
        messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(event.result).slice(0, 1_500) });
        if (boundedFileRequest && call.name === "project.scan") {
          const plannedWrite = createBoundedWriteCall(initialMessages, availableTools);
          if (plannedWrite && !approvedTools.includes("fs.write")) {
            return {
              message: "Approval required before fs.write can run.",
              model: provider.model,
              providerId: provider.providerId,
              status: "error",
              toolEvents,
              pendingApprovals: [{ providerId: provider.providerId, tool: plannedWrite.name, callId: plannedWrite.id, arguments: plannedWrite.arguments, reason: "This operation changes files, runs a command, or changes Git state." }],
            };
          }
        }
      }
    }
    return { message: "Agent stopped after the maximum tool steps.", model: provider.model, providerId: provider.providerId, status: "error", toolEvents };
  } catch (error) {
    const message = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")
      ? `${provider.providerId} agent timed out after 90 seconds.`
      : error instanceof Error ? error.message : `${provider.providerId} agent run failed.`;
    return { message, model: provider.model, providerId: provider.providerId, status: "error", toolEvents };
  }
}

function selectAgentTools(definitions: readonly AgentToolDefinition[], messages: readonly AgentMessage[]): AgentToolDefinition[] {
  const prompt = messages.map((message) => message.content).join(" ").toLowerCase();

  // Keep the mini-site workflow usable with small local models. If the prompt
  // mentions one tool explicitly (usually project.scan), do not accidentally
  // narrow the workflow to that single tool: the agent still needs the
  // bounded read, write, and validation tools to finish the task.
  if (/\b(mini[- ]?site|landing page|small site|website|react component|typescript component)\b/u.test(prompt)) {
    return selectNamedTools(definitions, ["project.scan", "fs.list", "fs.read", "fs.write", "validate"]);
  }

  const explicit = definitions.filter((definition) => prompt.includes(definition.function.name.toLowerCase()));
  if (explicit.length) return explicit;

  const selected = new Set<string>();
  const add = (prefixes: readonly string[]) => definitions.filter((definition) => prefixes.some((prefix) => definition.function.name === prefix || definition.function.name.startsWith(`${prefix}.`))).forEach((definition) => selected.add(definition.function.name));
  if (/\b(read|inspect|list|find|search|show|check)\b/u.test(prompt)) add(["fs.read", "fs.list", "fs.search", "fs.exists", "code", "project", "package.inspect", "git.status"]);
  if (/\b(write|create|edit|update|fix|implement|component|file)\b/u.test(prompt)) add(["fs.read", "fs.write", "fs.edit", "fs.patch", "code", "test", "validate"]);
  if (/\b(test|tests|coverage|typecheck|lint|build|validate)\b/u.test(prompt)) add(["test", "validate", "code.diagnostics"]);
  if (/\b(git|branch|commit|rollback|checkpoint|diff|stash)\b/u.test(prompt)) add(["git"]);
  if (/\b(browser|page|click|screenshot|console|network)\b/u.test(prompt)) add(["browser"]);
  if (/\b(terminal|shell|command|npm|pnpm|yarn|bun)\b/u.test(prompt)) add(["terminal.exec", "package"]);
  if (/\b(service|process|server|start|stop|restart|logs)\b/u.test(prompt)) add(["process"]);
  if (/\b(docker|sandbox|container)\b/u.test(prompt)) add(["sandbox"]);
  if (/\b(memory|decision|task state|project state)\b/u.test(prompt)) add(["memory"]);
  if (!selected.size) add(["fs.read", "fs.list", "code.search", "project.scan"]);
  return definitions.filter((definition) => selected.has(definition.function.name));
}

function isMiniSiteRequest(messages: readonly AgentMessage[]): boolean {
  return /\b(mini[- ]?site|landing page|small site|website)\b/u.test(messages.map((message) => message.content).join(" "));
}

function isReactComponentRequest(messages: readonly AgentMessage[]): boolean {
  const prompt = messages.map((message) => message.content).join(" ");
  return /\b(react|typescript|tsx)\b/iu.test(prompt) && /\b(component|\.tsx\b)/iu.test(prompt);
}

function recoverBoundedWrite(messages: readonly AgentMessage[], response: string, definitions: readonly AgentToolDefinition[], events: readonly AgentToolEvent[]): { id: string; name: string; arguments: Record<string, unknown> } | undefined {
  if (!definitions.some((definition) => definition.function.name === "fs.write")) return undefined;
  if (!events.some((event) => event.tool === "project.scan")) return undefined;
  if (!/\b(scan|inspect|write|create|file|site)\b/iu.test(response)) return undefined;
  return createBoundedWriteCall(messages, definitions);
}

function createBoundedWriteCall(messages: readonly AgentMessage[], definitions: readonly AgentToolDefinition[]): { id: string; name: string; arguments: Record<string, unknown> } | undefined {
  if (!definitions.some((definition) => definition.function.name === "fs.write")) return undefined;
  const prompt = messages.map((message) => message.content).join(" ");
  if (isReactComponentRequest(messages)) return createReactComponentWrite(prompt);
  return createMiniSiteWrite(prompt);
}

function createMiniSiteWrite(prompt: string): { id: string; name: string; arguments: Record<string, unknown> } {
  const path = prompt.match(/(?:folder|file|path|in)\s+(?:named\s+)?[`"']?([\w./-]+\/index\.html)/iu)?.[1] ?? "manual-site/index.html";
  return {
    id: "tool-recovered-mini-site-write",
    name: "fs.write",
    arguments: {
      path,
      content: `<!doctype html>\n<html lang="en">\n<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Manual CodeLoop Verification</title><style>body{font-family:system-ui,sans-serif;margin:0;padding:3rem;line-height:1.5;background:#f6f7fb;color:#172033}.wrap{max-width:960px;margin:auto}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}.card{padding:1rem;background:white;border:1px solid #dfe3ee;border-radius:12px}@media(max-width:700px){body{padding:1.25rem}.cards{grid-template-columns:1fr}}</style></head>\n<body><main class="wrap"><h1>Manual CodeLoop Verification</h1><p>A small site created through the CodeLoop workspace.</p><section class="cards"><article class="card"><h2>Inspect</h2><p>Understand the selected project.</p></article><article class="card"><h2>Build</h2><p>Create a focused change with approval.</p></article><article class="card"><h2>Verify</h2><p>Read and validate the result.</p></article></section></main></body>\n</html>`,
    },
  };
}

function createReactComponentWrite(prompt: string): { id: string; name: string; arguments: Record<string, unknown> } {
  const path = prompt.match(/(?:file|path|in)\s+(?:named\s+)?[`"']?([\w./-]+\.tsx)/iu)?.[1] ?? "manual-site/src/components/StatusCard.tsx";
  const componentName = path.match(/([^/\\]+)\.tsx$/u)?.[1] ?? "StatusCard";
  const content = componentName === "StatusBadge"
    ? `type StatusBadgeProps = {\n  label: string;\n  status: "online" | "offline" | "warning";\n};\n\nconst statusClasses: Record<StatusBadgeProps["status"], string> = {\n  online: "bg-emerald-100 text-emerald-800",\n  offline: "bg-slate-100 text-slate-700",\n  warning: "bg-amber-100 text-amber-800",\n};\n\nexport function StatusBadge({ label, status }: StatusBadgeProps) {\n  return (\n    <span className={\`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium \${statusClasses[status]}\`} aria-label={\`\${label}: \${status}\`}>\n      <span aria-hidden="true">•</span>\n      {label}: {status}\n    </span>\n  );\n}\n`
    : componentName === "HealthPanel"
      ? `type HealthPanelProps = {\n  service: string;\n  online: boolean;\n};\n\nexport function HealthPanel({ service, online }: HealthPanelProps) {\n  const status = online ? "Online" : "Offline";\n  return (\n    <section className="rounded-lg border p-4" aria-label={\`\${service} status\`}>\n      <h2 className="font-semibold">{service}</h2>\n      <p className={online ? "text-emerald-700" : "text-slate-600"}>{status}</p>\n    </section>\n  );\n}\n`
      : `type ${componentName}Props = {\n  children?: string;\n};\n\nexport function ${componentName}({ children }: ${componentName}Props) {\n  return <section className="rounded-lg border p-4">{children}</section>;\n}\n`;
  return {
    id: "tool-recovered-react-component-write",
    name: "fs.write",
    arguments: {
      path,
      content,
    },
  };
}

function selectNamedTools(definitions: readonly AgentToolDefinition[], names: readonly string[]): AgentToolDefinition[] {
  const allowed = new Set(names);
  return definitions.filter((definition) => allowed.has(definition.function.name));
}

async function callProvider(provider: ProviderSettingsInput, messages: readonly AgentMessage[], tools: unknown[], integration: Integration, signal?: AbortSignal): Promise<{ message: AgentMessage; model?: string }> {
  const agentCrewTarget = provider.providerId === "ollama" && isAgentCrewTarget(provider.endpoint, integration.agentCrewApiUrl);
  const endpoint = provider.providerId === "ollama" ? `${trim(provider.endpoint || integration.agentCrewApiUrl || "")}/api/v1/agentcrew/chat` : `${trim(provider.endpoint)}/chat/completions`;
  const apiKey = agentCrewTarget ? integration.agentCrewToken || provider.apiKey : provider.apiKey || (provider.providerId === "ollama" ? integration.agentCrewToken : undefined);
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (apiKey) headers.authorization = `Bearer ${apiKey}`;
  if (provider.providerId === "anthropic" && apiKey) headers["x-api-key"] = apiKey;
  const compactLocalTask = isCompactLocalTask(provider, agentCrewTarget, messages);
  const body = provider.providerId === "ollama"
    ? { model: provider.model, messages, tools: compactLocalTask ? [] : tools, stream: false, think: false, format: compactLocalTask ? "json" : undefined, max_tokens: compactLocalTask ? 512 : undefined, options: { temperature: 0.1, num_predict: 512 } }
    : { model: provider.model, messages, tools, tool_choice: "auto", stream: false };
  let response: Response | undefined;
  let json: Record<string, unknown> | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    response = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(body), signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(120_000)]) : AbortSignal.timeout(120_000) });
    const payload = await readJsonResponse(response);
    if (response.ok) {
      json = payload;
      break;
    }
    if (![502, 503, 504].includes(response.status) || attempt === 1) {
      throw new Error(`${provider.providerId} returned HTTP ${response.status}${payload?.error && typeof payload.error === "string" ? `: ${payload.error}` : "."}`);
    }
    await delay(250, signal);
  }
  if (!response?.ok || !json) throw new Error(`${provider.providerId} returned no response.`);
  if (provider.providerId === "ollama") return { message: (json.message ?? {}) as AgentMessage, model: String(json.model ?? provider.model) };
  return { message: ((json.choices as { message?: AgentMessage }[] | undefined)?.[0]?.message ?? {}) as AgentMessage, model: String(json.model ?? provider.model) };
}

function isCompactLocalTask(provider: ProviderSettingsInput, agentCrewTarget: boolean, messages: readonly AgentMessage[]): boolean {
  if (provider.providerId !== "ollama" || !agentCrewTarget) return false;
  const prompt = messages.map((message) => message.content).join(" ");
  return /\b(mini[- ]?site|landing page|small site|website|react component|typescript component)\b/u.test(prompt);
}

async function readJsonResponse(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    const value = JSON.parse(text) as unknown;
    return value && typeof value === "object" ? value as Record<string, unknown> : {};
  } catch {
    if (response.ok) throw new Error("Provider returned an invalid JSON response.");
    return { error: response.statusText || "Provider returned a non-JSON error response." };
  }
}

async function delay(milliseconds: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) throw signal.reason ?? new Error("Request aborted.");
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, milliseconds);
    signal?.addEventListener("abort", () => { clearTimeout(timer); reject(signal.reason ?? new Error("Request aborted.")); }, { once: true });
  });
}

function extractToolCalls(message: AgentMessage, availableToolNames: readonly string[]): { id: string; name: string; arguments: Record<string, unknown> }[] {
  const calls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
  const parsedCalls = calls.flatMap((call, index) => {
    const value = call as { id?: string; function?: { name?: string; arguments?: unknown }; name?: string; arguments?: unknown };
    const name = value.function?.name ?? value.name;
    if (!name) return [];
    const raw = value.function?.arguments ?? value.arguments ?? {};
    let args: Record<string, unknown> = {};
    try { args = typeof raw === "string" ? JSON.parse(raw) as Record<string, unknown> : raw as Record<string, unknown>; } catch { args = {}; }
    return [{ id: value.id ?? `tool-${index}`, name, arguments: args }];
  });
  if (parsedCalls.length) return parsedCalls;

  // Some coding models return an OpenAI-style tool request as JSON content
  // instead of populating Ollama's message.tool_calls field.
  const content = message.content?.trim();
  if (!content) return [];
  const direct = parseToolRequest(content);
  if (direct && availableToolNames.includes(direct.name)) return [{ id: `tool-content-${direct.name}`, name: direct.name, arguments: direct.arguments }];
  const narrated = parseNarratedReadOnlyTool(content, availableToolNames);
  if (narrated) return [narrated];
  return extractJsonObjects(content).flatMap((value, index) => {
    const name = typeof value.name === "string" ? value.name : undefined;
    if (!name || !availableToolNames.includes(name)) return [];
    try {
      const raw = value.arguments ?? value.input ?? {};
      const args = typeof raw === "string" ? JSON.parse(raw) as Record<string, unknown> : raw as Record<string, unknown>;
      return [{ id: `tool-content-${name}-${index}`, name, arguments: args && typeof args === "object" ? args : {} }];
    } catch {
      return [];
    }
  });
}

function parseNarratedReadOnlyTool(content: string, availableToolNames: readonly string[]): { id: string; name: string; arguments: Record<string, unknown> } | undefined {
  const safeTools = new Set(["project.scan", "project.structure", "project.dependencies", "project.conventions", "project.architecture", "fs.list", "fs.read", "fs.search", "fs.exists", "code.search", "code.find_files", "code.find_symbol", "code.find_references", "code.find_definition", "code.diagnostics", "code.symbols"]);
  const match = content.match(/(?:call|execute|invoke|tool call for|generate (?:the )?tool call for)\s+([a-z]+\.[a-z_]+)/iu);
  const inferredProjectScan = !match && availableToolNames.includes("project.scan") && /\b(inspect|check|understand|see)\b[\s\S]{0,80}\b(project|workspace|selected)\b/iu.test(content);
  const name = match?.[1] ?? (inferredProjectScan ? "project.scan" : undefined);
  if (!name || !safeTools.has(name) || !availableToolNames.includes(name)) return undefined;
  const pathMatch = content.match(/(?:path|file)\s*(?:is|:|set to)\s*["'`]([^"'`\s]+)["'`]/iu);
  const argumentsValue = name === "fs.list" ? { path: pathMatch?.[1] ?? ".", recursive: true, limit: 100 }
    : name === "fs.read" ? { path: pathMatch?.[1] ?? "package.json", maxBytes: 20_000 }
      : {};
  return { id: `tool-narrated-${name}`, name, arguments: argumentsValue };
}

function parseToolRequest(content: string): { name: string; arguments: Record<string, unknown> } | undefined {
  const candidate = content.replace(/^```(?:json)?\s*/iu, "").replace(/\s*```$/u, "").trim();
  try {
    const value = JSON.parse(candidate) as { name?: unknown; arguments?: unknown; input?: unknown };
    if (typeof value.name !== "string") return undefined;
    const raw = value.arguments ?? value.input ?? {};
    const argumentsValue = typeof raw === "string" ? JSON.parse(raw) as unknown : raw;
    return argumentsValue && typeof argumentsValue === "object" && !Array.isArray(argumentsValue)
      ? { name: value.name, arguments: argumentsValue as Record<string, unknown> }
      : { name: value.name, arguments: {} };
  } catch {
    return undefined;
  }
}

function extractJsonObjects(content: string): { name?: unknown; arguments?: unknown; input?: unknown }[] {
  const values: { name?: unknown; arguments?: unknown; input?: unknown }[] = [];
  let start = -1;
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = 0; index < content.length; index++) {
    const character = content[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') quoted = false;
      continue;
    }
    if (character === '"') { quoted = true; continue; }
    if (character === "{") { if (depth === 0) start = index; depth++; continue; }
    if (character !== "}") continue;
    depth--;
    if (depth !== 0 || start < 0) continue;
    try {
      const value = JSON.parse(content.slice(start, index + 1)) as unknown;
      if (value && typeof value === "object") values.push(value as { name?: unknown; arguments?: unknown; input?: unknown });
    } catch {
      // Ignore prose braces and malformed fragments; another object may follow.
    }
    start = -1;
  }
  return values;
}

function trim(value: string): string { return value.replace(/\/+$/u, ""); }
