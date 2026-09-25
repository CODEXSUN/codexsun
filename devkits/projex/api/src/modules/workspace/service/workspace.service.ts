import { existsSync, readFileSync, readdirSync } from "node:fs";
import { connect } from "node:net";
import { dirname, extname, join, relative, resolve } from "node:path";
import type { WorkspaceSnapshot } from "../contracts/workspace.contract.js";

type ApplicationManifest = {
  category: "business" | "devkit" | "platform";
  hosts: Array<{ defaultPort?: number; displayName: string; envKey: string; kind: "api" | "web" | "desktop" | "mobile"; target: string; workspace: string }>;
  id: string;
  label: string;
  mdi?: { localUrlKey?: string };
  owner: string;
  providers: string[];
};

type Environment = Record<string, string>;

export async function readWorkspaceSnapshot(startDirectory = process.cwd()): Promise<WorkspaceSnapshot> {
  const root = findRepositoryRoot(startDirectory);
  const manifests = readManifests(root);
  const baseEnvironment = readEnvironmentFile(join(root, ".env"));
  const projects = await Promise.all(manifests.map((manifest) => readProject(root, manifest, baseEnvironment)));
  const documentation = readAssistDocumentation(root);
  const allDocumentation = deduplicateDocumentation([...documentation, ...projects.flatMap((project) => project.documentation)]);
  const hosts = projects.flatMap((project) => project.hosts);

  return {
    generatedAt: new Date().toISOString(),
    projects,
    documentation: allDocumentation,
    summary: {
      configuredHosts: hosts.filter((host) => host.configured).length,
      documentationCount: allDocumentation.length,
      projectCount: projects.length,
      runningHosts: hosts.filter((host) => host.running).length,
    },
  };
}

async function readProject(root: string, manifest: ApplicationManifest, baseEnvironment: Environment) {
  const appEnvironment = readEnvironmentFile(join(root, manifest.owner, "api", ".app.env"));
  const webEnvironment = readEnvironmentFile(join(root, manifest.owner, "web", ".app.env"));
  const environment = { ...baseEnvironment, ...appEnvironment, ...webEnvironment };
  const hosts = await Promise.all(manifest.hosts.map((host) => readHost(root, manifest, host, environment)));
  const documentation = readProjectDocumentation(root, manifest.owner);
  const stage = projectStage(hosts);
  return { category: manifest.category, documentation, hosts, id: manifest.id, label: manifest.label, owner: manifest.owner, providers: manifest.providers, stage };
}

async function readHost(root: string, manifest: ApplicationManifest, host: ApplicationManifest["hosts"][number], environment: Environment) {
  const port = readPort(environment[host.envKey], host.defaultPort);
  const configured = existsSync(join(root, manifest.owner, host.kind, ".app.env"));
  const running = port ? await isPortOpen("127.0.0.1", port) : false;
  return {
    configured,
    envFile: toRepositoryPath(root, join(root, manifest.owner, host.kind, ".app.env")),
    kind: host.kind,
    port,
    running,
    stage: hostStage(configured, running),
    target: host.target,
    url: `http://127.0.0.1:${port}`,
    workspace: host.workspace,
  };
}

function readManifests(root: string): ApplicationManifest[] {
  const directory = join(root, "core", "registry", "applications");
  return readdirSync(directory)
    .filter((file) => extname(file) === ".json")
    .map((file) => JSON.parse(readFileSync(join(directory, file), "utf8")) as ApplicationManifest)
    .sort((left, right) => left.label.localeCompare(right.label));
}

function readProjectDocumentation(root: string, owner: string) {
  const ownerRoot = join(root, owner);
  const files = [join(ownerRoot, "README.md"), ...readMarkdownFiles(join(ownerRoot, "agent"))];
  return files.filter((file) => existsSync(file)).map((file) => ({ path: toRepositoryPath(root, file), scope: "application" as const, title: readTitle(file) }));
}

function readAssistDocumentation(root: string) {
  const directories = ["assist", join("assist", "architecture"), join("assist", "execution"), join("assist", "operations")];
  return directories.flatMap((directory) => readMarkdownFiles(join(root, directory))).map((file) => ({ path: toRepositoryPath(root, file), scope: "assist" as const, title: readTitle(file) }));
}

function readTitle(path: string): string {
  const title = readFileSync(path, "utf8").match(/^#\s+(.+)$/mu)?.[1]?.trim();
  return title ?? path.split(/[\\/]/u).at(-1)?.replace(/\.md$/u, "") ?? "Untitled document";
}

function readMarkdownFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return readMarkdownFiles(path);
    return entry.isFile() && extname(entry.name) === ".md" ? [path] : [];
  });
}

function readEnvironmentFile(path: string): Environment {
  if (!existsSync(path)) return {};
  return Object.fromEntries(readFileSync(path, "utf8").split(/\r?\n/u).flatMap((line) => {
    const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/u);
    return match ? [[match[1].trim(), stripQuotes(match[2].trim())]] : [];
  }));
}

function stripQuotes(value: string): string {
  return value.length > 1 && ["\"", "'"].includes(value[0]) && value.at(-1) === value[0] ? value.slice(1, -1) : value;
}

function readPort(value: string | undefined, fallback: number | undefined): number {
  const port = Number(value ?? fallback);
  return Number.isInteger(port) && port > 0 && port <= 65_535 ? port : 0;
}

function hostStage(configured: boolean, running: boolean): "registered" | "configured" | "running" {
  return running ? "running" : configured ? "configured" : "registered";
}

function projectStage(hosts: Array<{ stage: "registered" | "configured" | "running" }>): "registered" | "configured" | "running" {
  if (hosts.some((host) => host.stage === "running")) return "running";
  if (hosts.some((host) => host.stage === "configured")) return "configured";
  return "registered";
}

function isPortOpen(host: string, port: number): Promise<boolean> {
  return new Promise((resolvePort) => {
    const socket = connect({ host, port });
    const finish = (open: boolean) => { socket.destroy(); resolvePort(open); };
    socket.setTimeout(120, () => finish(false));
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
  });
}

function findRepositoryRoot(startDirectory: string): string {
  let directory = resolve(startDirectory);
  while (directory !== dirname(directory)) {
    if (existsSync(join(directory, "core", "registry", "applications"))) return directory;
    directory = dirname(directory);
  }
  throw new Error("Could not find the CODEXSUN repository root.");
}

function toRepositoryPath(root: string, path: string): string {
  return relative(root, path).replaceAll("\\", "/");
}

function deduplicateDocumentation(items: WorkspaceSnapshot["documentation"]): WorkspaceSnapshot["documentation"] {
  return [...new Map(items.map((item) => [item.path, item])).values()].sort((left, right) => left.path.localeCompare(right.path));
}
