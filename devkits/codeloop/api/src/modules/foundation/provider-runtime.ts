import { type CodeloopProviderId, isAgentCrewTarget } from "./provider-connection.js";
import type { ProviderSettingsInput } from "./provider-settings-store.js";

export type ChatMessage = { readonly content: string; readonly role: "assistant" | "system" | "user" };
export type ProviderChatResult = { readonly content?: string; readonly message: string; readonly model: string; readonly providerId: CodeloopProviderId; readonly status: "completed" | "error" };

export type ProviderStreamEvent = { type: "token" | "thinking" | "done"; content?: string };

export async function streamProviderChat(provider: ProviderSettingsInput, messages: readonly ChatMessage[], integration: { agentCrewApiUrl?: string; agentCrewToken?: string }, onEvent: (event: ProviderStreamEvent) => void, signal?: AbortSignal): Promise<ProviderChatResult> {
  try {
    const isOllama = provider.providerId === "ollama";
    const isCrew = isOllama && isAgentCrewTarget(provider.endpoint, integration.agentCrewApiUrl);
    const endpoint = isOllama
      ? (isCrew ? trimEndpoint(provider.endpoint || integration.agentCrewApiUrl || "") + "/api/v1/agentcrew/chat/stream" : trimEndpoint(provider.endpoint) + "/api/chat")
      : trimEndpoint(provider.endpoint) + "/chat/completions";
    const headers: Record<string, string> = { "content-type": "application/json", accept: "text/event-stream" };
    const body = isCrew
      ? { messages, model: provider.model, think: false, stream: true }
      : { messages, model: provider.model, stream: true };
    const tokensToTry = isCrew
      ? [provider.apiKey?.trim(), integration.agentCrewToken?.trim()].filter((token, index, values): token is string => Boolean(token) && values.indexOf(token) === index)
      : [provider.apiKey?.trim()].filter((token): token is string => Boolean(token));
    if (!tokensToTry.length) tokensToTry.push("");
    let response: Response | undefined;
    for (const token of tokensToTry) {
      const requestHeaders = { ...headers };
      if (token) requestHeaders.authorization = `Bearer ${token}`;
      if (provider.providerId === "anthropic" && token) requestHeaders["x-api-key"] = token;
      const candidate = await fetchWithRetry(endpoint, { body: JSON.stringify(body), headers: requestHeaders, method: "POST" }, signal, 90_000);
      response = candidate;
      if (candidate.ok) break;
    }
    if (!response || !response.ok || !response.body) return { message: await formatHttpError(provider.providerId, response), model: provider.model, providerId: provider.providerId, status: "error" };
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let content = "";
    const consume = (value: unknown) => {
      const chunk = value as { message?: { content?: string }; choices?: { delta?: { content?: string; reasoning_content?: string } }[]; type?: string; content?: string };
      const token = chunk.message?.content ?? chunk.choices?.[0]?.delta?.content ?? (chunk.type === "token" ? chunk.content : undefined);
      const thinking = chunk.choices?.[0]?.delta?.reasoning_content ?? (chunk.type === "thinking" ? chunk.content : undefined);
      if (thinking) onEvent({ type: "thinking", content: thinking });
      if (token) { content += token; onEvent({ type: "token", content: token }); }
    };
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      buffer += decoder.decode(next.value, { stream: true });
      const lines = buffer.split(/\r?\n/u);
      buffer = lines.pop() ?? "";
      for (const line of lines) { const raw = line.startsWith("data:") ? line.slice(5).trim() : line.trim(); if (!raw || raw === "[DONE]") continue; try { consume(JSON.parse(raw)); } catch { /* wait for the next complete provider frame */ } }
    }
    if (buffer.trim()) { try { consume(JSON.parse(buffer.trim())); } catch { /* provider ended on an incomplete frame */ } }
    onEvent({ type: "done" });
    return content ? { content, message: `${provider.providerId} completed the response.`, model: provider.model, providerId: provider.providerId, status: "completed" } : { message: `${provider.providerId} returned no response content.`, model: provider.model, providerId: provider.providerId, status: "error" };
  } catch (error) {
    return { message: error instanceof Error && error.name === "TimeoutError" ? `${provider.providerId} timed out after 90 seconds.` : `${provider.providerId} could not complete the response.`, model: provider.model, providerId: provider.providerId, status: "error" };
  }
}

