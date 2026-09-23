export interface ZunoMobileOverview {
  readonly mode: "local-edge";
  readonly runnerUrl: string;
  readonly tasks: readonly { readonly id: string; readonly title: string; readonly status: string }[];
}

export interface ZunoMobileHealth {
  readonly status: "ok";
  readonly providers: readonly string[];
}

export async function readZunoMobileHealth(request: typeof fetch = fetch): Promise<ZunoMobileHealth> {
  return requestJson<ZunoMobileHealth>(request, "/api/v1/cxforge/health");
}

export async function readZunoMobileOverview(request: typeof fetch = fetch): Promise<ZunoMobileOverview> {
  return requestJson<ZunoMobileOverview>(request, "/api/v1/cxforge/control/overview");
}

function endpoint(path: string): string {
  const baseUrl = import.meta.env?.VITE_ZUNO_CXFORGE_API_URL ?? "http://127.0.0.1:6400";
  return `${baseUrl.replace(/\/$/u, "")}${path}`;
}

async function requestJson<T>(request: typeof fetch, path: string): Promise<T> {
  const response = await request(endpoint(path), { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error("CXForge is unavailable.");
  return response.json() as Promise<T>;
}
