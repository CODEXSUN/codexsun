import { zetroTableNames } from "../../database/table-names.js";
import {
  ZETRO_SUPPORTED_PROVIDERS,
  type ZetroModelProvider,
  type ZetroModelProviderId,
  type ZetroModelMessage,
  type ZetroModelResponse,
  type ZetroModelHealthResult,
  type ZetroProviderConfig,
} from "./model-provider-types.js";
import { getProviderAdapter } from "./model-provider-adapters.js";

export type ZetroModelSettings = {
  providerId: ZetroModelProviderId;
  providerConfigs: Record<ZetroModelProviderId, ZetroProviderConfig>;
  enabled: boolean;
  temperature: number;
  maxTokens: number;
};

function getEnvConfig(
  providerId: ZetroModelProviderId,
): Partial<ZetroProviderConfig> {
  switch (providerId) {
    case "ollama-local":
      return {
        baseUrl:
          process.env["ZETRO_OLLAMA_BASE_URL"] ?? "http://localhost:11434",
        model: process.env["ZETRO_OLLAMA_MODEL"],
      };
    case "openai":
      return {
        apiKey: process.env["ZETRO_OPENAI_API_KEY"],
        model: process.env["ZETRO_OPENAI_MODEL"],
      };
    case "anthropic":
      return {
        apiKey: process.env["ZETRO_ANTHROPIC_API_KEY"],
        model: process.env["ZETRO_ANTHROPIC_MODEL"],
      };
    case "custom-openai-compatible":
      return {
        baseUrl: process.env["ZETRO_CUSTOM_BASE_URL"],
        apiKey: process.env["ZETRO_CUSTOM_API_KEY"],
        model: process.env["ZETRO_CUSTOM_MODEL"],
      };
    default:
      return {};
  }
}

function mergeConfigs(
  base: ZetroProviderConfig,
  env: Partial<ZetroProviderConfig>,
): ZetroProviderConfig {
  return {
    ...base,
    ...env,
    baseUrl: env.baseUrl ?? base.baseUrl,
    apiKey: env.apiKey ?? base.apiKey,
    model: env.model ?? base.model,
  };
}

export function buildZetroModelSettings(): ZetroModelSettings {
  const defaultProviderId =
    (process.env["ZETRO_PROVIDER"] as ZetroModelProviderId) ?? "none";

  const providerConfigs = {} as Record<
    ZetroModelProviderId,
    ZetroProviderConfig
  >;

  for (const provider of ZETRO_SUPPORTED_PROVIDERS) {
    const envConfig = getEnvConfig(provider.id);
    providerConfigs[provider.id] = mergeConfigs(
      {
        providerId: provider.id,
        enabled: provider.id === defaultProviderId,
        ...envConfig,
      },
      {},
    );
  }

  return {
    providerId: defaultProviderId,
    providerConfigs,
    enabled: defaultProviderId !== "none",
    temperature: Number(process.env["ZETRO_TEMPERATURE"] ?? 0.7),
    maxTokens: Number(process.env["ZETRO_MAX_TOKENS"] ?? 4096),
  };
}

export function getActiveProvider(
  settings: ZetroModelSettings,
): ZetroModelProvider {
  const config = settings.providerConfigs[settings.providerId];
  const adapter = getProviderAdapter(settings.providerId);

  return {
    id: settings.providerId,
    name: adapter?.name ?? settings.providerId,
    description: adapter?.description ?? "",
    enabled: config?.enabled ?? false,
    baseUrl: config?.baseUrl,
    apiKey: config?.apiKey,
    model: config?.model,
    status: config?.enabled ? "configured" : "unconfigured",
  };
}

export async function checkProviderHealth(
  providerId: ZetroModelProviderId,
  config: ZetroProviderConfig,
): Promise<ZetroModelHealthResult> {
  const adapter = getProviderAdapter(providerId);

  if (!adapter) {
    return {
      providerId,
      healthy: false,
      error: `Unknown provider: ${providerId}`,
      timestamp: new Date().toISOString(),
    };
  }

  const provider = getActiveProvider({
    providerId,
    providerConfigs: { [providerId]: config },
    enabled: config.enabled,
    temperature: 0.7,
    maxTokens: 4096,
  } as ZetroModelSettings);

  return adapter.checkHealth(provider);
}

export async function completeModelRequest(
  providerId: ZetroModelProviderId,
  config: ZetroProviderConfig,
  messages: ZetroModelMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
  },
): Promise<ZetroModelResponse> {
  const adapter = getProviderAdapter(providerId);

  if (!adapter) {
    throw new Error(`Unknown provider: ${providerId}`);
  }

  const provider = getActiveProvider({
    providerId,
    providerConfigs: { [providerId]: config },
    enabled: config.enabled,
    temperature: options?.temperature ?? 0.7,
    maxTokens: options?.maxTokens ?? 4096,
  } as ZetroModelSettings);

  return adapter.complete(provider, messages, {
    temperature: options?.temperature,
    maxTokens: options?.maxTokens,
    model: options?.model,
  });
}

export function isProviderEnabled(settings: ZetroModelSettings): boolean {
  return settings.providerId !== "none" && settings.enabled;
}

export function listSupportedProviders(): ZetroModelProvider[] {
  return ZETRO_SUPPORTED_PROVIDERS.map((p) => ({
    ...p,
    status: p.enabled ? "configured" : "unconfigured",
  }));
}
