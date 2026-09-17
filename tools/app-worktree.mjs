import { execFileSync, execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, relative, resolve } from "node:path";
import { scopeWorkspaces } from "./turbo-scope.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const WORKTREE_ROOT = resolve(ROOT, "..", ".codexsun-worktrees");
const STATE_ROOT = resolve(ROOT, "storage", "runtime", "worktrees");
const MAIN_BRANCH = "main";
const TASK_PREFIXES = { docs: "d", orship: "o", platform: "p", uiux: "u", zetro: "z" };

export function createWorktree(scope, task) {
  const state = createState(scope, task);
  assertMainCheckout();
  assertClean(ROOT);
  assertMissing(state);
  mkdirSync(WORKTREE_ROOT, { recursive: true });
  runGit(["worktree", "add", "-b", state.branch, state.path, MAIN_BRANCH]);
  state.baseCommit = runGit(["rev-parse", "HEAD"], state.path).trim();
  writeState(state);
  return state;
}

export function verifyWorktree(scope, task) {
  const state = readState(scope, task);
  if (!new Set(["created", "verified"]).has(state.status)) {
    throw new Error("Verify a new worktree before development starts.");
  }
  assertWorktreeExists(state);
  assertExpectedLocation(state);
  assertWorktreeBranch(state);
  assertBaseline(state);
  assertClean(state.path);
  runNodeTool("check-root-layout.mjs", state.path);
  runNpm(["check:line-endings"], state.path);
  runNpm([`check:${state.scope}`], state.path);
  state.status = "verified";
  state.verifiedAt = new Date().toISOString();
  writeState(state);
  return state;
}

export function developWorktree(scope, task) {
  const state = readState(scope, task);
  if (state.status !== "verified") throw new Error("Run verify before development.");
  assertWorktreeExists(state);
  runNpm([`check:${state.scope}`], state.path);
  return state;
}

export function reviewWorktree(scope, task) {
  const state = readState(scope, task);
  assertWorktreeExists(state);
  assertClean(state.path);
  assertNoSharedPackageChanges(state);
  runGit(["diff", "--check", `${MAIN_BRANCH}...${state.branch}`], state.path);
  runNpm([`check:${state.scope}`], state.path);
  state.reviewedAt = new Date().toISOString();
  state.status = "reviewed";
  writeState(state);
  return state;
}

export function approveWorktree(scope, task, approvedBy) {
  const state = readState(scope, task);
  if (state.status !== "reviewed") throw new Error("Run review before approval.");
  if (!approvedBy?.trim()) throw new Error("Use --approved-by <name> for manual approval.");

  state.approvedAt = new Date().toISOString();
  state.approvedBy = approvedBy.trim();
  state.status = "approved";
  writeState(state);
  return state;
}

export function mergeWorktree(scope, task) {
  const state = readState(scope, task);
  if (state.status !== "approved") throw new Error("Manual approval is required before merge.");
  assertMainCheckout();
  assertClean(ROOT);
  assertWorktreeExists(state);
  assertClean(state.path);
  runGit(["fetch", "--quiet"], ROOT);
  runGit(["merge-base", "--is-ancestor", MAIN_BRANCH, state.branch], ROOT);
  runGit(["merge", "--ff-only", state.branch], ROOT);
  state.mergedAt = new Date().toISOString();
  state.status = "merged";
  writeState(state);
  return state;
}

export function showWorktreeGuide(scope, task) {
  const state = readState(scope, task);
  return [
    `Worktree: ${state.path}`,
    `Branch: ${state.branch}`,
    "Verify before development: codexsun app verify <scope> <task>.",
    "Agent instructions: assist/skills/isolated-app-session/SKILL.md",
    `Run: npm.cmd run check:${state.scope}`,
    "Use the worktree root as the agent workspace for this task.",
    "Do not change packages/* without a separate approved package task.",
    "After implementation: codexsun app review <scope> <task>.",
    "A human must run codexsun app approve before codexsun app merge.",
  ].join("\n");
}

