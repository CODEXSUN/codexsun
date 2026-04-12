export type ZetroModelProviderId =
  | "none"
  | "ollama-local"
  | "openai"
  | "anthropic"
  | "custom-openai-compatible";

export type ZetroModelProviderStatus =
  | "configured"
  | "unconfigured"
  | "error"
  | "healthy"
  | "unhealthy";

export type ZetroModelProvider = {
  id: ZetroModelProviderId;
  name: string;
  description: string;
  enabled: boolean;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  status: ZetroModelProviderStatus;
  healthCheckedAt?: string;
  healthError?: string;
};

export type ZetroModelMessageRole = "system" | "user" | "assistant";

export type ZetroModelMessage = {
  role: ZetroModelMessageRole;
  content: string;
};

export type ZetroModelUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type ZetroModelResponse = {
  id: string;
  model: string;
  content: string;
  finishReason: string;
  usage?: ZetroModelUsage;
  raw?: unknown;
};

export type ZetroModelHealthResult = {
  providerId: ZetroModelProviderId;
  healthy: boolean;
  latencyMs?: number;
  error?: string;
  timestamp: string;
};

export type ZetroModelProviderAdapter = {
  id: ZetroModelProviderId;
  name: string;
  description: string;
  checkHealth(config: ZetroModelProvider): Promise<ZetroModelHealthResult>;
  complete(
    config: ZetroModelProvider,
    messages: ZetroModelMessage[],
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    },
  ): Promise<ZetroModelResponse>;
};

export type ZetroProviderConfig = {
  providerId: ZetroModelProviderId;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  enabled: boolean;
};

export const ZETRO_DEFAULT_PROVIDER_ID: ZetroModelProviderId = "none";

export const ZETRO_SUPPORTED_PROVIDERS: ZetroModelProvider[] = [
  {
    id: "none",
    name: "None",
    description:
      "No model provider. Zetro operates in manual mode without LLM assistance.",
    enabled: true,
    status: "configured",
  },
  {
    id: "ollama-local",
    name: "Ollama (Local)",
    description:
      "Local LLM via Ollama. No API key required. Must have Ollama running.",
    enabled: false,
    baseUrl: process.env["ZETRO_OLLAMA_BASE_URL"] ?? "http://localhost:11434",
    model: process.env["ZETRO_OLLAMA_MODEL"] ?? "llama3",
    status: "unconfigured",
  },
  {
    id: "openai",
    name: "OpenAI",
    description:
      "OpenAI API. Requires API key. Configure via ZETRO_OPENAI_API_KEY env var.",
    enabled: false,
    apiKey: process.env["ZETRO_OPENAI_API_KEY"],
    model: process.env["ZETRO_OPENAI_MODEL"] ?? "gpt-4o-mini",
    status: "unconfigured",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description:
      "Anthropic Claude API. Requires API key. Configure via ZETRO_ANTHROPIC_API_KEY env var.",
    enabled: false,
    apiKey: process.env["ZETRO_ANTHROPIC_API_KEY"],
    model: process.env["ZETRO_ANTHROPIC_MODEL"] ?? "claude-3-5-haiku",
    status: "unconfigured",
  },
  {
    id: "custom-openai-compatible",
    name: "Custom OpenAI-Compatible",
    description:
      "Custom provider with OpenAI-compatible API. Configure base URL and API key.",
    enabled: false,
    baseUrl: process.env["ZETRO_CUSTOM_BASE_URL"],
    apiKey: process.env["ZETRO_CUSTOM_API_KEY"],
    model: process.env["ZETRO_CUSTOM_MODEL"],
    status: "unconfigured",
  },
];
