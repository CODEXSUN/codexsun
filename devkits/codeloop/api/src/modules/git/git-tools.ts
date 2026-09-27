import { spawnSync } from "node:child_process";
import { isAbsolute, normalize, relative, resolve, sep } from "node:path";

const MAX_OUTPUT = 1_000_000;
const branchPattern = /^[A-Za-z0-9._/-]+$/u;

export class GitToolError extends Error {
  constructor(readonly statusCode: 400 | 403 | 404 | 409 | 500, message: string) { super(message); this.name = "GitToolError"; }
}

type Checkpoint = { id: string; head: string; stashRef?: string; createdAt: string };

export class GitTools {
  readonly root: string;
  private readonly checkpoints = new Map<string, Checkpoint>();

  constructor(root: string, private readonly mutationEnabled = false) { this.root = normalize(resolve(root)); }

  capabilities() {
    return {
      root: this.root,
      mutationEnabled: this.mutationEnabled,
      tools: ["git.status", "git.diff", "git.log", "git.branch", "git.checkout", "git.add", "git.commit", "git.reset", "git.stash", "git.create_checkpoint", "git.rollback", "git.create_agent_branch", "git.commit_task"],
    } as const;
  }

  status() {
    const result = this.run(["status", "--short", "--branch"]);
    const lines = result.stdout.split(/\r?\n/u).filter(Boolean);
    return { branch: lines.find((line) => line.startsWith("## "))?.slice(3) ?? "", entries: lines.filter((line) => !line.startsWith("## ")), clean: lines.length <= 1, output: result.stdout };
  }

  diff(staged = false, paths: readonly string[] = []) { return { staged, output: this.run(["diff", ...(staged ? ["--cached"] : []), "--", ...paths.map((path) => this.safePath(path))]).stdout }; }

  log(limit = 20) {
    const count = clamp(limit, 1, 100);
    const output = this.run(["log", `-${count}`, "--date=iso-strict", "--format=%H%x1f%an%x1f%ad%x1f%s%x1e"]).stdout;
    const commits = output.split("\x1e").map((entry) => entry.trim()).filter(Boolean).map((entry) => {
      const [hash, author, date, subject] = entry.split("\x1f");
      return { hash, author, date, subject };
    });
    return { commits };
  }

  branch(action: "list" | "create" | "delete" = "list", name?: string, confirm = false) {
    if (action === "list") return { branches: this.run(["branch", "--list", "--format=%(refname:short)"]).stdout.split(/\r?\n/u).filter(Boolean) };
    this.requireMutation(confirm);
    const branch = this.validateBranch(name);
    const args = action === "create" ? ["branch", branch] : ["branch", "-d", branch];
    return { action, branch, output: this.run(args).stdout };
  }

  checkout(name: string, confirm = false) { this.requireMutation(confirm); const branch = this.validateBranch(name); return { branch, output: this.run(["switch", branch]).stdout }; }
  add(paths: readonly string[], confirm = false) { this.requireMutation(confirm); if (!paths.length) throw new GitToolError(400, "Provide at least one path to stage."); return { paths: paths.map((path) => this.safePath(path)), output: this.run(["add", "--", ...paths.map((path) => this.safePath(path))]).stdout }; }

  commit(message: string, confirm = false) {
    this.requireMutation(confirm);
    if (!message.trim() || message.length > 200) throw new GitToolError(400, "Commit message must contain 1 to 200 characters.");
    return { message, output: this.run(["commit", "-m", message]).stdout };
  }

  reset(mode: "soft" | "mixed" | "hard" = "mixed", target = "HEAD", confirm = false, confirmHard = false) {
    this.requireMutation(confirm);
    if (mode === "hard" && !confirmHard) throw new GitToolError(403, "Hard reset requires confirmHard=true.");
    if (!/^[A-Za-z0-9._/-]+$/u.test(target)) throw new GitToolError(400, "Invalid reset target.");
    return { mode, target, output: this.run(["reset", `--${mode}`, target]).stdout };
  }

