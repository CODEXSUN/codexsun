import { execFile as nodeExecFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { promisify } from "node:util";
import { isAbsolute, normalize, relative, resolve } from "node:path";

const execFile = promisify(nodeExecFile);
const MAX_OUTPUT = 1_000_000;
const MAX_TIMEOUT = 120_000;
export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";
export type DependencyCommandResult = { manager: PackageManager; cwd: string; command: string; exitCode: number; stdout: string; stderr: string; success: boolean };
export type PackageManifest = { name?: string; version?: string; private?: boolean; scripts?: Record<string, string>; dependencies?: Record<string, string>; devDependencies?: Record<string, string>; peerDependencies?: Record<string, string>; packageManager?: string };

export class DependencyTools {
  constructor(private readonly workspaceRoot: string) {}

  capabilities() {
    return { root: normalize(resolve(this.workspaceRoot)), managers: ["npm", "pnpm", "yarn", "bun"] as const, tools: ["package.install", "package.remove", "package.update", "package.inspect", "package.audit"] as const };
  }

  async install(packages: readonly string[] = [], manager?: PackageManager, workspace?: string, dev = false): Promise<DependencyCommandResult> {
    return this.run("install", packages, manager, workspace, dev);
  }

  async remove(packages: readonly string[], manager?: PackageManager, workspace?: string): Promise<DependencyCommandResult> {
    if (!packages.length) throw new Error("package.remove requires at least one package.");
    return this.run("remove", packages, manager, workspace);
  }

  async update(packages: readonly string[] = [], manager?: PackageManager, workspace?: string): Promise<DependencyCommandResult> {
    return this.run("update", packages, manager, workspace);
  }

  async inspect(workspace?: string, packageName?: string) {
    const cwd = this.resolveWorkspace(workspace);
    const manifest = JSON.parse(await readFile(resolve(cwd, "package.json"), "utf8")) as PackageManifest;
    const dependencies = { ...manifest.dependencies, ...manifest.devDependencies, ...manifest.peerDependencies };
    return { manager: this.detectManager(cwd), cwd, manifest, packageName: packageName?.trim() || undefined, declaredVersion: packageName ? dependencies[packageName] : undefined };
  }

  async audit(manager?: PackageManager, workspace?: string): Promise<DependencyCommandResult & { report?: unknown }> {
    const result = await this.run("audit", [], manager, workspace);
    let report: unknown;
    try { report = JSON.parse(result.stdout); } catch { report = undefined; }
    return { ...result, report };
  }

  private async run(operation: "install" | "remove" | "update" | "audit", packages: readonly string[], requestedManager?: PackageManager, workspace?: string, dev = false): Promise<DependencyCommandResult> {
    const cwd = this.resolveWorkspace(workspace);
    const manager = requestedManager ?? this.detectManager(cwd);
    const safePackages = packages.map(validPackageSpec);
    const args = commandArgs(operation, manager, safePackages, dev);
    const executable = process.platform === "win32" ? `${manager}.cmd` : manager;
    try {
      const result = await execFile(executable, args, { cwd, timeout: MAX_TIMEOUT, maxBuffer: MAX_OUTPUT, windowsHide: true });
      return { manager, cwd, command: [executable, ...args].join(" "), exitCode: 0, stdout: String(result.stdout), stderr: String(result.stderr), success: true };
    } catch (error) {
      const failure = error as { code?: number; stdout?: string; stderr?: string; killed?: boolean };
      return { manager, cwd, command: [executable, ...args].join(" "), exitCode: failure.killed ? 124 : Number(failure.code ?? 1), stdout: trimOutput(failure.stdout), stderr: trimOutput(failure.stderr || (failure.killed ? `Command timed out after ${MAX_TIMEOUT}ms.` : "Package command failed.")), success: false };
    }
  }

  private resolveWorkspace(workspace?: string): string {
    const root = normalize(resolve(this.workspaceRoot));
    const target = normalize(resolve(root, workspace || "."));
    const relativeTarget = relative(root, target);
    if (isAbsolute(relativeTarget) || relativeTarget === ".." || relativeTarget.startsWith("..\\") || relativeTarget.startsWith("../")) throw new Error("Package workspace is outside the CodeLoop workspace.");
    if (!existsSync(resolve(target, "package.json"))) throw new Error(`No package.json found in '${workspace || "."}'.`);
    return target;
  }

  private detectManager(cwd: string): PackageManager {
    const manifestPath = resolve(cwd, "package.json");
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as PackageManifest;
      const declared = manifest.packageManager?.split("@")[0];
      if (isPackageManager(declared)) return declared;
    } catch { /* Use lockfile detection. */ }
    if (existsSync(resolve(cwd, "pnpm-lock.yaml"))) return "pnpm";
    if (existsSync(resolve(cwd, "yarn.lock"))) return "yarn";
    if (existsSync(resolve(cwd, "bun.lockb")) || existsSync(resolve(cwd, "bun.lock"))) return "bun";
    return "npm";
  }
}

function commandArgs(operation: "install" | "remove" | "update" | "audit", manager: PackageManager, packages: readonly string[], dev: boolean): string[] {
  if (operation === "audit") return manager === "yarn" ? ["audit", "--json"] : ["audit", "--json"];
  if (manager === "npm") return [operation === "remove" ? "uninstall" : operation === "update" ? "update" : "install", ...(dev && operation === "install" ? ["--save-dev"] : []), ...packages];
  if (manager === "pnpm") return [operation === "remove" ? "remove" : operation === "update" ? "update" : "add", ...(dev && operation === "install" ? ["-D"] : []), ...packages];
  if (manager === "yarn") return [operation === "remove" ? "remove" : operation === "update" ? "upgrade" : "add", ...(dev && operation === "install" ? ["-D"] : []), ...packages];
  return [operation === "remove" ? "remove" : operation === "update" ? "update" : "add", ...(dev && operation === "install" ? ["-d"] : []), ...packages];
}

function validPackageSpec(value: string): string {
  if (!value || value.length > 200 || /[\s;&|`$<>]/u.test(value) || !/^[A-Za-z0-9@_./:+~^*-]+$/u.test(value)) throw new Error(`Invalid package specification '${value}'.`);
  return value;
}

function isPackageManager(value: string | undefined): value is PackageManager { return value === "npm" || value === "pnpm" || value === "yarn" || value === "bun"; }
function trimOutput(value: string | undefined): string { const output = value || ""; return output.length > MAX_OUTPUT ? `${output.slice(0, MAX_OUTPUT)}…` : output; }
