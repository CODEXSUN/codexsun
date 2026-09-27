import { copyFile, lstat, mkdir, readdir, readFile, realpath, rename, rm, writeFile } from "node:fs/promises";
import { basename, extname, relative, resolve, sep } from "node:path";

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 1000;
const MAX_BYTES = 200_000;
const SKIPPED_DIRECTORIES = new Set([".git", "node_modules", "dist", "dist.vite", "storage"]);
const SENSITIVE_EXTENSIONS = new Set([".db", ".sqlite", ".sqlite3", ".pem", ".key", ".p12"]);

export type SandboxMode = "read-only" | "read-write";
export type WorkspaceEntry = { path: string; kind: "file" | "directory"; size: number; modifiedAt: string };
export type FileEdit = { search: string; replace: string; expectedMatches?: number };

export class WorkspaceToolError extends Error {
  constructor(readonly statusCode: 400 | 403 | 404 | 409, message: string) { super(message); this.name = "WorkspaceToolError"; }
}

export class FilesystemTools {
  readonly root: string;
  constructor(root: string, private readonly mode: SandboxMode = "read-only") { this.root = resolve(root); }

  capabilities() {
    return { mode: this.mode, mutationEnabled: this.mode === "read-write", tools: ["fs.read", "fs.write", "fs.edit", "fs.patch", "fs.delete", "fs.move", "fs.copy", "fs.list", "fs.search", "fs.exists"] } as const;
  }

  async list(path = ".", recursive = true, limit = DEFAULT_LIMIT): Promise<{ root: string; items: WorkspaceEntry[]; truncated: boolean }> {
    const target = await this.resolveExisting(path);
    if (!(await lstat(target)).isDirectory()) throw new WorkspaceToolError(400, "The workspace path is not a directory.");
    const items: WorkspaceEntry[] = [];
    let truncated = false;
    const visit = async (directory: string): Promise<void> => {
      for (const item of await readdir(directory, { withFileTypes: true })) {
        if (items.length >= clamp(limit, 1, MAX_LIMIT)) { truncated = true; return; }
        if (item.isSymbolicLink() || (item.isDirectory() && SKIPPED_DIRECTORIES.has(item.name))) continue;
        const absolute = resolve(directory, item.name);
        const publicPath = this.publicPath(absolute);
        if (this.isSensitive(publicPath)) continue;
        const info = await lstat(absolute);
        if (!info.isFile() && !info.isDirectory()) continue;
        items.push({ path: publicPath, kind: info.isDirectory() ? "directory" : "file", size: info.isFile() ? info.size : 0, modifiedAt: info.mtime.toISOString() });
        if (recursive && info.isDirectory()) await visit(absolute);
        if (truncated) return;
      }
    };
    await visit(target);
    return { root: this.publicPath(target), items, truncated };
  }

  async stat(path: string): Promise<WorkspaceEntry> {
    const publicPath = this.assertReadablePath(path);
    const absolute = await this.resolveExisting(publicPath);
    return this.entry(publicPath, await lstat(absolute));
  }

  async read(path: string, maxBytes = MAX_BYTES): Promise<WorkspaceEntry & { content: string; truncated: boolean }> {
    const publicPath = this.assertReadablePath(path);
    const absolute = await this.resolveExisting(publicPath);
    const info = await lstat(absolute);
    if (!info.isFile()) throw new WorkspaceToolError(400, "The workspace path is not a file.");
    const content = await readFile(absolute, "utf8");
    if (content.includes("\u0000")) throw new WorkspaceToolError(400, "Binary files are not readable as text.");
    const boundedBytes = clamp(maxBytes, 1, MAX_BYTES);
    return { path: publicPath, kind: "file", size: info.size, modifiedAt: info.mtime.toISOString(), content: content.slice(0, boundedBytes), truncated: Buffer.byteLength(content) > boundedBytes };
  }

  async write(path: string, content: string, overwrite = true): Promise<WorkspaceEntry> {
    this.requireMutation();
    const publicPath = this.assertWritablePath(path);
    if (Buffer.byteLength(content, "utf8") > MAX_BYTES) throw new WorkspaceToolError(400, `File content exceeds ${MAX_BYTES} bytes.`);
    const absolute = await this.resolveForWrite(publicPath);
    if (!overwrite && await this.existsAt(absolute)) throw new WorkspaceToolError(409, "The destination file already exists.");
    await mkdir(resolve(absolute, ".."), { recursive: true });
    await writeFile(absolute, content, "utf8");
    return this.entry(publicPath, await lstat(absolute));
  }

  async edit(path: string, edits: readonly FileEdit[]): Promise<WorkspaceEntry> {
    this.requireMutation();
    if (!edits.length || edits.length > 50) throw new WorkspaceToolError(400, "Provide between 1 and 50 edits.");
    const current = await this.read(path);
    return this.write(current.path, applyEdits(current.content, edits));
  }

