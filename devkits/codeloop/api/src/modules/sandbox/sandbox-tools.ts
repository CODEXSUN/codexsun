import { execFileSync } from "node:child_process";
import { normalize, resolve } from "node:path";

export type SandboxStatus = "created" | "running" | "stopped" | "destroyed";
export type SandboxRecord = { id: string; name: string; containerId: string; image: string; workspace: string; status: SandboxStatus; snapshotId?: string };
export type SandboxExecResult = { sandboxId: string; command: string; exitCode: number; stdout: string; stderr: string; success: boolean };

const MAX_OUTPUT = 1_000_000;
const DEFAULT_IMAGE = "node:22-alpine";

export class SandboxTools {
  private readonly sandboxes = new Map<string, SandboxRecord>();
  private readonly snapshots = new Map<string, { image: string; sandboxId: string }>();

  constructor(private readonly workspaceRoot: string, private readonly dockerCommand = "docker") {}

  capabilities() {
    return {
      workspace: normalize(resolve(this.workspaceRoot)),
      tools: ["sandbox.create", "sandbox.start", "sandbox.exec", "sandbox.stop", "sandbox.destroy", "sandbox.snapshot", "sandbox.restore"] as const,
    };
  }

  create(name: string, image = DEFAULT_IMAGE): SandboxRecord {
    const safeName = validName(name);
    const safeImage = validImage(image);
    if (this.sandboxes.has(safeName)) throw new Error(`Sandbox '${safeName}' already exists.`);
    const containerName = `codeloop-sandbox-${safeName}-${Date.now().toString(36)}`;
    const containerId = this.runDocker(["create", "--name", containerName, "--label", "codeloop.sandbox=true", "--label", `codeloop.sandbox.name=${safeName}`, "--mount", `type=bind,source=${normalize(resolve(this.workspaceRoot))},target=/workspace`, "--workdir", "/workspace", safeImage, "sh", "-lc", "while true; do sleep 3600; done"]);
    const record: SandboxRecord = { id: safeName, name: safeName, containerId: containerId.trim(), image: safeImage, workspace: "/workspace", status: "created" };
    this.sandboxes.set(safeName, record);
    return record;
  }

  start(name: string): SandboxRecord {
    const sandbox = this.requireSandbox(name);
    if (sandbox.status !== "running") this.runDocker(["start", sandbox.containerId]);
    return this.update(sandbox, "running");
  }

  async exec(name: string, command: string, timeoutMs = 120_000): Promise<SandboxExecResult> {
    const sandbox = this.requireSandbox(name);
    if (sandbox.status !== "running") throw new Error(`Sandbox '${sandbox.name}' is not running.`);
    const safeCommand = validCommand(command);
    const timeout = Math.min(Math.max(timeoutMs, 1_000), 120_000);
    try {
      const stdout = execFileSync(this.dockerCommand, ["exec", sandbox.containerId, "sh", "-lc", safeCommand], { encoding: "utf8", timeout, maxBuffer: MAX_OUTPUT });
      return { sandboxId: sandbox.id, command: safeCommand, exitCode: 0, stdout: String(stdout), stderr: "", success: true };
    } catch (error) {
      const failure = error as { status?: number; stdout?: string | Buffer; stderr?: string | Buffer; killed?: boolean };
      return { sandboxId: sandbox.id, command: safeCommand, exitCode: failure.killed ? 124 : Number(failure.status ?? 1), stdout: String(failure.stdout ?? ""), stderr: String(failure.stderr ?? (failure.killed ? `Sandbox command timed out after ${timeout}ms.` : "Sandbox command failed.")), success: false };
    }
  }

  stop(name: string): SandboxRecord {
    const sandbox = this.requireSandbox(name);
    if (sandbox.status === "running") this.runDocker(["stop", sandbox.containerId]);
    return this.update(sandbox, "stopped");
  }

  destroy(name: string): { id: string; destroyed: boolean } {
    const sandbox = this.requireSandbox(name);
    this.runDocker(["rm", "--force", sandbox.containerId]);
    this.sandboxes.delete(sandbox.name);
    return { id: sandbox.id, destroyed: true };
  }

  snapshot(name: string): { id: string; sandboxId: string; image: string } {
    const sandbox = this.requireSandbox(name);
    const snapshotId = `snapshot-${sandbox.name}-${Date.now().toString(36)}`;
    const image = this.runDocker(["commit", sandbox.containerId, `codeloop/${snapshotId}`], 120_000).trim();
    this.snapshots.set(snapshotId, { image: `codeloop/${snapshotId}`, sandboxId: sandbox.id });
    this.sandboxes.set(sandbox.name, { ...sandbox, snapshotId });
    return { id: snapshotId, sandboxId: sandbox.id, image: image || `codeloop/${snapshotId}` };
  }

  restore(name: string, snapshotId: string): SandboxRecord {
    const sandbox = this.requireSandbox(name);
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot || snapshot.sandboxId !== sandbox.id) throw new Error(`Snapshot '${snapshotId}' is not available for sandbox '${sandbox.name}'.`);
    this.runDocker(["rm", "--force", sandbox.containerId]);
    this.sandboxes.delete(sandbox.name);
    return this.create(sandbox.name, snapshot.image);
  }

  cleanup(): void {
    for (const sandbox of this.sandboxes.values()) {
      if (sandbox.status === "running") {
        try { this.runDocker(["stop", sandbox.containerId]); } catch { /* Docker may already be unavailable during shutdown. */ }
      }
    }
  }

  private update(sandbox: SandboxRecord, status: SandboxStatus): SandboxRecord {
    const updated = { ...sandbox, status };
    this.sandboxes.set(sandbox.name, updated);
    return updated;
  }

  private requireSandbox(name: string): SandboxRecord {
    const safeName = validName(name);
    const sandbox = this.sandboxes.get(safeName);
    if (!sandbox) throw new Error(`Sandbox '${safeName}' is not registered.`);
    return sandbox;
  }

  private runDocker(args: readonly string[], timeoutMs = 30_000): string {
    try {
      return String(execFileSync(this.dockerCommand, [...args], { encoding: "utf8", timeout: timeoutMs, maxBuffer: MAX_OUTPUT }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Docker command failed: ${message}`);
    }
  }
}

function validName(value: string): string {
  const name = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/u.test(name)) throw new Error("Sandbox names must be 1 to 64 letters, numbers, dots, underscores, or hyphens.");
  return name;
}

function validImage(value: string): string {
  const image = value.trim();
  if (!image || image.length > 200 || /\s/u.test(image) || !/^[A-Za-z0-9][A-Za-z0-9._/:@-]*$/u.test(image)) throw new Error("Sandbox image is invalid.");
  return image;
}

function validCommand(value: string): string {
  const command = value.trim();
  if (!command || command.length > 2_000) throw new Error("Sandbox command must contain 1 to 2000 characters.");
  return command;
}