export function createState(scope, task) {
  assertScope(scope);
  const safeTask = normalizeNewTask(scope, task);
  const key = `${scope}-${safeTask}`;
  return {
    approvedAt: null,
    approvedBy: null,
    branch: `codex/${key}`,
    baseCommit: null,
    createdAt: new Date().toISOString(),
    key,
    path: resolve(WORKTREE_ROOT, key),
    reviewedAt: null,
    scope,
    status: "created",
    task: safeTask,
    verifiedAt: null,
  };
}

function readState(scope, task) {
  const statePath = getStatePath(scope, task);
  if (!existsSync(statePath)) throw new Error(`No worktree record exists for ${scope}/${task}.`);
  return JSON.parse(readFileSync(statePath, "utf8"));
}

function writeState(state) {
  mkdirSync(STATE_ROOT, { recursive: true });
  writeFileSync(getStatePath(state.scope, state.task), `${JSON.stringify(state, null, 2)}\n`);
}

function assertMissing(state) {
  if (existsSync(state.path) || existsSync(getStatePath(state.scope, state.task))) {
    throw new Error(`A worktree already exists for ${state.scope}/${state.task}.`);
  }
}

function assertMainCheckout() {
  const branch = runGit(["branch", "--show-current"], ROOT).trim();
  if (branch !== MAIN_BRANCH) throw new Error(`Run this command from ${MAIN_BRANCH}.`);
}

function assertClean(path) {
  if (runGit(["status", "--porcelain"], path).trim()) {
    throw new Error(`The worktree is not clean: ${path}`);
  }
}

function assertWorktreeExists(state) {
  if (!existsSync(state.path)) throw new Error(`The recorded worktree is missing: ${state.path}`);
}

function assertExpectedLocation(state) {
  const expectedPath = resolve(WORKTREE_ROOT, state.key);
  if (resolve(state.path) !== expectedPath) throw new Error("The recorded worktree path is invalid.");
}

function assertWorktreeBranch(state) {
  const branch = runGit(["branch", "--show-current"], state.path).trim();
  if (branch !== state.branch) throw new Error(`Expected branch ${state.branch}, found ${branch}.`);
}

function assertBaseline(state) {
  const head = runGit(["rev-parse", "HEAD"], state.path).trim();
  if (!state.baseCommit) {
    const baseCommit = runGit(["merge-base", MAIN_BRANCH, state.branch], state.path).trim();
    if (head !== baseCommit) throw new Error("The worktree changed before verification.");
    state.baseCommit = head;
    return;
  }
  if (head !== state.baseCommit) throw new Error("The worktree changed before verification.");
}

function assertNoSharedPackageChanges(state) {
  const changed = runGit(["diff", "--name-only", `${MAIN_BRANCH}...${state.branch}`], state.path)
    .split("\n")
    .filter((file) => file.startsWith("packages/"));
  if (changed.length > 0) {
    throw new Error(`Shared package changes need a separate approved task:\n${changed.join("\n")}`);
  }
}

function assertScope(scope) {
  if (!scopeWorkspaces[scope] || scope === "packages") {
    throw new Error(`Use an application scope: ${Object.keys(scopeWorkspaces).filter((name) => name !== "packages").join(", ")}.`);
  }
}

function normalizeNewTask(scope, task) {
  const safeTask = normalizeLegacyTask(task);
  if (!new RegExp(`^${TASK_PREFIXES[scope]}-\\d{4}$`).test(safeTask)) {
    throw new Error(`Use the short ${TASK_PREFIXES[scope]}-0000 task ID from the app task register.`);
  }
  return safeTask;
}

function normalizeLegacyTask(task) {
  const safeTask = String(task ?? "").trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(safeTask)) {
    throw new Error("Task must use lowercase letters, numbers, and single hyphens.");
  }
  return safeTask;
}

function getStatePath(scope, task) {
  const safeTask = normalizeLegacyTask(task);
  return resolve(STATE_ROOT, `${scope}-${safeTask}.json`);
}

function runNpm(args, cwd) {
  execSync(`npm.cmd run ${args.join(" ")}`, { cwd, stdio: "inherit" });
}

function runNodeTool(tool, cwd) {
  execFileSync(process.execPath, [resolve(cwd, "tools", tool)], { cwd, stdio: "inherit" });
}

function runGit(args, cwd) {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

export function getWorktreeLocation(scope, task) {
  return relative(ROOT, createState(scope, task).path) || basename(ROOT);
}
