import { execFile } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { createServer } from "node:net";
import { promisify } from "node:util";
import { z } from "zod";
import { PortalService } from "./portal-service";
import { commandTask, provisionInput } from "./workspace-contracts";
import { connection, PortalError } from "./portal-contracts";

interface WorkerRuntime { operationId: string; containerId: string; ports: number[]; previewUrl: string; }

const execute = promisify(execFile);
export interface ProvisionOperation { id: string; name: string; status: "creating" | "preparing" | "ready" | "failed"; containerId?: string; serverId?: string; ports?: number[]; taskId?: string; error?: string; }
export class ContainerProvisioner {
  private readonly active = new Set<string>();
  constructor(private readonly service: PortalService, private readonly root: string) {}

  start(input: z.infer<typeof provisionInput>): Promise<ProvisionOperation> {
    return this.service.store.command(`provision:${input.requestId}`, input, async () => {
      const operation: ProvisionOperation = { id: input.requestId, name: `${input.name}-${input.requestId.slice(0, 8)}`, status: "creating" };
      this.save(operation);
      this.active.add(operation.id);
      void this.create(operation, input);
      return operation;
    });
  }

  async get(id: string): Promise<ProvisionOperation | undefined> {
    const operation = this.service.store.get<ProvisionOperation>(`provision-state:${id}`);
    if (operation?.status === "creating" && !this.active.has(id)) {
      operation.status = "failed";
      operation.error = "Zuno restarted during creation. Inspect the named container before making a new request; no automatic duplicate was created.";
      this.save(operation);
    }
    if (operation?.status === "preparing" && operation.serverId && operation.taskId) {
      const task = await this.service.call(operation.serverId, `/api/v1/cxforge/control/commands/${operation.taskId}`, commandTask);
      if (task.status === "review") operation.status = "ready";
      if (["blocked", "failed", "cancelled"].includes(task.status)) { operation.status = "failed"; operation.error = "Workspace setup failed. Open the command report."; }
      this.save(operation);
    }
    return operation;
  }

  async drop(serverId: string): Promise<{ id: string; name: string; droppedAt: string }> {
    const server = this.service.store.server(serverId);
    const runtime = this.service.store.get<WorkerRuntime>(`runtime:${serverId}`);
    if (!runtime?.containerId) throw new PortalError(409, "This server is not a Zuno-managed worker container.");
    const snapshot = await this.service.snapshot(serverId);
    await this.verifyManagedContainer(runtime.containerId, server.name, serverId, runtime.operationId);
    await this.stopWorker(runtime.containerId);
    await this.docker(["rm", "--volumes", runtime.containerId]);
    await this.removeWorkerVolumes(serverId);
    const dropped = this.service.store.dropServer(serverId, { name: server.name, apiUrl: server.apiUrl, containerId: runtime.containerId, snapshot });
    return { id: dropped.id, name: dropped.name, droppedAt: dropped.droppedAt };
  }

  private async create(operation: ProvisionOperation, input: z.infer<typeof provisionInput>): Promise<void> {
    try {
      try { await this.docker(["network", "inspect", "codexsun-network"]); }
      catch { await this.docker(["network", "create", "codexsun-network"]); }
      const ports = await reservePorts();
      const serverId = randomUUID();
      operation.ports = ports;
      operation.serverId = serverId;
      const credential = randomBytes(32).toString("hex");
      const environment = {
        CXFORGE_ZUNO_CLIENT_KEY: credential, CXFORGE_CREDENTIAL_ENCRYPTION_KEY: randomBytes(32).toString("hex"),
        CXFORGE_CONTAINER_NAME: operation.name, CXFORGE_ADDRESS: ":6400", CXFORGE_EXECUTION_MODE: "tools",
        CXFORGE_WORKSPACE_ROOT: "/workspace", CXFORGE_STATE_PATH: "/var/lib/cxforge/state.json",
        CXFORGE_PREVIEW_ORIGIN: process.env.ZUNO_PREVIEW_ORIGIN || "http://127.0.0.1", CXFORGE_PREVIEW_PUBLIC_PORT: String(ports[1]),
        CXFORGE_MAX_WORKERS: "1", CXFORGE_COMMAND_TIMEOUT: "300", CXFORGE_ALLOW_REPO_COMMANDS: "false",
      };
      const args = ["run", "-d", "--name", operation.name, "--label", "zuno.managed=true", "--label", `zuno.provision=${operation.id}`, "--label", `zuno.server-id=${serverId}`, "--network", "codexsun-network", "--restart", "unless-stopped", "--memory", "2g", "--cpus", "2", "--pids-limit", "256", "--cap-drop", "ALL", "--security-opt", "no-new-privileges:true"];
      for (const key of Object.keys(environment)) args.push("--env", key);
      ports.forEach((port, index) => args.push("-p", `127.0.0.1:${port}:${index === 0 ? 6400 : 7299 + index}`));
      args.push(process.env.ZUNO_CXFORGE_IMAGE || "cxforge:1.0.0");
      operation.containerId = (await this.docker(args, environment)).trim();
      const apiUrl = process.env.ZUNO_DOCKER_NETWORK_CLIENT === "1" ? `http://${operation.name}:6400` : `http://127.0.0.1:${ports[0]}`;
      const server = this.service.store.saveServer({ name: operation.name, apiUrl, credential }, serverId);
      this.service.store.set(`runtime:${server.id}`, { operationId: operation.id, containerId: operation.containerId, ports, previewUrl: `${environment.CXFORGE_PREVIEW_ORIGIN}:${ports[1]}` });
      this.save(operation);
      await this.waitForHealth(server.id);
      if (input.gitConnection) {
        const saved = await this.service.call(server.id, "/api/v1/cxforge/control/git-connections", connection, input.gitConnection);
        if (input.setup?.repository) input.setup.repository.gitConnectionId = saved.id;
      }
      if (input.setup) {
        const task = await this.service.call(server.id, "/api/v1/cxforge/control/workspace/setup", commandTask, input.setup);
        operation.taskId = task.id;
        operation.status = "preparing";
      } else operation.status = "ready";
    } catch {
      operation.status = "failed";
      operation.error = "Provisioning failed. Check Docker, the installed CXForge image, available ports, and the worker report. Existing containers were not removed.";
    }
    this.save(operation);
    this.active.delete(operation.id);
  }

