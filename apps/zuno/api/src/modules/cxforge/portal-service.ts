import { z } from "zod";
import { decisionInput, event, messageInput, overview, PortalError, task, taskInput, type PortalOverview, type PortalTask } from "./portal-contracts.js";
import { PortalStore } from "./portal-store.js";

const control = "/api/v1/cxforge/control";
export interface Snapshot {
  state: "ready" | "unavailable" | "configuration required";
  lastConfirmedAt?: string; latencyMs?: number; error?: string; issues?: string[]; overview?: PortalOverview;
}

export class PortalService {
  constructor(readonly store: PortalStore, private readonly request: typeof fetch = fetch) {}

  async call<T>(serverId: string, path: string, schema: z.ZodType<T>, body?: unknown, method = "POST"): Promise<T> {
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

  async current(serverId: string, capability?: string): Promise<PortalOverview> {
    const current = await this.call(serverId, `${control}/overview`, overview);
    if (capability && !current.controlCapabilities.includes(capability)) throw new PortalError(501, `CXForge does not support ${capability}. See the Zuno CXForge control contract.`);
    return current;
  }

  async create(serverId: string, input: z.infer<typeof taskInput>): Promise<PortalTask> {
    const current = await this.current(serverId, "execution-profiles-v1");
    if (!current.controlCapabilities.includes("idempotent-commands-v1")) throw new PortalError(501, "CXForge must support idempotent-commands-v1 before task submission.");
    const repository = current.repositories.find((item) => item.id === input.repositoryProfileId);
    if (!repository || repository.mirrorStatus !== "ready") throw new PortalError(409, "Select a ready repository profile.");
    if (!current.executionProfiles.some((item) => item.id === input.executionProfileId)) throw new PortalError(400, "Select a trusted CXForge execution profile.");
    if (input.parentTaskId && !current.tasks.some((item) => item.id === input.parentTaskId && ["merged", "closed", "cancelled"].includes(item.status))) throw new PortalError(409, "Only a closed or merged task can create a linked follow-up.");
    return this.store.command(`${serverId}:create:${input.idempotencyKey}`, input, () => this.call(serverId, `${control}/tasks`, task, input));
  }

  async queue(serverId: string, id: string, idempotencyKey: string): Promise<PortalTask> {
    return this.store.command(`${serverId}:queue:${idempotencyKey}`, { id }, async () => {
      const current = await this.current(serverId, "idempotent-commands-v1");
      const selected = this.find(current, id);
      if (selected.status !== "draft") throw new PortalError(409, "Task is no longer a draft. Refresh its queue state.");
      return this.call(serverId, `${control}/tasks/${id}/queue`, task, { idempotencyKey });
    });
  }

  async followUp(serverId: string, id: string, input: z.infer<typeof messageInput>, actorId: string): Promise<unknown> {
    const current = await this.current(serverId, "task-messages-v1");
    const selected = this.find(current, id);
    if (["merged", "closed", "cancelled"].includes(selected.status)) throw new PortalError(409, "Create a linked follow-up task from the current default branch.");
    if (selected.taskRevision !== input.expectedTaskRevision) throw new PortalError(409, "Task revision changed. Refresh before requesting changes.");
    if (selected.status === "blocked" && selected.workspaceResumable !== true) throw new PortalError(409, "CXForge has not confirmed that this workspace can resume. A new workspace may be necessary.");
    return this.store.command(`${serverId}:message:${input.messageId}`, { id, input, actorId }, async () => {
      const result = await this.call(serverId, `${control}/tasks/${id}/messages`, z.object({ messageId: z.string(), taskId: z.string(), deliveryState: z.enum(["pending", "acknowledged"]), taskRevision: z.number().int() }), { ...input, taskId: id, actorId });
      this.appendAudit(serverId, id, { ...input, actorId, kind: "follow-up", ...result });
      return result;
    });
  }

  async decide(serverId: string, id: string, action: "publish" | "merge", input: z.infer<typeof decisionInput>, actorId: string): Promise<unknown> {
    return this.store.command(`${serverId}:${action}:${input.idempotencyKey}`, { id, input, actorId }, async () => {
      const current = await this.current(serverId, action === "publish" ? "revision-publication-v1" : "provider-merge-v1");
      const selected = this.find(current, id);
      if (selected.taskRevision !== input.expectedTaskRevision || selected.evidenceId !== input.evidenceId || selected.commitSha !== input.approvedCommitSha) throw new PortalError(409, "Reviewed evidence has changed. Refresh and review the new revision.");
      if (action === "publish" && selected.status !== "review") throw new PortalError(409, "Only a verified review revision can be published.");
      if (action === "merge" && (!input.expectedHeadSha || !input.pullRequestId || selected.mergeRequest?.status !== "open" || selected.mergeRequest.externalId !== input.pullRequestId || selected.mergeRequest.headSha !== input.expectedHeadSha)) throw new PortalError(409, "Pull request head changed or is unavailable. Review its exact head before merging.");
      const decision = { ...input, taskId: id, actorId, decision: action, decidedAt: new Date().toISOString() };
      this.appendAudit(serverId, id, { ...decision, kind: "approval", state: "submitted" });
      const result = await this.call(serverId, `${control}/tasks/${id}/${action}`, z.object({ task, providerConfirmed: z.boolean().optional(), defaultBranchCommitSha: z.string().optional() }), decision);
      if (action === "merge" && (!result.providerConfirmed || result.task.status !== "merged")) throw new PortalError(409, "Provider has not confirmed the merge. Check required checks and conflicts.");
      this.appendAudit(serverId, id, { ...decision, kind: "approval", state: "confirmed" });
      if (action === "merge" && selected.repositoryProfileId) {
        try {
          const synced = await this.call(serverId, `${control}/repositories/${selected.repositoryProfileId}/sync`, z.object({ commitSha: z.string(), mirrorStatus: z.literal("ready") }), {});
          return { ...result, defaultBranchCommitSha: synced.commitSha, mirrorRefreshed: true };
        } catch { return { ...result, mirrorRefreshed: false, error: "Provider confirmed merge; mirror refresh failed. Retry repository sync." }; }
      }
      return result;
    });
  }

  audit(serverId: string, id: string): unknown[] { return this.store.get<unknown[]>(`audit:${serverId}:${id}`) ?? []; }

  private appendAudit(serverId: string, id: string, value: unknown): void { this.store.set(`audit:${serverId}:${id}`, [...this.audit(serverId, id), value]); }

  private find(current: PortalOverview, id: string): PortalTask {
    const selected = current.tasks.find((item) => item.id === id);
    if (!selected) throw new PortalError(404, "Task not found.");
    return selected;
  }
}

// CXForge currently replays its complete retained history. Persist IDs to deduplicate
// reconnects, and reconcile with overview independently of event delivery.
export async function collectEvents(service: PortalService, serverId: string, taskId: string): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);
  try {
    const response = await service.response(serverId, `${control}/tasks/${taskId}/events`, undefined, "GET", controller.signal);
    if (!response.headers.get("content-type")?.includes("text/event-stream")) throw new PortalError(502, "CXForge event stream unavailable.");
    const reader = response.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        buffer += decoder.decode(next.value, { stream: true }).replace(/\r\n/gu, "\n");
        if (buffer.length > 1_000_000) throw new PortalError(502, "CXForge event exceeds the allowed size.");
        let end: number;
        while ((end = buffer.indexOf("\n\n")) >= 0) {
          const frame = buffer.slice(0, end);
          buffer = buffer.slice(end + 2);
          const data = frame.split("\n").filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trimStart()).join("\n");
          if (!data) continue;
          const parsed = event.parse(JSON.parse(data));
          if (parsed.taskId === taskId) service.store.addEvent(serverId, taskId, parsed);
        }
      }
    } finally { await reader.cancel().catch(() => undefined); }
  } catch (error) { if (!controller.signal.aborted) throw error; }
  finally { clearTimeout(timer); }
}
