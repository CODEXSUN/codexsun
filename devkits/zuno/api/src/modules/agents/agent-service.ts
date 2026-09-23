import { randomUUID } from "node:crypto";
import type { PortalStore } from "../cxforge/portal-store.js";
import type { AgentRecord, AssignmentRecord, CreateAssignment } from "./agent-contracts.js";
import { AgentStore } from "./agent-store.js";
import { signLease } from "./lease.js";

export class AgentService {
  constructor(
    private readonly store: AgentStore,
    private readonly workers: PortalStore,
    private readonly zxaLeaseKey: string,
    private readonly zxaControlKey: string,
    private readonly request: typeof fetch = fetch,
  ) {}

  close(): void { this.store.close(); }
  register(input: Parameters<AgentStore["register"]>[0]): AgentRecord { return this.store.register(input); }
  agents(): AgentRecord[] { return this.store.agents(); }
  assignments(): AssignmentRecord[] { return this.store.assignments(); }

  async connection(agentId: string): Promise<unknown> {
    return this.requestConnection(agentId, "/connect/status", "GET");
  }

  async startDeviceCode(agentId: string): Promise<unknown> {
    return this.requestConnection(agentId, "/connect/device-code", "POST");
  }

  createAssignment(input: CreateAssignment, actorId: string): AssignmentRecord {
    const agent = this.store.agent(input.agentId);
    if (!agent || agent.status !== "ready") throw new AgentServiceError(409, "Choose a ready ZXA agent.");
    this.workers.server(input.cxforgeServerId);
    return this.store.createAssignment(input, actorId);
  }

  async approve(id: string): Promise<AssignmentRecord> {
    const approved = this.store.transition(id, "draft", "approved");
    const agent = this.store.agent(approved.agentId);
    if (!agent || agent.status !== "ready") return this.store.transition(id, "approved", "failed", "ZXA is unavailable.");
    const worker = this.workers.server(approved.cxforgeServerId);
    const correlationId = randomUUID();
    const expiresAt = new Date(Date.now() + 60_000).toISOString();
    const revision = approved.revision;
    const zxaLease = signLease({ assignmentId: id, audience: "zxa", correlationId, expiresAt, revision }, this.zxaLeaseKey);
    const cxforgeLease = signLease({ assignmentId: id, audience: "cxforge", correlationId, expiresAt, revision, serverId: worker.id }, worker.credential);
    this.store.transition(id, "approved", "dispatched");
    try {
      const response = await this.request(`${agent.apiUrl}/runs`, {
        body: JSON.stringify({ assignment: { correlationId, cxforgeApiUrl: worker.apiUrl, cxforgeLease, id, ownedPaths: approved.ownedPaths, prompt: approved.prompt, revision, title: approved.title }, lease: zxaLease }),
        headers: { "Content-Type": "application/json" }, method: "POST", signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error("ZXA rejected the assignment.");
      const result = await response.json() as { cxforgeAcknowledged?: unknown; summary?: unknown };
      if (result.cxforgeAcknowledged !== true) throw new Error("ZXA did not confirm CXForge access.");
      return this.store.transition(id, "dispatched", "completed", typeof result.summary === "string" ? result.summary : "ZXA confirmed the CXForge assignment.");
    } catch (error) {
      return this.store.transition(id, "dispatched", "failed", error instanceof Error ? error.message : "ZXA dispatch failed.");
    }
  }

  private async requestConnection(agentId: string, path: string, method: "GET" | "POST"): Promise<unknown> {
    const agent = this.store.agent(agentId);
    if (!agent || agent.status !== "ready") throw new AgentServiceError(409, "Choose a ready ZXA agent.");
    try {
      const response = await this.request(`${agent.apiUrl}${path}`, {
        headers: { "X-ZXA-Control-Key": this.zxaControlKey }, method, signal: AbortSignal.timeout(15_000),
      });
      const body = await response.json() as unknown;
      if (!response.ok) throw new Error("ZXA rejected the connection request.");
      return body;
    } catch (error) {
      throw new AgentServiceError(502, error instanceof Error ? error.message : "ZXA connection request failed.");
    }
  }
}

export class AgentServiceError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}
