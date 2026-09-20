export interface ZunoTask {
  readonly id: string;
  readonly title: string;
  readonly repository: string;
  readonly ownedPaths: readonly string[];
  readonly status: string;
}

export interface ZunoOverview {
  readonly mode: "local-edge";
  readonly runnerUrl: string;
  readonly tasks: readonly ZunoTask[];
}

export interface ZunoHealth {
  readonly status: "ok";
  readonly providers: readonly string[];
}

export async function readZunoHealth(request: typeof fetch = fetch): Promise<ZunoHealth> {
  return requestJson<ZunoHealth>(request, "/api/v1/cxforge/health");
}

export async function readZunoOverview(request: typeof fetch = fetch): Promise<ZunoOverview> {
  return requestJson<ZunoOverview>(request, "/api/v1/cxforge/control/overview");
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