  async patch(patches: readonly { path: string; edits: readonly FileEdit[] }[]): Promise<WorkspaceEntry[]> {
    this.requireMutation();
    if (!patches.length || patches.length > 50) throw new WorkspaceToolError(400, "Provide between 1 and 50 file patches.");
    const results: WorkspaceEntry[] = [];
    for (const patch of patches) results.push(await this.edit(patch.path, patch.edits));
    return results;
  }

  async remove(path: string, recursive = false, confirm = false): Promise<{ path: string; deleted: true }> {
    this.requireMutation();
    if (!confirm) throw new WorkspaceToolError(400, "Deletion requires confirm=true.");
    const publicPath = this.assertWritablePath(path);
    const absolute = await this.resolveExisting(publicPath);
    const info = await lstat(absolute);
    if (info.isDirectory() && !recursive) throw new WorkspaceToolError(400, "Directory deletion requires recursive=true.");
    await rm(absolute, { recursive, force: false });
    return { path: publicPath, deleted: true };
  }

  async move(source: string, destination: string, overwrite = false): Promise<WorkspaceEntry> {
    this.requireMutation();
    const sourcePath = this.assertWritablePath(source);
    const destinationPath = this.assertWritablePath(destination);
    const sourceAbsolute = await this.resolveExisting(sourcePath);
    const destinationAbsolute = await this.resolveForWrite(destinationPath);
    this.assertNotNested(sourceAbsolute, destinationAbsolute);
    if (!overwrite && await this.existsAt(destinationAbsolute)) throw new WorkspaceToolError(409, "The destination already exists.");
    await mkdir(resolve(destinationAbsolute, ".."), { recursive: true });
    if (overwrite) await rm(destinationAbsolute, { recursive: true, force: true });
    await rename(sourceAbsolute, destinationAbsolute);
    return this.entry(destinationPath, await lstat(destinationAbsolute));
  }

  async copy(source: string, destination: string, overwrite = false): Promise<WorkspaceEntry> {
    this.requireMutation();
    const sourcePath = this.assertReadablePath(source);
    const destinationPath = this.assertWritablePath(destination);
    const sourceAbsolute = await this.resolveExisting(sourcePath);
    const destinationAbsolute = await this.resolveForWrite(destinationPath);
    this.assertNotNested(sourceAbsolute, destinationAbsolute);
    if (!overwrite && await this.existsAt(destinationAbsolute)) throw new WorkspaceToolError(409, "The destination already exists.");
    const sourceInfo = await lstat(sourceAbsolute);
    await mkdir(resolve(destinationAbsolute, ".."), { recursive: true });
    if (sourceInfo.isDirectory()) await this.copyDirectory(sourceAbsolute, destinationAbsolute, overwrite);
    else { if (overwrite) await rm(destinationAbsolute, { force: true }); await copyFile(sourceAbsolute, destinationAbsolute); }
    return this.entry(destinationPath, await lstat(destinationAbsolute));
  }

  async search(query: string, path = ".", caseSensitive = false, limit = DEFAULT_LIMIT): Promise<{ matches: { path: string; line: number; text: string }[]; truncated: boolean }> {
    if (!query || query.length > 500) throw new WorkspaceToolError(400, "Search text must contain 1 to 500 characters.");
    const listing = await this.list(path, true, MAX_LIMIT);
    const needle = caseSensitive ? query : query.toLowerCase();
    const matches: { path: string; line: number; text: string }[] = [];
    let truncated = listing.truncated;
    for (const item of listing.items.filter((entry) => entry.kind === "file")) {
      const file = await this.read(item.path).catch(() => undefined);
      if (!file) continue;
      for (const [index, line] of file.content.split(/\r?\n/u).entries()) {
        if ((caseSensitive ? line : line.toLowerCase()).includes(needle)) matches.push({ path: item.path, line: index + 1, text: line.slice(0, 1000) });
        if (matches.length >= clamp(limit, 1, MAX_LIMIT)) { truncated = true; break; }
      }
      if (matches.length >= clamp(limit, 1, MAX_LIMIT)) break;
    }
    return { matches, truncated };
  }

  async exists(path: string): Promise<{ path: string; exists: boolean }> {
    const publicPath = this.normalizedPath(path);
    if (this.isSensitive(publicPath)) return { path: publicPath, exists: false };
    try { await this.resolveExisting(publicPath); return { path: publicPath, exists: true }; }
    catch (error) { if (error instanceof WorkspaceToolError && error.statusCode === 404) return { path: publicPath, exists: false }; throw error; }
  }

  private async copyDirectory(source: string, destination: string, overwrite: boolean): Promise<void> {
    await mkdir(destination, { recursive: true });
    for (const item of await readdir(source, { withFileTypes: true })) {
      if (item.isSymbolicLink() || SKIPPED_DIRECTORIES.has(item.name) || this.isSensitive(item.name)) continue;
      const sourceChild = resolve(source, item.name);
      const destinationChild = resolve(destination, item.name);
      if (item.isDirectory()) await this.copyDirectory(sourceChild, destinationChild, overwrite);
      else { if (overwrite) await rm(destinationChild, { force: true }); await copyFile(sourceChild, destinationChild); }
    }
  }

