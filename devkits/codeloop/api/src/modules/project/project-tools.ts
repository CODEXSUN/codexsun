import { readFile, readdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { basename, extname, join, normalize, relative, resolve } from "node:path";

export type ProjectNodeType = "project" | "app" | "package" | "component" | "service" | "api" | "database" | "test" | "config" | "docker" | "documentation";
export type ProjectGraphNode = { id: string; type: ProjectNodeType; name: string; path?: string; metadata?: Record<string, unknown> };
export type ProjectGraph = { generatedAt: string; root: string; truncated: boolean; files: string[]; nodes: ProjectGraphNode[]; relationships: { from: string; to: string; type: string }[] };

const MAX_FILES = 5_000;
const ignored = new Set([".git", "node_modules", "dist", "build", ".turbo", "coverage", ".cache"]);

export class ProjectTools {
  private cached?: ProjectGraph;

  constructor(private readonly root: string) {}

  capabilities() {
    return { root: normalize(resolve(this.root)), tools: ["project.scan", "project.index", "project.structure", "project.dependencies", "project.conventions", "project.architecture"] as const };
  }

  async scan(refresh = false): Promise<ProjectGraph & { summary: Record<string, unknown> }> {
    const graph = await this.index(refresh);
    return { ...graph, summary: this.summary(graph) };
  }

  async index(refresh = false): Promise<ProjectGraph> {
    if (this.cached && !refresh) return this.cached;
    const filesResult = await collectFiles(resolve(this.root));
    const nodes: ProjectGraphNode[] = [{ id: "project:root", type: "project", name: basename(resolve(this.root)), path: "." }];
    const relationships: ProjectGraph["relationships"] = [];
    for (const file of filesResult.files) {
      const type = classify(file);
      if (!type) continue;
      const id = `${type}:${file}`;
      nodes.push({ id, type, name: basename(file), path: file });
      relationships.push({ from: "project:root", to: id, type: "contains" });
    }
    this.cached = { generatedAt: new Date().toISOString(), root: resolve(this.root), truncated: filesResult.truncated, files: filesResult.files, nodes, relationships };
    return this.cached;
  }

  async structure(refresh = false) {
    const graph = await this.index(refresh);
    return { root: graph.root, truncated: graph.truncated, tree: buildTree(graph.files) };
  }

  async dependencies(refresh = false) {
    const graph = await this.index(refresh);
    const manifests = await Promise.all(graph.files.filter((file) => basename(file) === "package.json").slice(0, 100).map(async (file) => ({ path: file, manifest: await readJson(join(resolve(this.root), file)) })));
    const packageNames = manifests.flatMap(({ path, manifest }) => manifest?.name ? [{ name: String(manifest.name), path }] : []);
    const dependencies = manifests.flatMap(({ path, manifest }) => Object.entries({ ...asRecord(manifest?.dependencies), ...asRecord(manifest?.devDependencies) }).map(([name, version]) => ({ name, version: String(version), path })));
    return { packageManager: detectPackageManager(resolve(this.root)), packages: packageNames, dependencies, manifests: manifests.map(({ path }) => path), truncated: graph.truncated };
  }

  async conventions(refresh = false) {
    const graph = await this.index(refresh);
    const files = graph.files;
    const extensionCounts = files.reduce<Record<string, number>>((counts, file) => { const extension = extname(file) || "[no extension]"; counts[extension] = (counts[extension] ?? 0) + 1; return counts; }, {});
    return { packageManager: detectPackageManager(resolve(this.root)), sourceExtensions: extensionCounts, scripts: await projectScripts(resolve(this.root)), configFiles: files.filter((file) => /(^|\/)(tsconfig[^/]*|vite\.config\.|eslint\.config\.|tailwind\.config\.|components\.json|\.env\.example)/u.test(file)), testPaths: files.filter((file) => /(^|\/)(test|tests|__tests__|.*\.(test|spec)\.)/u.test(file)).slice(0, 200), documentation: files.filter((file) => /(^|\/)(README|CONTRIBUTING|AGENTS)\.?/iu.test(file)).slice(0, 100) };
  }

  async architecture(refresh = false) {
    const graph = await this.index(refresh);
    return { nodes: graph.nodes, relationships: graph.relationships, groups: groupNodes(graph.nodes) };
  }

  private summary(graph: ProjectGraph) {
    return { fileCount: graph.files.length, nodeCount: graph.nodes.length, relationshipCount: graph.relationships.length, truncated: graph.truncated, nodeTypes: graph.nodes.reduce<Record<string, number>>((counts, node) => { counts[node.type] = (counts[node.type] ?? 0) + 1; return counts; }, {}) };
  }
}

async function collectFiles(root: string): Promise<{ files: string[]; truncated: boolean }> {
  const files: string[] = [];
  let truncated = false;
  async function visit(directory: string): Promise<void> {
    if (files.length >= MAX_FILES) { truncated = true; return; }
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (ignored.has(entry.name)) continue;
      const absolute = join(directory, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else if (entry.isFile()) files.push(relative(root, absolute).replaceAll("\\", "/"));
      if (files.length >= MAX_FILES) { truncated = true; return; }
    }
  }
  await visit(root);
  return { files: files.sort(), truncated };
}

function classify(file: string): ProjectNodeType | undefined {
  const lower = file.toLowerCase();
  if (basename(file) === "package.json" || /(^|\/)(tsconfig|vite\.config|eslint\.config|tailwind\.config|components\.json|\.env)/u.test(lower)) return "config";
  if (/dockerfile|(^|\/)docker-compose\.|(^|\/)\.docker\//u.test(lower)) return "docker";
  if (/readme|contributing|agents\.md|docs?\//u.test(lower)) return "documentation";
  if (/(^|\/)(test|tests|__tests__)\/|\.(test|spec)\./u.test(lower)) return "test";
  if (/(^|\/)(route|routes|api)\//u.test(lower) || /(^|\/)(server|router)\./u.test(lower)) return "api";
  if (/(^|\/)(database|db|migrations?|seeders?)\//u.test(lower) || /\.(sqlite|sql)$/u.test(lower)) return "database";
  if (/(^|\/)(components?|ui)\//u.test(lower) || /\.(tsx|jsx)$/u.test(lower)) return "component";
  if (/(^|\/)(services?|modules?|lib|core)\//u.test(lower)) return "service";
  if (/(^|\/)(apps?|packages?|devkits)\/[^/]+\//u.test(lower)) return "package";
  return undefined;
}

function buildTree(files: readonly string[]) {
  const root: { name: string; kind: "directory"; children: unknown[] } = { name: ".", kind: "directory", children: [] };
  for (const file of files.slice(0, 1_000)) {
    let current = root;
    const parts = file.split("/");
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const children = current.children as { name: string; kind: "directory" | "file"; children?: unknown[] }[];
      let child = children.find((item) => item.name === part);
      if (!child) { child = { name: part, kind: isFile ? "file" : "directory", ...(isFile ? {} : { children: [] }) }; children.push(child); }
      if (!isFile) current = child as typeof current;
    });
  }
  return root;
}

async function readJson(path: string): Promise<Record<string, unknown> | undefined> { try { return JSON.parse(await readFile(path, "utf8")) as Record<string, unknown>; } catch { return undefined; } }
async function projectScripts(root: string) { const manifest = await readJson(join(root, "package.json")); return asRecord(manifest?.scripts); }
function asRecord(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function detectPackageManager(root: string): string { try { const packageManager = String(asRecord(JSON.parse(readFileSync(join(root, "package.json"), "utf8"))).packageManager ?? ""); if (packageManager) return packageManager.split("@")[0]; } catch { /* Fall back to lockfile detection. */ } if (existsSync(join(root, "pnpm-lock.yaml"))) return "pnpm"; if (existsSync(join(root, "yarn.lock"))) return "yarn"; if (existsSync(join(root, "bun.lock")) || existsSync(join(root, "bun.lockb"))) return "bun"; return "npm"; }
function groupNodes(nodes: readonly ProjectGraphNode[]) { return nodes.reduce<Record<string, ProjectGraphNode[]>>((groups, node) => { (groups[node.type] ??= []).push(node); return groups; }, {}); }
