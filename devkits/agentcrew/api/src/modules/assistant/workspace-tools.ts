import { lstat, readdir, readFile, realpath } from "node:fs/promises";
import { basename, extname, relative, resolve, sep } from "node:path";

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 1000;
const MAX_READ_BYTES = 200_000;
const SKIPPED_DIRECTORIES = new Set([".git", "node_modules", "dist", "dist.vite", "storage"]);

export type WorkspaceEntry = {
  path: string;
  kind: "file" | "directory";
  size: number;
  modifiedAt: string;
};

export type WorkspaceListing = {
  root: string;
  items: WorkspaceEntry[];
  truncated: boolean;
};

export type WorkspaceFile = WorkspaceEntry & { content: string; truncated: boolean };

export class WorkspaceTools {
  readonly root: string;

  constructor(root: string) {
    this.root = resolve(root);
  }

  async list(path = "", recursive = true, limit = DEFAULT_LIMIT): Promise<WorkspaceListing> {
    const boundedLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
    const target = await this.safePath(path);
    const targetInfo = await lstat(target);
    if (!targetInfo.isDirectory()) throw new Error("Workspace path is not a directory.");

    const items: WorkspaceEntry[] = [];
    let truncated = false;
    const visit = async (directory: string): Promise<void> => {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        if (items.length >= boundedLimit) {
          truncated = true;
          return;
        }
        if (entry.isSymbolicLink() || (entry.isDirectory() && SKIPPED_DIRECTORIES.has(entry.name))) continue;
        const absolute = resolve(directory, entry.name);
        const itemPath = this.publicPath(absolute);
        if (this.isSensitive(itemPath)) continue;
        const info = await lstat(absolute);
        if (!info.isFile() && !info.isDirectory()) continue;
        items.push({
          path: itemPath,
          kind: info.isDirectory() ? "directory" : "file",
          size: info.isFile() ? info.size : 0,
          modifiedAt: info.mtime.toISOString(),
        });
        if (recursive && info.isDirectory()) await visit(absolute);
        if (truncated) return;
      }
    };
    await visit(target);
    return { root: this.publicPath(target), items, truncated };
  }

  async read(path: string, maxBytes = MAX_READ_BYTES): Promise<WorkspaceFile> {
    const boundedBytes = Math.min(Math.max(maxBytes, 1), MAX_READ_BYTES);
    const publicPath = this.normalizedPath(path);
    this.assertReadable(publicPath);
    const absolute = await this.safePath(publicPath);
    const info = await lstat(absolute);
    if (!info.isFile()) throw new Error("Workspace path is not a file.");
    const content = await readFile(absolute, { encoding: "utf8", flag: "r" });
    if (content.includes("\u0000")) throw new Error("Binary files are not readable.");
    return {
      path: publicPath,
      kind: "file",
      size: info.size,
      modifiedAt: info.mtime.toISOString(),
      content: content.slice(0, boundedBytes),
      truncated: Buffer.byteLength(content, "utf8") > boundedBytes,
    };
  }

  async stat(path: string): Promise<WorkspaceEntry> {
    const publicPath = this.normalizedPath(path);
    this.assertReadable(publicPath);
    const absolute = await this.safePath(publicPath);
    const info = await lstat(absolute);
    if (!info.isFile() && !info.isDirectory()) throw new Error("Unsupported workspace entry.");
    return {
      path: publicPath,
      kind: info.isDirectory() ? "directory" : "file",
      size: info.isFile() ? info.size : 0,
      modifiedAt: info.mtime.toISOString(),
    };
  }

  private async safePath(input: string): Promise<string> {
    const candidate = resolve(this.root, this.normalizedPath(input));
    const resolvedRoot = await realpath(this.root);
    const resolvedCandidate = await realpath(candidate);
    if (resolvedCandidate !== resolvedRoot && !resolvedCandidate.startsWith(`${resolvedRoot}${sep}`))
      throw new Error("Workspace path is outside the configured root.");
    return resolvedCandidate;
  }

  private normalizedPath(input: string): string {
    if (!input || input === ".") return ".";
    const normalized = input.replaceAll("\\", "/").replace(/^\/+/, "");
    const candidate = resolve(this.root, normalized);
    if (candidate !== this.root && !candidate.startsWith(`${this.root}${sep}`))
      throw new Error("Workspace path is outside the configured root.");
    return relative(this.root, candidate) || ".";
  }

  private publicPath(absolute: string): string {
    const value = relative(this.root, absolute).replaceAll(sep, "/");
    return value || ".";
  }

  private assertReadable(path: string): void {
    if (this.isSensitive(path)) throw new Error("Sensitive workspace files are not readable.");
  }

  private isSensitive(path: string): boolean {
    const parts = path.split("/").filter(Boolean);
    if (parts.some((part) => SKIPPED_DIRECTORIES.has(part))) return true;
    const name = basename(path).toLowerCase();
    if (name === ".env.example") return false;
    if (name === ".env" || name.startsWith(".env.")) return true;
    return [".npmrc", ".pypirc", "access-token", "credentials.json"].includes(name) ||
      [".sqlite", ".sqlite3", ".db", ".pem", ".key", ".p12"].includes(extname(name));
  }
}
