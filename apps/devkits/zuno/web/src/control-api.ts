export interface Server { id: string; name: string; apiUrl: string; runtime?: { operationId: string; containerId: string; ports: number[]; previewUrl: string }; }
export interface CommandSummary {
  id: string; title: string; status: string; createdAt: string; report: string; revision?: number;
  previewUrl?: string; previewStatus?: string;
}
export interface Snapshot {
  state: "ready" | "unavailable" | "configuration required";
  lastConfirmedAt?: string; latencyMs?: number; error?: string; issues?: string[];
  overview?: { containerId?: string; containerName?: string; version?: string; tasks: CommandSummary[] };
}
export function controlClient(request: typeof fetch) {
  return async <T>(path = "", body?: unknown, method = "POST"): Promise<T> => {
    const response = await request(`${import.meta.env.VITE_ZUNO_API_URL ?? ""}/api/v1/zuno/control/servers${path}`, {
      method: body === undefined ? "GET" : method, signal: AbortSignal.timeout(45000),
      ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(error.error ?? `Zuno request failed (${response.status}).`);
    }
    return response.json() as Promise<T>;
  };
}
export type ControlClient = ReturnType<typeof controlClient>;
export function webUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : undefined; } catch { return undefined; }
}
