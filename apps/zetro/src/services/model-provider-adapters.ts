import type {
  ZetroModelProvider,
  ZetroModelProviderAdapter,
  ZetroModelHealthResult,
  ZetroModelMessage,
  ZetroModelResponse,
} from "./model-provider-types.js";

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export const noneProviderAdapter: ZetroModelProviderAdapter = {
  id: "none",
  name: "None",
  description: "No model provider configured.",
  async checkHealth(
    _config: ZetroModelProvider,
  ): Promise<ZetroModelHealthResult> {
    return {
      providerId: "none",
      healthy: true,
      timestamp: new Date().toISOString(),
    };
  },
  async complete(
    _config: ZetroModelProvider,
    _messages: ZetroModelMessage[],
    _options?: { model?: string; temperature?: number; maxTokens?: number },
  ): Promise<ZetroModelResponse> {
    throw new Error(
      "No model provider configured. Enable a provider in settings.",
    );
  },
};

export const ollamaProviderAdapter: ZetroModelProviderAdapter = {
  id: "ollama-local",
  name: "Ollama (Local)",
  description: "Local LLM via Ollama.",
  async checkHealth(
    config: ZetroModelProvider,
  ): Promise<ZetroModelHealthResult> {
    const start = Date.now();
    const baseUrl = config.baseUrl ?? "http://localhost:11434";

    try {
      const response = await fetch(`${baseUrl}/api/tags`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      const latencyMs = Date.now() - start;

      if (!response.ok) {
        return {
          providerId: "ollama-local",
          healthy: false,
          latencyMs,
          error: `HTTP ${response.status}: ${response.statusText}`,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        providerId: "ollama-local",
        healthy: true,
        latencyMs,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const latencyMs = Date.now() - start;
      return {
        providerId: "ollama-local",
        healthy: false,
        latencyMs,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      };
    }
  },
  async complete(
    config: ZetroModelProvider,
    messages: ZetroModelMessage[],
    options?: { model?: string; temperature?: number; maxTokens?: number },
  ): Promise<ZetroModelResponse> {
    const baseUrl = config.baseUrl ?? "http://localhost:11434";
    const model = options?.model ?? config.model ?? "llama3";

    const ollamaMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        messages: ollamaMessages,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 4096,
        },
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: HTTP ${response.status}`);
    }

    const data = (await response.json()) as {
      message?: { content?: string; role?: string };
      done_reason?: string;
      total_duration?: number;
      prompt_eval_count?: number;
      eval_count?: number;
    };

    return {
      id: generateId(),
      model,
      content: data.message?.content ?? "",
      finishReason: data.done_reason ?? "stop",
      usage: {
        promptTokens: data.prompt_eval_count,
        completionTokens: data.eval_count,
        totalTokens: (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0),
      },
      raw: data,
    };
  },
};

export const openaiProviderAdapter: ZetroModelProviderAdapter = {
  id: "openai",
  name: "OpenAI",
  description: "OpenAI API provider.",
  async checkHealth(
    config: ZetroModelProvider,
  ): Promise<ZetroModelHealthResult> {
    const start = Date.now();
    const apiKey = config.apiKey;

    if (!apiKey) {
      return {
        providerId: "openai",
        healthy: false,
        error: "API key not configured",
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(5000),
      });

      const latencyMs = Date.now() - start;

      if (!response.ok) {
        return {
          providerId: "openai",
          healthy: false,
          latencyMs,
          error: `HTTP ${response.status}: ${response.statusText}`,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        providerId: "openai",
        healthy: true,
        latencyMs,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const latencyMs = Date.now() - start;
      return {
        providerId: "openai",
        healthy: false,
        latencyMs,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      };
    }
  },
  async complete(
    config: ZetroModelProvider,
    messages: ZetroModelMessage[],
    options?: { model?: string; temperature?: number; maxTokens?: number },
  ): Promise<ZetroModelResponse> {
    const apiKey = config.apiKey;
    if (!apiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const model = options?.model ?? config.model ?? "gpt-4o-mini";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI request failed: ${error}`);
    }

    const data = (await response.json()) as {
      id: string;
      model: string;
      choices: Array<{
        message: { content: string; role: string };
        finish_reason: string;
      }>;
      usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    };

    return {
      id: data.id,
      model: data.model,
      content: data.choices[0]?.message?.content ?? "",
      finishReason: data.choices[0]?.finish_reason ?? "stop",
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
      raw: data,
    };
  },
};

