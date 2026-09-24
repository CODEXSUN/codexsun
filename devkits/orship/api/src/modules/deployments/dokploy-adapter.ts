import { randomUUID } from "node:crypto";
import type { SecretProvider } from "@codexsun/framework";
import { z } from "zod";
import { DeploymentProviderError, type ApplicationSource, type DeploymentApplication, type DeploymentLog, type DeploymentProvider, type DeploymentRecord, type DeploymentTarget, type EnvironmentVariable, type HealthResult, type ProviderRegistrationInput, type ProviderSummary } from "./provider.js";

type DokployConfig = ProviderRegistrationInput & { readonly id: string; readonly secretProvider: SecretProvider; readonly request?: typeof fetch; readonly timeoutMs?: number };
const unknownObject = z.record(z.unknown());

export class DokployProvider implements DeploymentProvider {
  private readonly request: typeof fetch;
  private readonly timeoutMs: number;

  constructor(private readonly config: DokployConfig) {
    validateBaseUrl(config.baseUrl);
    this.request = config.request ?? fetch;
    this.timeoutMs = config.timeoutMs ?? 20_000;
  }

  async registerProvider(input: ProviderRegistrationInput): Promise<ProviderSummary> {
    await this.healthCheck();
    return { ...input, id: this.config.id, status: "ready" };
  }

  async listTargets(): Promise<DeploymentTarget[]> {
    const body = await this.call("GET", "/server.all");
    return readArray(body, "servers").flatMap((item) => {
      const row = unknownObject.safeParse(item).success ? unknownObject.parse(item) : {};
      const providerTargetId = readString(row, "serverId", "id");
      return providerTargetId ? [{ id: providerTargetId, name: readString(row, "name") ?? providerTargetId, address: readString(row, "ipAddress", "ip") ?? "unknown", status: readString(row, "status") ?? "unknown", production: readString(row, "serverType") === "deploy", providerTargetId }] : [];
    });
  }

  async testTarget(target: DeploymentTarget): Promise<HealthResult> {
    return this.healthResult(await this.call("GET", "/server.validate", { serverId: target.providerTargetId }));
  }

  async createApplication(input: { readonly name: string; readonly source: ApplicationSource; readonly target: DeploymentTarget }): Promise<DeploymentApplication> {
    const isCompose = input.source.type === "compose";
    const body = isCompose
      ? await this.call("POST", "/compose.create", { name: input.name, appName: input.name, environmentId: input.target.id, serverId: input.target.providerTargetId, composeFile: input.source.composeFile ?? "" })
      : await this.call("POST", "/application.create", { name: input.name, appName: input.name, environmentId: input.target.id, serverId: input.target.providerTargetId });
    const providerApplicationId = readString(unknownObject.parse(body), "applicationId", "composeId", "id");
    if (!providerApplicationId) throw new DeploymentProviderError("provider.malformed_response", "Dokploy did not return an application identifier.", false);
    const application: DeploymentApplication = { id: randomUUID(), name: input.name, source: input.source, targetId: input.target.id, providerApplicationId, status: "created" };
    await this.updateApplication(application, input.source);
    return application;
  }

  async updateApplication(application: DeploymentApplication, source: ApplicationSource): Promise<DeploymentApplication> {
    const path = source.type === "compose" ? "/compose.update" : "/application.update";
    const payload = source.type === "compose"
      ? { composeId: application.providerApplicationId, name: application.name, composeFile: source.composeFile ?? "" }
      : { applicationId: application.providerApplicationId, name: application.name, sourceType: source.type, repository: source.repository ?? null, branch: source.branch ?? null, dockerImage: source.image ?? null };
    await this.call("POST", path, payload);
    return { ...application, source, status: "updated" };
  }

  async deleteApplication(application: DeploymentApplication): Promise<void> {
    await this.call("POST", application.source.type === "compose" ? "/compose.delete" : "/application.delete", application.source.type === "compose" ? { composeId: application.providerApplicationId, deleteVolumes: false } : { applicationId: application.providerApplicationId });
  }

  deployApplication(application: DeploymentApplication): Promise<DeploymentRecord> { return this.action(application, "deploy", "/application.deploy", "/compose.deploy"); }
  redeployApplication(application: DeploymentApplication): Promise<DeploymentRecord> { return this.action(application, "redeploy", "/application.redeploy", "/compose.redeploy"); }
  stopApplication(application: DeploymentApplication): Promise<DeploymentRecord> { return this.action(application, "stop", "/application.stop", "/compose.stop"); }
  startApplication(application: DeploymentApplication): Promise<DeploymentRecord> { return this.action(application, "start", "/application.start", "/compose.start"); }

  async rollbackApplication(application: DeploymentApplication, providerRollbackId: string): Promise<DeploymentRecord> {
    await this.call("POST", "/rollback.rollback", { rollbackId: providerRollbackId });
    return { id: randomUUID(), providerDeploymentId: providerRollbackId, status: "queued", operation: "rollback", applicationId: application.id, targetId: application.targetId };
  }

  async getDeploymentStatus(application: DeploymentApplication): Promise<DeploymentRecord[]> {
    const body = await this.call("GET", "/deployment.all", { applicationId: application.providerApplicationId });
    return readArray(body, "deployments").map((item) => toDeployment(item, application));
  }