  private async waitForHealth(id: string): Promise<void> {
    for (let attempt = 0; attempt < 30; attempt++) {
      try { await this.service.call(id, "/api/v1/cxforge/health", z.object({ status: z.literal("ok") })); return; } catch { await new Promise((resolve) => setTimeout(resolve, 1000)); }
    }
    throw new Error("Worker health timeout");
  }
  private save(operation: ProvisionOperation): void { this.service.store.set(`provision-state:${operation.id}`, operation); }

  private async verifyManagedContainer(containerId: string, name: string, serverId: string, operationId: string): Promise<void> {
    const value = (await this.docker(["inspect", "--format", "{{.Id}}|{{.Name}}|{{index .Config.Labels \"zuno.managed\"}}|{{index .Config.Labels \"zuno.server-id\"}}|{{index .Config.Labels \"zuno.provision\"}}", containerId])).trim().split("|");
    const [actualId, actualName, managed, labelledServerId, labelledOperationId] = value;
    const knownLegacyWorker = labelledOperationId === operationId;
    if (!actualId.startsWith(containerId) || actualName !== `/${name}` || !(managed === "true" && labelledServerId === serverId) && !knownLegacyWorker) {
      throw new Error("Container identity changed. Refusing to drop a container not owned by this Zuno workspace.");
    }
  }

  private async stopWorker(containerId: string): Promise<void> {
    const running = (await this.docker(["inspect", "--format", "{{.State.Running}}", containerId])).trim();
    if (running === "true") await this.docker(["stop", "--time", "15", containerId]);
  }

  private async removeWorkerVolumes(serverId: string): Promise<void> {
    const volumes = (await this.docker(["volume", "ls", "--filter", "label=zuno.managed=true", "--filter", `label=zuno.server-id=${serverId}`, "--format", "{{.Name}}"])).trim().split(/\r?\n/u).filter(Boolean);
    for (const volume of volumes) await this.docker(["volume", "rm", volume]);
    // Image and BuildKit cache are shared by workers, so this path never prunes them.
  }

  private async docker(args: string[], environment: Record<string, string> = {}): Promise<string> {
    const result = await execute("docker", args, { cwd: this.root, env: { ...process.env, ...environment }, timeout: 60000, maxBuffer: 1024 * 1024, windowsHide: true });
    return result.stdout;
  }
}

async function reservePorts(): Promise<number[]> {
  const listeners: ReturnType<typeof createServer>[] = [];
  try {
    const ports: number[] = [];
    for (let index = 0; index < 5; index++) {
      const listener = createServer();
      listeners.push(listener);
      await new Promise<void>((resolve, reject) => { listener.once("error", reject); listener.listen(0, "127.0.0.1", resolve); });
      const address = listener.address();
      if (!address || typeof address === "string") throw new Error("Port allocation failed");
      ports.push(address.port);
    }
    return ports;
  } finally { await Promise.all(listeners.map((listener) => new Promise<void>((resolve) => listener.close(() => resolve())))); }
}