export const anthropicProviderAdapter: ZetroModelProviderAdapter = {
  id: "anthropic",
  name: "Anthropic",
  description: "Anthropic Claude API provider.",
  async checkHealth(
    config: ZetroModelProvider,
  ): Promise<ZetroModelHealthResult> {
    const start = Date.now();
    const apiKey = config.apiKey;

    if (!apiKey) {
      return {
        providerId: "anthropic",
        healthy: false,
        error: "API key not configured",
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: config.model ?? "claude-3-5-haiku",
          max_tokens: 1,
          messages: [{ role: "user", content: "ping" }],
        }),
        signal: AbortSignal.timeout(5000),
      });

      const latencyMs = Date.now() - start;

      if (!response.ok) {
        return {
          providerId: "anthropic",
          healthy: false,
          latencyMs,
          error: `HTTP ${response.status}: ${response.statusText}`,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        providerId: "anthropic",
        healthy: true,
        latencyMs,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const latencyMs = Date.now() - start;
      return {
        providerId: "anthropic",
        healthy: false,
        latencyMs,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      };
    }
  },
  async complete(
    config: ZetroModelProvider,
    messages: ZetroModelMessage[],
    options?: { model?: string; temperature?: number; maxTokens?: number },
  ): Promise<ZetroModelResponse> {
    const apiKey = config.apiKey;
    if (!apiKey) {
      throw new Error("Anthropic API key not configured");
    }

    const model = options?.model ?? config.model ?? "claude-3-5-haiku";

    const anthropicMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));

    const systemMessage = messages.find((m) => m.role === "system");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        messages: anthropicMessages,
        system: systemMessage?.content,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic request failed: ${error}`);
    }

    const data = (await response.json()) as {
      id: string;
      model: string;
      content: Array<{ type: string; text?: string }>;
      stop_reason: string;
      usage: {
        input_tokens: number;
        output_tokens: number;
      };
    };

    return {
      id: data.id,
      model: data.model,
      content: data.content.find((c) => c.type === "text")?.text ?? "",
      finishReason: data.stop_reason ?? "stop",
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      raw: data,
    };
  },
};

export const customOpenAICompatibleProviderAdapter: ZetroModelProviderAdapter =
  {
    id: "custom-openai-compatible",
    name: "Custom OpenAI-Compatible",
    description: "Custom OpenAI-compatible API provider.",
    async checkHealth(
      config: ZetroModelProvider,
    ): Promise<ZetroModelHealthResult> {
      const start = Date.now();
      const baseUrl = config.baseUrl;
      const apiKey = config.apiKey;

      if (!baseUrl) {
        return {
          providerId: "custom-openai-compatible",
          healthy: false,
          error: "Base URL not configured",
          timestamp: new Date().toISOString(),
        };
      }

      try {
        const headers: Record<string, string> = {
          "content-type": "application/json",
        };
        if (apiKey) {
          headers["Authorization"] = `Bearer ${apiKey}`;
        }

        const response = await fetch(`${baseUrl}/v1/models`, {
          method: "GET",
          headers,
          signal: AbortSignal.timeout(5000),
        });

        const latencyMs = Date.now() - start;

        if (!response.ok) {
          return {
            providerId: "custom-openai-compatible",
            healthy: false,
            latencyMs,
            error: `HTTP ${response.status}: ${response.statusText}`,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          providerId: "custom-openai-compatible",
          healthy: true,
          latencyMs,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        const latencyMs = Date.now() - start;
        return {
          providerId: "custom-openai-compatible",
          healthy: false,
          latencyMs,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        };
      }
    },
    async complete(
      config: ZetroModelProvider,
      messages: ZetroModelMessage[],
      options?: { model?: string; temperature?: number; maxTokens?: number },
    ): Promise<ZetroModelResponse> {
      const baseUrl = config.baseUrl;
      if (!baseUrl) {
        throw new Error("Custom provider base URL not configured");
      }

      const model = options?.model ?? config.model ?? "gpt-3.5-turbo";
      const apiKey = config.apiKey;

      const headers: Record<string, string> = {
        "content-type": "application/json",
      };
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 4096,
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Custom provider request failed: ${error}`);
      }

      const data = (await response.json()) as {
        id: string;
        model: string;
        choices: Array<{
          message: { content: string; role: string };
          finish_reason: string;
        }>;
        usage?: {
          prompt_tokens: number;
          completion_tokens: number;
          total_tokens: number;
        };
      };

      return {
        id: data.id,
        model: data.model,
        content: data.choices[0]?.message?.content ?? "",
        finishReason: data.choices[0]?.finish_reason ?? "stop",
        usage: data.usage
          ? {
              promptTokens: data.usage.prompt_tokens,
              completionTokens: data.usage.completion_tokens,
              totalTokens: data.usage.total_tokens,
            }
          : undefined,
        raw: data,
      };
    },
  };

export function getProviderAdapter(
  providerId: string,
): ZetroModelProviderAdapter | null {
  switch (providerId) {
    case "none":
      return noneProviderAdapter;
    case "ollama-local":
      return ollamaProviderAdapter;
    case "openai":
      return openaiProviderAdapter;
    case "anthropic":
      return anthropicProviderAdapter;
    case "custom-openai-compatible":
      return customOpenAICompatibleProviderAdapter;
    default:
      return null;
  }
}

export const ZETRO_MODEL_PROVIDER_ADAPTERS: ZetroModelProviderAdapter[] = [
  noneProviderAdapter,
  ollamaProviderAdapter,
  openaiProviderAdapter,
  anthropicProviderAdapter,
  customOpenAICompatibleProviderAdapter,
];