  stash(action: "list" | "push" | "pop" | "apply" | "drop" = "list", message?: string, confirm = false) {
    if (action === "list") return { action, output: this.run(["stash", "list"]).stdout };
    this.requireMutation(confirm);
    if (action === "push") return { action, output: this.run(["stash", "push", "-u", ...(message ? ["-m", message.slice(0, 200)] : [])]).stdout };
    return { action, output: this.run(["stash", action]).stdout };
  }

  createCheckpoint(confirm = false): Checkpoint {
    this.requireMutation(confirm);
    const id = `checkpoint-${Date.now()}`;
    const head = this.run(["rev-parse", "HEAD"]).stdout.trim();
    this.run(["stash", "push", "-u", "-m", `CodeLoop ${id}`]);
    const stashRef = this.runOptional(["rev-parse", "--verify", "refs/stash"]);
    if (stashRef) this.run(["stash", "apply", "--index", stashRef]);
    const checkpoint = { id, head, ...(stashRef ? { stashRef } : {}), createdAt: new Date().toISOString() };
    this.checkpoints.set(id, checkpoint);
    return checkpoint;
  }

  rollback(id: string, confirm = false) {
    this.requireMutation(confirm);
    const checkpoint = this.checkpoints.get(id);
    if (!checkpoint) throw new GitToolError(404, "Checkpoint not found in this CodeLoop process.");
    this.run(["reset", "--hard", checkpoint.head]);
    this.run(["clean", "-fd", "--"]);
    if (checkpoint.stashRef) this.run(["stash", "apply", "--index", checkpoint.stashRef]);
    return { id, rolledBack: true, head: checkpoint.head };
  }

  createAgentBranch(name: string, confirm = false) { this.requireMutation(confirm); const branch = this.validateBranch(name); return { branch, output: this.run(["switch", "-c", branch]).stdout }; }

  commitTask(message: string, paths: readonly string[], confirm = false) {
    this.requireMutation(confirm);
    this.add(paths, true);
    return { ...this.commit(message, true), paths };
  }

  private run(args: readonly string[]): { stdout: string; stderr: string } {
    this.ensureRepository();
    const result = spawnSync("git", ["--no-pager", ...args], { cwd: this.root, encoding: "utf8", timeout: 60_000, windowsHide: true, maxBuffer: MAX_OUTPUT });
    const stdout = String(result.stdout ?? "").slice(0, MAX_OUTPUT);
    const stderr = String(result.stderr ?? "").slice(0, MAX_OUTPUT);
    if (result.error) throw new GitToolError(500, result.error.message);
    if (result.status !== 0) throw new GitToolError(409, stderr.trim() || `git ${args[0]} failed.`);
    return { stdout, stderr };
  }

  private runOptional(args: readonly string[]): string | undefined { try { return this.run(args).stdout.trim() || undefined; } catch { return undefined; } }
  private ensureRepository(): void { const detected = this.runWithoutRepositoryCheck(["rev-parse", "--show-toplevel"]).trim(); if (normalize(resolve(detected)).toLowerCase() !== this.root.toLowerCase()) throw new GitToolError(403, "Git repository root is outside the configured workspace."); }
  private runWithoutRepositoryCheck(args: readonly string[]): string { const result = spawnSync("git", args, { cwd: this.root, encoding: "utf8", timeout: 10_000, windowsHide: true }); if (result.status !== 0) throw new GitToolError(404, "The workspace is not a Git repository."); return String(result.stdout ?? ""); }
  private requireMutation(confirm: boolean): void { if (!this.mutationEnabled) throw new GitToolError(403, "Git mutations are disabled by the CodeLoop sandbox."); if (!confirm) throw new GitToolError(400, "This Git mutation requires confirm=true."); }
  private validateBranch(name?: string): string { if (!name || !branchPattern.test(name) || name.startsWith("-") || name.includes("..")) throw new GitToolError(400, "Invalid branch name."); return name; }
  private safePath(path: string): string { const target = isAbsolute(path) ? normalize(resolve(path)) : normalize(resolve(this.root, path)); const relativePath = relative(this.root, target); if (relativePath === ".." || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) throw new GitToolError(403, "Git path is outside the configured workspace."); return relativePath || "."; }
}

function clamp(value: number, minimum: number, maximum: number): number { return Math.min(Math.max(Number.isFinite(value) ? value : minimum, minimum), maximum); }
