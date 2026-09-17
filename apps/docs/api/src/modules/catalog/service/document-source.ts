import { readFileSync, readdirSync, statSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
export interface DiscoveredDocument {
  readonly content: string;
  readonly extension: "md" | "mdx";
  readonly path: string;
  readonly sourceMtimeMs: number;
  readonly sourceSize: number;
}
export function discoverDocuments(repositoryRoot: string): DiscoveredDocument[] {
  const root = resolve(repositoryRoot);
  const paths = new Set<string>();
  addFile(root, "README.md", paths);
  addMarkdownFiles(root, "assist", paths);
  addMarkdownFiles(root, "deployment", paths);
  addReadmes(root, "apps", paths);
  addReadmes(root, "packages", paths);
  addMarkdownFiles(root, "apps/docs/content", paths, true);
  return [...paths].sort().map((path) => readDocument(root, path));
}
function addReadmes(root: string, directory: string, paths: Set<string>): void {
  visit(resolveInsideRoot(root, directory), (path, name) => {
    if (name.toLowerCase() === "readme.md") paths.add(path);
  });
}
function addMarkdownFiles(root: string, directory: string, paths: Set<string>, allowMdx = false): void {
  visit(resolveInsideRoot(root, directory), (path) => {
    if (path.endsWith(".md") || (allowMdx && path.endsWith(".mdx"))) paths.add(path);
  });
}
function addFile(root: string, path: string, paths: Set<string>): void {
  const fullPath = resolveInsideRoot(root, path);
  try {
    if (statSync(fullPath).isFile()) paths.add(fullPath);
  } catch {
    return;
  }
}
function visit(directory: string, onFile: (path: string, name: string) => void): void {
  try {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink() || excludedNames.has(entry.name)) continue;
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) visit(path, onFile);
      if (entry.isFile()) onFile(path, entry.name);
    }
  } catch {
    return;
  }
}
function readDocument(root: string, path: string): DiscoveredDocument {
  const checkedPath = resolveInsideRoot(root, path);
  const stat = statSync(checkedPath);
  return {
    content: readFileSync(checkedPath, "utf8"),
    extension: checkedPath.endsWith(".mdx") ? "mdx" : "md",
    path: relative(root, checkedPath).split(sep).join("/"),
    sourceMtimeMs: Math.floor(stat.mtimeMs),
    sourceSize: stat.size,
  };
}
export function resolveInsideRoot(root: string, target: string): string {
  const resolvedRoot = resolve(root);
  const resolvedTarget = resolve(resolvedRoot, target);
  const path = relative(resolvedRoot, resolvedTarget);
  if (isAbsolute(path) || path === ".." || path.startsWith(`..${sep}`))
    throw new Error(`Docs path is outside the repository root: ${target}`);
  return resolvedTarget;
}
const excludedNames = new Set([".git", "dist", "node_modules", "storage"]);
