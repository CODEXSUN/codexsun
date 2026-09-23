import { apiErrorSchema, platformHealthSchema, platformModulesSchema, type PlatformHealth, type PlatformModules } from "@codexsun/contracts";
import type { ZodType } from "zod";

type RequestFunction = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export class PlatformApiError extends Error {
  constructor(
    readonly code: "configuration" | "network" | "response" | "schema",
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "PlatformApiError";
  }
}

export function getPlatformApiUrl(value = import.meta.env.VITE_PLATFORM_API_URL): string {
  const candidate = value?.trim();
  if (!candidate) throw new PlatformApiError("configuration", "Set VITE_PLATFORM_API_URL to the Platform API URL.");
  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("unsupported protocol");
    return url.toString().replace(/\/$/u, "");
  } catch {
    throw new PlatformApiError("configuration", "VITE_PLATFORM_API_URL must be an absolute HTTP URL.");
  }
}

export async function fetchPlatformJson<T>(options: {
  readonly apiUrl: string;
  readonly path: string;
  readonly request?: RequestFunction;
  readonly schema: ZodType<T>;
  readonly signal?: AbortSignal;
}): Promise<T> {
  const request = options.request ?? fetch;
  let response: Response;
  try {
    response = await request(`${options.apiUrl}${options.path}`, { signal: options.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new PlatformApiError("network", "Platform API is unavailable.");
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => undefined);
    const apiError = apiErrorSchema.safeParse(payload);
    throw new PlatformApiError("response", apiError.success ? apiError.data.error : "Platform API request failed.", response.status);
  }
  const result = options.schema.safeParse(await response.json());
  if (!result.success) throw new PlatformApiError("schema", "Platform API returned an invalid response.");
  return result.data;
}

export function fetchPlatformHealth(apiUrl: string, request?: RequestFunction, signal?: AbortSignal): Promise<PlatformHealth> {
  return fetchPlatformJson<PlatformHealth>({ apiUrl, path: "/api/v1/platform/health", request, schema: platformHealthSchema, signal });
}

export function fetchPlatformModules(apiUrl: string, request?: RequestFunction, signal?: AbortSignal): Promise<PlatformModules> {
  return fetchPlatformJson<PlatformModules>({ apiUrl, path: "/api/v1/platform/modules", request, schema: platformModulesSchema, signal });
}