  async getDeploymentLogs(application: DeploymentApplication, providerDeploymentId: string, tail: number): Promise<DeploymentLog[]> {
    const body = await this.call("GET", "/deployment.readLogs", { deploymentId: providerDeploymentId, tail });
    return readArray(body, "logs").map((item) => ({ message: typeof item === "string" ? item : readString(unknownObject.parse(item), "message", "log", "line") ?? "", timestamp: typeof item === "object" && item ? readString(unknownObject.parse(item), "timestamp", "createdAt") : undefined, level: typeof item === "object" && item ? readString(unknownObject.parse(item), "level") : undefined }));
  }

  async setEnvironment(application: DeploymentApplication, variables: readonly EnvironmentVariable[]): Promise<void> {
    const env = (await Promise.all(variables.map(async (item) => `${item.name}=${item.secretReference ? await this.config.secretProvider.resolve(item.secretReference) ?? "" : item.value ?? ""}`))).join("\n");
    const path = application.source.type === "compose" ? "/compose.saveEnvironment" : "/application.saveEnvironment";
    await this.call("POST", path, application.source.type === "compose" ? { composeId: application.providerApplicationId, env } : { applicationId: application.providerApplicationId, env, buildArgs: null, buildSecrets: null, createEnvFile: true });
  }

  async listServices(application: DeploymentApplication): Promise<readonly { readonly name: string; readonly status: string }[]> {
    if (application.source.type !== "compose") return [];
    const body = await this.call("GET", "/compose.loadServices", { composeId: application.providerApplicationId, type: "cache" });
    return readArray(body, "services").flatMap((item) => { const row = typeof item === "object" && item ? unknownObject.parse(item) : {}; const name = readString(row, "name", "serviceName"); return name ? [{ name, status: readString(row, "status") ?? "unknown" }] : []; });
  }

  async healthCheck(): Promise<HealthResult> {
    try { return this.healthResult(await this.call("GET", "/settings.checkInfrastructureHealth")); } catch (error) { if (error instanceof DeploymentProviderError) return { status: "unhealthy", message: error.message, checkedAt: new Date().toISOString() }; throw error; }
  }

  private async action(application: DeploymentApplication, operation: Exclude<DeploymentRecord["operation"], "rollback">, applicationPath: string, composePath: string): Promise<DeploymentRecord> {
    const path = application.source.type === "compose" ? composePath : applicationPath;
    const key = application.source.type === "compose" ? "composeId" : "applicationId";
    const body = await this.call("POST", path, { [key]: application.providerApplicationId });
    const providerDeploymentId = body && typeof body === "object" ? readString(unknownObject.parse(body), "deploymentId", "id") : undefined;
    return { id: randomUUID(), providerDeploymentId, status: "queued", operation, applicationId: application.id, targetId: application.targetId };
  }

  private async call(method: "GET" | "POST", path: string, query?: Readonly<Record<string, unknown>>): Promise<unknown> {
    const token = await this.config.secretProvider.resolve(this.config.accessTokenReference);
    if (!token) throw new DeploymentProviderError("provider.secret_unavailable", "Dokploy access token is unavailable.", false);
    const url = new URL(`${this.config.baseUrl.replace(/\/$/u, "")}${path}`);
    if (method === "GET" && query) for (const [key, value] of Object.entries(query)) if (value !== null && value !== undefined) url.searchParams.set(key, String(value));
    const correlationId = randomUUID();
    let response: Response;
    try {
      response = await this.request(url, { method, headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "x-correlation-id": correlationId }, body: method === "POST" ? JSON.stringify(query ?? {}) : undefined, signal: AbortSignal.timeout(this.timeoutMs) });
    } catch (error) { throw new DeploymentProviderError("provider.unavailable", "Dokploy is unavailable.", true, { cause: error }); }
    const body = await response.json().catch(() => undefined);
    if (!response.ok) throw new DeploymentProviderError(`provider.http_${response.status}`, "Dokploy rejected the request.", response.status >= 500 || response.status === 429);
    return body;
  }

  private healthResult(body: unknown): HealthResult { return { status: "healthy", message: readString(typeof body === "object" && body ? unknownObject.parse(body) : {}, "message", "status") ?? "Dokploy responded.", checkedAt: new Date().toISOString() }; }
}

function validateBaseUrl(value: string): void {
  const url = new URL(value);
  const local = ["localhost", "127.0.0.1", "::1", "host.docker.internal"].includes(url.hostname);
  if (url.protocol !== "https:" && !local) throw new DeploymentProviderError("provider.insecure_url", "Remote Dokploy providers require HTTPS.", false);
}

function readArray(value: unknown, key: string): unknown[] { if (Array.isArray(value)) return value; if (value && typeof value === "object") { const row = unknownObject.parse(value); return Array.isArray(row[key]) ? row[key] : Array.isArray(row.data) ? row.data : []; } return []; }
function readString(row: Record<string, unknown>, ...keys: string[]): string | undefined { for (const key of keys) if (typeof row[key] === "string" && row[key]) return row[key]; return undefined; }
function toDeployment(value: unknown, application: DeploymentApplication): DeploymentRecord { const row = value && typeof value === "object" ? unknownObject.parse(value) : {}; return { id: readString(row, "id", "deploymentId") ?? randomUUID(), providerDeploymentId: readString(row, "id", "deploymentId"), status: readString(row, "status", "state") ?? "unknown", operation: "deploy", applicationId: application.id, targetId: application.targetId, message: readString(row, "message", "description") }; }