  private async resolveExisting(path: string): Promise<string> {
    const candidate = resolve(this.root, this.normalizedPath(path));
    try {
      const root = await realpath(this.root);
      await this.assertNoSymlinks(resolve(this.root, this.normalizedPath(path)));
      const resolved = await realpath(candidate);
      this.assertInside(root, resolved);
      if ((await lstat(resolved)).isSymbolicLink()) throw new WorkspaceToolError(403, "Symlinked workspace entries are unavailable.");
      return resolved;
    } catch (error) {
      if (error instanceof WorkspaceToolError) throw error;
      throw new WorkspaceToolError(404, "Workspace path not found.");
    }
  }

  private async resolveForWrite(path: string): Promise<string> {
    const candidate = resolve(this.root, path);
    const root = await realpath(this.root).catch(() => { throw new WorkspaceToolError(404, "Workspace root not found."); });
    let parent = resolve(candidate, "..");
    while (!(await this.existsAt(parent))) {
      const next = resolve(parent, "..");
      if (next === parent) throw new WorkspaceToolError(404, "Workspace parent directory not found.");
      parent = next;
    }
    const resolvedParent = await realpath(parent).catch(() => { throw new WorkspaceToolError(404, "Workspace parent directory not found."); });
    this.assertInside(root, resolvedParent);
    await this.assertNoSymlinks(resolve(this.root, path));
    if (await this.existsAt(candidate) && (await lstat(candidate)).isSymbolicLink()) throw new WorkspaceToolError(403, "Symlinked workspace entries are unavailable.");
    return resolve(resolvedParent, relative(parent, candidate));
  }

  private async assertNoSymlinks(candidate: string): Promise<void> {
    const root = await realpath(this.root);
    const parts = relative(root, candidate).split(sep).filter(Boolean);
    let current = root;
    for (const part of parts) {
      current = resolve(current, part);
      try { if ((await lstat(current)).isSymbolicLink()) throw new WorkspaceToolError(403, "Symlinked workspace entries are unavailable."); }
      catch (error) { if (error instanceof WorkspaceToolError) throw error; if ((error as NodeJS.ErrnoException).code === "ENOENT") break; throw error; }
    }
  }

  private async existsAt(path: string): Promise<boolean> { try { await lstat(path); return true; } catch { return false; } }
  private async entry(path: string, info: { isDirectory(): boolean; size: number; mtime: Date }): Promise<WorkspaceEntry> { return { path, kind: info.isDirectory() ? "directory" : "file", size: info.isDirectory() ? 0 : info.size, modifiedAt: info.mtime.toISOString() }; }
  private requireMutation(): void { if (this.mode !== "read-write") throw new WorkspaceToolError(403, "Filesystem mutations are disabled by the CodeLoop sandbox."); }
  private assertReadablePath(path: string): string { const normalized = this.normalizedPath(path); if (this.isSensitive(normalized)) throw new WorkspaceToolError(403, "Sensitive workspace paths are unavailable."); return normalized; }
  private assertWritablePath(path: string): string { const normalized = this.assertReadablePath(path); if (normalized === ".") throw new WorkspaceToolError(403, "The workspace root cannot be modified directly."); return normalized; }
  private normalizedPath(path: string): string { const candidate = resolve(this.root, (path || ".").replaceAll("\\", "/")); this.assertInside(this.root, candidate); return relative(this.root, candidate).replaceAll(sep, "/") || "."; }
  private publicPath(path: string): string { return relative(this.root, path).replaceAll(sep, "/") || "."; }
  private assertInside(root: string, candidate: string): void { if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) throw new WorkspaceToolError(403, "Workspace path is outside the configured root."); }
  private assertNotNested(source: string, destination: string): void { if (destination === source || destination.startsWith(`${source}${sep}`)) throw new WorkspaceToolError(400, "The destination cannot be inside the source."); }
  private isSensitive(path: string): boolean { const parts = path.split("/").filter(Boolean); if (parts.some((part) => SKIPPED_DIRECTORIES.has(part))) return true; const name = basename(path).toLowerCase(); if (name === ".env.example") return false; return name === ".env" || name.startsWith(".env.") || [".npmrc", ".pypirc", "credentials.json", "access-token"].includes(name) || SENSITIVE_EXTENSIONS.has(extname(name)); }
}

function applyEdits(content: string, edits: readonly FileEdit[]): string {
  let result = content;
  for (const edit of edits) {
    const expected = edit.expectedMatches ?? 1;
    const matches = result.split(edit.search).length - 1;
    if (!edit.search || matches !== expected) throw new WorkspaceToolError(409, `Edit expected ${expected} matches but found ${matches}.`);
    result = result.split(edit.search).join(edit.replace);
  }
  return result;
}

function clamp(value: number, minimum: number, maximum: number): number { return Math.min(Math.max(Number.isFinite(value) ? value : minimum, minimum), maximum); }
