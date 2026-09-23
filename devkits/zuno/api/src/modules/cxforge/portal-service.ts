import { z } from "zod";
import { overview, PortalError, type PortalOverview } from "./portal-contracts";
import { PortalStore } from "./portal-store";

const control = "/api/v1/cxforge/control";
export interface Snapshot {
  state: "ready" | "unavailable" | "configuration required";
  lastConfirmedAt?: string; latencyMs?: number; error?: string; issues?: string[]; overview?: PortalOverview;
}

export class PortalService {
  constructor(readonly store: PortalStore, private readonly request: typeof fetch = fetch) {}

  async call<T>(serverId: string, path: string, schema: z.ZodType<T, z.ZodTypeDef, unknown>, body?: unknown, method = "POST"): Promise<T> {
    const response = await this.response(serverId, path, body, method);
    return schema.parse(await response.json());
  }

  async response(serverId: string, path: string, body?: unknown, method = "POST", signal = AbortSignal.timeout(30000)): Promise<Response> {
    const server = this.store.server(serverId);
    let response: Response;
    try {
      response = await this.request(`${server.apiUrl}${path}`, { method: body === undefined ? "GET" : method, redirect: "error", signal,
        headers: { "X-CXForge-Client-Key": server.credential, "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    } catch { throw new PortalError(502, "CXForge connection interrupted. Refresh to reconcile the last confirmed state."); }
    if (!response.ok) {
      // Do not reflect worker error bodies: Git errors can contain credentials.
      throw new PortalError(response.status === 401 || response.status === 403 ? 424 : response.status === 409 ? 409 : 502,
        `CXForge returned ${response.status}. ${response.status === 409 ? "State changed; refresh before acting." : "Check server configuration, credentials, repository permissions, or worker logs."}`);
    }
    return response;
  }

  async snapshot(serverId: string): Promise<Snapshot> {
    const key = `snapshot:${serverId}`;
    const previous = this.store.get<Snapshot>(key);
    const started = performance.now();
    try {
      const [health, runner, current] = await Promise.all([
        this.call(serverId, "/api/v1/cxforge/health", z.object({ status: z.literal("ok"), version: z.string().optional() })),
        this.call(serverId, "/api/v1/cxforge/runner/health", z.object({ status: z.string(), issues: z.array(z.string()).nullish() })),
        this.call(serverId, `${control}/overview`, overview),
      ]);
      const result: Snapshot = { state: runner.status === "ready" ? "ready" : "configuration required", lastConfirmedAt: new Date().toISOString(), latencyMs: Math.round(performance.now() - started), issues: runner.issues ?? [], overview: { ...current, version: current.version ?? health.version } };
      this.store.set(key, result);
      return result;
    } catch (error) {
      return { ...previous, state: error instanceof PortalError && error.status === 424 ? "configuration required" : "unavailable", error: error instanceof PortalError ? error.message : "CXForge returned an unsupported response. Check its API contract." };
    }
  }

}