export async function runProviderChat(provider: ProviderSettingsInput, messages: readonly ChatMessage[], integration: { agentCrewApiUrl?: string; agentCrewToken?: string }, signal?: AbortSignal): Promise<ProviderChatResult> {
  try {
    const isOllama = provider.providerId === "ollama";
    const isCrew = isOllama && isAgentCrewTarget(provider.endpoint, integration.agentCrewApiUrl);

    // Build candidate tokens to try for AgentCrew
    const tokensToTry: (string | undefined)[] = isCrew
      ? [provider.apiKey?.trim(), integration.agentCrewToken?.trim()].filter(
          (t, idx, arr): t is string => Boolean(t) && arr.indexOf(t) === idx
        )
      : [provider.apiKey?.trim()].filter(Boolean);

    if (isCrew && tokensToTry.length === 0) {
      tokensToTry.push(undefined);
    }

    let lastStatus = 0;
    let lastError = "";

    // 1. If it's an AgentCrew target, try the available tokens
    if (isCrew) {
      const crewEndpoint = trimEndpoint(provider.endpoint || integration.agentCrewApiUrl || "") + "/api/v1/agentcrew/chat";
      for (const token of tokensToTry) {
        try {
          const headers: Record<string, string> = { "content-type": "application/json" };
          if (token) headers.authorization = `Bearer ${token}`;
          const response = await fetchWithRetry(crewEndpoint, {
            body: JSON.stringify({ messages, model: provider.model, think: false }),
            headers,
            method: "POST",
          }, signal, 90_000);
          if (response.ok) {
            const body = await response.json() as Record<string, unknown>;
            const content = (body.message as { content?: string } | undefined)?.content ?? "";
            if (!content) return { message: `${provider.providerId} returned no response content.`, model: provider.model, providerId: provider.providerId, status: "error" };
            return { content, message: `${provider.providerId} completed the response.`, model: String(body.model ?? provider.model), providerId: provider.providerId, status: "completed" };
          }
          lastStatus = response.status;
          lastError = await formatHttpError("AgentCrew", response);
        } catch (err) {
          lastError = err instanceof Error ? err.message : "AgentCrew unreachable";
        }
      }

      // If AgentCrew failed (e.g. 401 or 404), check if native Ollama is running on direct /api/chat
      const directEndpoints = [
        trimEndpoint(provider.endpoint) + "/api/chat",
        "http://127.0.0.1:11434/api/chat",
      ];
      for (const directUrl of directEndpoints) {
        try {
          const directRes = await fetch(directUrl, {
            body: JSON.stringify({ messages, model: provider.model, stream: false }),
            headers: { "content-type": "application/json" },
            method: "POST",
            signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10_000)]) : AbortSignal.timeout(10_000),
          });
          if (directRes.ok) {
            const body = await directRes.json() as Record<string, unknown>;
            const content = (body.message as { content?: string } | undefined)?.content ?? "";
            if (content) {
              return { content, message: `${provider.providerId} completed the response via native Ollama.`, model: String(body.model ?? provider.model), providerId: provider.providerId, status: "completed" };
            }
          }
        } catch {
          // Continue to next fallback
        }
      }

      const message = lastStatus === 401
        ? `${provider.providerId} returned HTTP 401. AgentCrew token is invalid or rejected. Check AGENTCREW_TOKEN in .app.env or Ollama settings.`
        : `${provider.providerId} returned HTTP ${lastStatus || 500}. ${lastError}`;
      return { message, model: provider.model, providerId: provider.providerId, status: "error" };
    }

    // 2. Direct Ollama (or other provider)
    const endpoint = isOllama
      ? trimEndpoint(provider.endpoint) + "/api/chat"
      : trimEndpoint(provider.endpoint) + "/chat/completions";
    const headers: Record<string, string> = { "content-type": "application/json" };
    const apiKey = provider.apiKey?.trim();
    if (apiKey) headers.authorization = `Bearer ${apiKey}`;
    if (provider.providerId === "anthropic" && apiKey) headers["x-api-key"] = apiKey;
    const response = await fetchWithRetry(endpoint, {
      body: JSON.stringify(isOllama ? { messages, model: provider.model, stream: false } : { messages, model: provider.model, stream: false }),
      headers,
      method: "POST",
    }, signal, 90_000);
    const body = await response.json() as Record<string, unknown>;
    if (!response.ok) return { message: await formatHttpError(provider.providerId, response, body), model: provider.model, providerId: provider.providerId, status: "error" };
    const content = isOllama ? ((body.message as { content?: string } | undefined)?.content ?? "") : (((body.choices as { message?: { content?: string } }[] | undefined)?.[0]?.message?.content) ?? "");
    if (!content) return { message: `${provider.providerId} returned no response content.`, model: provider.model, providerId: provider.providerId, status: "error" };
    return { content, message: `${provider.providerId} completed the response.`, model: String(body.model ?? provider.model), providerId: provider.providerId, status: "completed" };
  } catch (error) {
    return { message: error instanceof Error && error.name === "TimeoutError" ? `${provider.providerId} timed out after 90 seconds.` : `${provider.providerId} could not complete the response.`, model: provider.model, providerId: provider.providerId, status: "error" };
  }
}

function trimEndpoint(endpoint: string): string { return endpoint.replace(/\/+$/, ""); }

async function fetchWithRetry(url: string, init: RequestInit, signal: AbortSignal | undefined, timeoutMs: number): Promise<Response> {
  let response: Response | undefined;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch(url, { ...init, signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs) });
    if (!isTransientStatus(response.status) || attempt === 2) return response;
    await delay(150 * (attempt + 1), signal);
  }
  return response!;
}

async function formatHttpError(providerId: string, response: Response | undefined, parsedBody?: Record<string, unknown>): Promise<string> {
  const status = response?.status ?? 500;
  const detail = parsedBody ? extractErrorDetail(parsedBody) : response ? extractErrorDetail(await readJsonOrText(response)) : "";
  return `${providerId} returned HTTP ${status}.${detail ? ` ${detail}` : ""}`;
}

async function readJsonOrText(response: Response): Promise<Record<string, unknown> | string> {
  try {
    const text = await response.text();
    try { return JSON.parse(text) as Record<string, unknown>; } catch { return text; }
  } catch { return ""; }
}

function extractErrorDetail(body: Record<string, unknown> | string): string {
  if (typeof body === "string") return body.replace(/\s+/gu, " ").trim().slice(0, 240);
  for (const key of ["error", "message", "detail"]) {
    const value = body[key];
    if (typeof value === "string" && value.trim()) return value.replace(/\s+/gu, " ").trim().slice(0, 240);
  }
  return "";
}

function isTransientStatus(status: number): boolean { return [408, 425, 429, 500, 502, 503, 504].includes(status); }

async function delay(milliseconds: number, signal?: AbortSignal): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, milliseconds);
    signal?.addEventListener("abort", () => { clearTimeout(timer); reject(signal.reason); }, { once: true });
  });
}
