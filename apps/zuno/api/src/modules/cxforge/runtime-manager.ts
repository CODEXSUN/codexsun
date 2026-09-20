import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type CxforgeRuntimeAction = "build" | "install" | "restart" | "start" | "stop";

export interface CxforgeRuntimeStatus {
  readonly composeFile: string;
  readonly composeVersion?: string;
  readonly container: {
    readonly health?: string;
    readonly id?: string;
    readonly image?: string;
    readonly installed: boolean;
    readonly name: string;
    readonly running: boolean;
    readonly state: "absent" | "exited" | "running" | "unavailable";
  };
  readonly dockerAvailable: boolean;
  readonly dockerVersion?: string;
  readonly projectName: string;
  readonly toolchain: Record<"git" | "go" | "node" | "npm" | "python", string | undefined>;
}

interface CommandResult {
  readonly stderr: string;
  readonly stdout: string;
}

export type RuntimeCommandRunner = (command: string, args: readonly string[], options: { readonly cwd: string; readonly timeoutMs: number }) => Promise<CommandResult>;

interface RuntimeManagerOptions {
  readonly repositoryRoot: string;
  readonly run?: RuntimeCommandRunner;
}

export class CxforgeRuntimeManager {
  private readonly composeFile: string;
  private readonly composePath: string;
  private readonly containerName = "cxforge";
  private readonly projectName = "cxforgefresh";
  private readonly repositoryRoot: string;
  private readonly run: RuntimeCommandRunner;

  constructor(options: RuntimeManagerOptions) {
    this.repositoryRoot = options.repositoryRoot;
    this.composeFile = "apps/cxforge/.container/compose.yml";
    this.composePath = resolve(this.repositoryRoot, this.composeFile);
    this.run = options.run ?? runCommand;
  }

  async status(): Promise<CxforgeRuntimeStatus> {
    const dockerVersion = await this.tryDocker(["version", "--format", "{{.Server.Version}}"]);
    if (!dockerVersion) return this.unavailableStatus();
    const [composeVersion, inspection] = await Promise.all([
      this.tryDocker(["compose", "version", "--short"]),
      this.tryDocker(["inspect", "--format", "{{json .}}", this.containerName]),
    ]);
    if (!inspection) return this.availableStatus(dockerVersion, composeVersion);
    const container = parseInspection(inspection);
    const toolchain = container.running ? await this.readToolchain() : emptyToolchain();
    return { ...this.availableStatus(dockerVersion, composeVersion), container, toolchain };
  }

  async act(action: CxforgeRuntimeAction): Promise<CxforgeRuntimeStatus> {
    if (action === "install" || action === "start") await this.ensureNetwork();
    const args = actionArguments(action, this.projectName, this.composePath);
    await this.run("docker", args, { cwd: this.repositoryRoot, timeoutMs: action === "build" || action === "install" ? 10 * 60_000 : 2 * 60_000 });
    return this.status();
  }

  async logs(): Promise<string[]> {
    const result = await this.tryDocker(this.composeArguments("logs", "--tail", "100", "--no-color", this.containerName));
    return result ? result.split(/\r?\n/u).filter(Boolean) : [];
  }

  private async ensureNetwork(): Promise<void> {
    if (await this.tryDocker(["network", "inspect", "codexsun-network"])) return;
    await this.run("docker", ["network", "create", "codexsun-network"], { cwd: this.repositoryRoot, timeoutMs: 30_000 });
  }

  private async readToolchain(): Promise<CxforgeRuntimeStatus["toolchain"]> {
    const entries = await Promise.all([
      this.toolVersion("go", "go", "version"),
      this.toolVersion("node", "node", "--version"),
      this.toolVersion("npm", "npm", "--version"),
      this.toolVersion("python", "python3", "--version"),
      this.toolVersion("git", "git", "--version"),
    ] as const);
    return Object.fromEntries(entries) as CxforgeRuntimeStatus["toolchain"];
  }

  private async toolVersion(key: keyof CxforgeRuntimeStatus["toolchain"], command: string, ...args: string[]): Promise<readonly [typeof key, string | undefined]> {
    return [key, await this.tryDocker(["exec", this.containerName, command, ...args])];
  }

  private composeArguments(...args: string[]): string[] {
    return ["compose", "-p", this.projectName, "-f", this.composePath, ...args];
  }

  private async tryDocker(args: readonly string[]): Promise<string | undefined> {
    try {
      const result = await this.run("docker", args, { cwd: this.repositoryRoot, timeoutMs: 30_000 });
      return result.stdout.trim() || result.stderr.trim() || undefined;
    } catch {
      return undefined;
    }
  }

  private availableStatus(dockerVersion: string, composeVersion?: string): CxforgeRuntimeStatus {
    return { composeFile: this.composeFile, composeVersion, container: absentContainer(this.containerName), dockerAvailable: true, dockerVersion, projectName: this.projectName, toolchain: emptyToolchain() };
  }

  private unavailableStatus(): CxforgeRuntimeStatus {
    return { composeFile: this.composeFile, container: { ...absentContainer(this.containerName), state: "unavailable" }, dockerAvailable: false, projectName: this.projectName, toolchain: emptyToolchain() };
  }
}

function actionArguments(action: CxforgeRuntimeAction, projectName: string, composePath: string): string[] {
  const compose = ["compose", "-p", projectName, "-f", composePath];
  if (action === "install") return [...compose, "up", "-d", "--build"];
  if (action === "start") return [...compose, "up", "-d"];
  if (action === "build") return [...compose, "build"];
  return [...compose, action, "cxforge"];
}

function parseInspection(value: string): CxforgeRuntimeStatus["container"] {
  const inspection = JSON.parse(value) as { Config?: { Image?: string }; Id?: string; Name?: string; State?: { Health?: { Status?: string }; Running?: boolean; Status?: string } };
  const running = inspection.State?.Running === true;
  return {
    health: inspection.State?.Health?.Status,
    id: inspection.Id?.slice(0, 12),
    image: inspection.Config?.Image,
    installed: true,
    name: inspection.Name?.replace(/^\//u, "") || "cxforge",
    running,
    state: running ? "running" : "exited",
  };
}

function absentContainer(name: string): CxforgeRuntimeStatus["container"] {
  return { installed: false, name, running: false, state: "absent" };
}

function emptyToolchain(): CxforgeRuntimeStatus["toolchain"] {
  return { git: undefined, go: undefined, node: undefined, npm: undefined, python: undefined };
}

async function runCommand(command: string, args: readonly string[], options: { readonly cwd: string; readonly timeoutMs: number }): Promise<CommandResult> {
  const result = await execFileAsync(command, [...args], { cwd: options.cwd, maxBuffer: 4 * 1024 * 1024, timeout: options.timeoutMs, windowsHide: true });
  return { stderr: result.stderr, stdout: result.stdout };
}
