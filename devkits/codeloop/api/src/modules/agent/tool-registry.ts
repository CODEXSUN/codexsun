import { CodeIntelligence } from "../workspace/code-intelligence.js";
import { CodeTools } from "../workspace/code-tools.js";
import { FilesystemTools } from "../workspace/filesystem-tools.js";
import { GitTools } from "../git/git-tools.js";
import { TerminalTools } from "../terminal/terminal-tools.js";
import { TestTools } from "../test/test-tools.js";
import { ValidationTools, type ValidationCommands } from "../validation/validation-tools.js";
import { BrowserTools } from "../browser/browser-tools.js";
import { ProcessTools, type ProcessStartInput } from "../process/process-tools.js";
import { SandboxTools } from "../sandbox/sandbox-tools.js";
import { DependencyTools, type PackageManager } from "../dependency/dependency-tools.js";
import { ProjectTools } from "../project/project-tools.js";
import { MemoryTools } from "../memory/memory-tools.js";

export type AgentToolCall = { id: string; name: string; arguments: Record<string, unknown> };
export type AgentToolEvent = { tool: string; callId: string; status: "completed" | "approval_required" | "failed"; durationMs: number; result: unknown };
export type AgentToolDefinition = { type: "function"; function: { name: string; description: string; parameters: Record<string, unknown> } };

const path = { type: "string", description: "Path relative to the CodeLoop workspace." };
const boolean = { type: "boolean" };

export class AgentToolRegistry {
  constructor(
    private readonly filesystem: FilesystemTools,
    private readonly terminal: TerminalTools,
    private readonly git: GitTools,
    private readonly code: CodeTools,
    private readonly intelligence: CodeIntelligence,
    private readonly tests: TestTools,
    private readonly validation: ValidationTools,
    private readonly browser: BrowserTools,
    private readonly processes: ProcessTools,
    private readonly sandboxes: SandboxTools,
    private readonly dependencies: DependencyTools,
    private readonly project: ProjectTools,
    private readonly memory: MemoryTools,
  ) {}

  definitions(): AgentToolDefinition[] {
    return [
      tool("fs.read", "Read a text file.", { path, maxBytes: { type: "number" } }),
      tool("fs.list", "List workspace files.", { path, recursive: boolean, limit: { type: "number" } }),
      tool("fs.search", "Search text in workspace files.", { query: { type: "string" }, path, limit: { type: "number" } }),
      tool("fs.exists", "Check whether a workspace path exists.", { path }),
      tool("fs.move", "Move a workspace path after approval.", { source: path, destination: path, overwrite: boolean }),
      tool("fs.copy", "Copy a workspace path after approval.", { source: path, destination: path, overwrite: boolean }),
      tool("code.search", "Search source code text.", { query: { type: "string" }, path, limit: { type: "number" } }),
      tool("code.find_symbol", "Find source symbol declarations by name.", { symbol: { type: "string" }, path, limit: { type: "number" } }),
      tool("code.find_references", "Find source references by symbol name.", { symbol: { type: "string" }, path, limit: { type: "number" } }),
      tool("code.find_definition", "Find source definitions by symbol name.", { symbol: { type: "string" }, path, limit: { type: "number" } }),
      tool("code.find_files", "Find source files by glob pattern.", { pattern: { type: "string" }, path, limit: { type: "number" } }),
      tool("code.diagnostics", "Return TypeScript diagnostics.", { path }),
      tool("code.symbols", "Return TypeScript language-service symbols.", { path }),
      tool("code.references", "Resolve references at a TypeScript position.", { path, line: { type: "number" }, column: { type: "number" } }),
      tool("code.definition", "Resolve a TypeScript definition at a position.", { path, line: { type: "number" }, column: { type: "number" } }),
      tool("code.ast", "Inspect a bounded TypeScript AST.", { path, maxNodes: { type: "number" } }),
      tool("terminal.exec", "Run a terminal command after approval.", { command: { type: "string" }, cwd: path, timeoutMs: { type: "number" } }),
      tool("test.run", "Run the configured project test command after approval.", { command: { type: "string" }, scope: path, timeoutMs: { type: "number" } }),
      tool("test.unit", "Run unit tests after approval.", { command: { type: "string" }, scope: path, timeoutMs: { type: "number" } }),
      tool("test.integration", "Run integration tests after approval.", { command: { type: "string" }, scope: path, timeoutMs: { type: "number" } }),
      tool("test.e2e", "Run end-to-end tests after approval.", { command: { type: "string" }, scope: path, timeoutMs: { type: "number" } }),
      tool("test.watch", "Start the project test watcher after approval.", { command: { type: "string" }, scope: path }),
      tool("test.coverage", "Run tests with coverage after approval.", { command: { type: "string" }, scope: path, timeoutMs: { type: "number" } }),
      tool("validate", "Run typecheck, lint, unit, integration, E2E, and build validation in order after approval.", { scope: path, timeoutMs: { type: "number" }, commands: { type: "object", additionalProperties: { type: "string" } } }),
      tool("browser.open", "Open a controlled headless browser session.", { url: { type: "string" }, headless: boolean }),
      tool("browser.navigate", "Navigate the controlled browser to an HTTP or HTTPS URL.", { url: { type: "string" } }),
      tool("browser.click", "Click a page element by selector after approval.", { selector: { type: "string" } }),
      tool("browser.type", "Fill a page input by selector after approval.", { selector: { type: "string" }, text: { type: "string" } }),
      tool("browser.select", "Select an option by selector after approval.", { selector: { type: "string" }, value: { type: "string" } }),
      tool("browser.screenshot", "Capture a browser screenshot into the workspace artifacts directory.", { fileName: { type: "string" }, fullPage: boolean }),
      tool("browser.console", "Read captured browser console entries.", { clear: boolean }),
      tool("browser.network", "Read captured browser network entries.", { clear: boolean }),
      tool("browser.inspect", "Inspect visible DOM elements by selector.", { selector: { type: "string" } }),
      tool("process.start", "Start a named workspace service after approval.", { name: { type: "string" }, command: { type: "string" }, cwd: path, env: { type: "object", additionalProperties: { type: "string" } } }),
      tool("process.stop", "Stop a named workspace service after approval.", { name: { type: "string" }, signal: { type: "string", enum: ["SIGTERM", "SIGKILL"] } }),
      tool("process.restart", "Restart a named workspace service after approval.", { name: { type: "string" }, command: { type: "string" }, cwd: path, env: { type: "object", additionalProperties: { type: "string" } } }),
      tool("process.status", "Inspect named workspace service status.", { name: { type: "string" } }),
      tool("process.logs", "Read named workspace service logs.", { name: { type: "string" }, offset: { type: "number" }, limit: { type: "number" } }),
      tool("sandbox.create", "Create an isolated Docker workspace sandbox after approval.", { name: { type: "string" }, image: { type: "string" } }),
      tool("sandbox.start", "Start an isolated Docker workspace sandbox after approval.", { name: { type: "string" } }),
      tool("sandbox.exec", "Execute a bounded command inside an isolated Docker sandbox after approval.", { name: { type: "string" }, command: { type: "string" }, timeoutMs: { type: "number" } }),
      tool("sandbox.stop", "Stop an isolated Docker workspace sandbox after approval.", { name: { type: "string" } }),
      tool("sandbox.destroy", "Destroy an isolated Docker workspace sandbox after approval.", { name: { type: "string" } }),
      tool("sandbox.snapshot", "Snapshot an isolated Docker sandbox after approval.", { name: { type: "string" } }),
      tool("sandbox.restore", "Restore an isolated Docker sandbox snapshot after approval.", { name: { type: "string" }, snapshotId: { type: "string" } }),
      tool("package.install", "Install validated packages with a selected or detected package manager after approval.", { packages: { type: "array", items: { type: "string" } }, manager: { type: "string", enum: ["npm", "pnpm", "yarn", "bun"] }, workspace: path, dev: boolean }),
      tool("package.remove", "Remove validated packages with a selected or detected package manager after approval.", { packages: { type: "array", items: { type: "string" } }, manager: { type: "string", enum: ["npm", "pnpm", "yarn", "bun"] }, workspace: path }),
      tool("package.update", "Update validated packages with a selected or detected package manager after approval.", { packages: { type: "array", items: { type: "string" } }, manager: { type: "string", enum: ["npm", "pnpm", "yarn", "bun"] }, workspace: path }),
      tool("package.inspect", "Inspect a workspace package manifest and dependency declaration.", { workspace: path, packageName: { type: "string" } }),
      tool("package.audit", "Audit workspace dependencies with the selected or detected package manager.", { manager: { type: "string", enum: ["npm", "pnpm", "yarn", "bun"] }, workspace: path }),
      tool("project.scan", "Scan the workspace and build a bounded project model.", { refresh: boolean }),
      tool("project.index", "Index workspace files into the project knowledge graph.", { refresh: boolean }),
      tool("project.structure", "Return the workspace directory and file structure.", { refresh: boolean }),
      tool("project.dependencies", "Inspect package manifests and dependency relationships.", { refresh: boolean }),
      tool("project.conventions", "Infer project package, source, config, test, and documentation conventions.", { refresh: boolean }),
      tool("project.architecture", "Return project knowledge graph nodes and relationships.", { refresh: boolean }),
      tool("git.status", "Inspect Git status.", {}),
      tool("git.diff", "Inspect Git diff.", { staged: boolean, paths: { type: "array", items: path } }),
      tool("git.log", "Inspect recent Git commits.", { limit: { type: "number" } }),
      tool("git.branch", "List or mutate Git branches after approval.", { action: { type: "string", enum: ["list", "create", "delete"] }, name: { type: "string" } }),
      tool("git.checkout", "Switch Git branches after approval.", { name: { type: "string" } }),
      tool("fs.write", "Write a file after approval.", { path, content: { type: "string" } }),
      tool("fs.edit", "Edit a file after approval using exact replacements.", { path, edits: { type: "array" } }),
      tool("fs.patch", "Patch files after approval using exact replacements.", { patches: { type: "array" } }),
      tool("fs.delete", "Delete a workspace path after approval.", { path, recursive: boolean }),
      tool("git.add", "Stage files after approval.", { paths: { type: "array", items: path } }),
      tool("git.commit", "Commit staged files after approval.", { message: { type: "string" } }),
      tool("git.create_checkpoint", "Create a recoverable Git checkpoint after approval.", {}),
      tool("git.reset", "Reset Git state after approval.", { mode: { type: "string", enum: ["soft", "mixed", "hard"] }, target: { type: "string" }, confirmHard: boolean }),
      tool("git.stash", "List or mutate Git stashes after approval.", { action: { type: "string", enum: ["list", "push", "pop", "apply", "drop"] }, message: { type: "string" } }),
      tool("git.rollback", "Roll back to a CodeLoop checkpoint after approval.", { id: { type: "string" } }),
      tool("git.create_agent_branch", "Create and switch to an agent branch after approval.", { name: { type: "string" } }),
      tool("git.commit_task", "Stage selected files and commit a task after approval.", { message: { type: "string" }, paths: { type: "array", items: path } }),
      tool("memory.task_state", "Read or save durable task state.", { taskId: { type: "string" }, value: { type: "object", additionalProperties: true } }),
      tool("memory.project_state", "Read or save durable project state.", { projectId: { type: "string" }, value: { type: "object", additionalProperties: true } }),
      tool("memory.decisions", "List or save durable project decisions.", { projectId: { type: "string" }, decision: { type: "string" }, rationale: { type: "string" } }),
    ];
  }

  async execute(call: AgentToolCall, approved = false, ownerId = "agent"): Promise<AgentToolEvent> {
    const started = Date.now();
    if (requiresApproval(call) && !approved) return { tool: call.name, callId: call.id, status: "approval_required", durationMs: 0, result: { approvalRequired: true, message: "Human approval is required before this operation." } };
    try {
      const args = call.arguments;
      let result: unknown;
      switch (call.name) {
        case "fs.read": result = await this.filesystem.read(String(args.path), numberArg(args.maxBytes)); break;
        case "fs.list": result = await this.filesystem.list(String(args.path ?? "."), Boolean(args.recursive ?? true), numberArg(args.limit)); break;
        case "fs.search": result = await this.filesystem.search(String(args.query), String(args.path ?? "."), false, numberArg(args.limit)); break;
        case "fs.exists": result = await this.filesystem.exists(String(args.path)); break;
        case "fs.move": result = await this.filesystem.move(String(args.source), String(args.destination), Boolean(args.overwrite)); break;
        case "fs.copy": result = await this.filesystem.copy(String(args.source), String(args.destination), Boolean(args.overwrite)); break;
        case "code.search": result = await this.code.search(String(args.query), String(args.path ?? "."), false, numberArg(args.limit)); break;
        case "code.find_symbol": result = await this.code.findSymbol(String(args.symbol), String(args.path ?? "."), numberArg(args.limit)); break;
        case "code.find_references": result = await this.code.findReferences(String(args.symbol), String(args.path ?? "."), true, numberArg(args.limit)); break;
        case "code.find_definition": result = await this.code.findDefinition(String(args.symbol), String(args.path ?? "."), numberArg(args.limit)); break;
        case "code.find_files": result = await this.code.findFiles(String(args.pattern), String(args.path ?? "."), numberArg(args.limit)); break;
        case "code.diagnostics": result = await this.intelligence.diagnostics(args.path ? String(args.path) : undefined); break;
        case "code.symbols": result = await this.intelligence.symbols(args.path ? String(args.path) : undefined); break;
        case "code.references": result = await this.intelligence.references({ path: String(args.path), line: Number(args.line), column: Number(args.column) }); break;
        case "code.definition": result = await this.intelligence.definition({ path: String(args.path), line: Number(args.line), column: Number(args.column) }); break;
        case "code.ast": result = await this.intelligence.ast(String(args.path), numberArg(args.maxNodes)); break;
        case "terminal.exec": result = await this.terminal.exec(String(args.command), args.cwd ? String(args.cwd) : undefined, numberArg(args.timeoutMs)); break;
        case "test.run": result = await this.tests.run("test.run", optionalString(args.command), optionalString(args.scope), numberArg(args.timeoutMs, 120_000)); break;
        case "test.unit": result = await this.tests.run("test.unit", optionalString(args.command), optionalString(args.scope), numberArg(args.timeoutMs, 120_000)); break;
        case "test.integration": result = await this.tests.run("test.integration", optionalString(args.command), optionalString(args.scope), numberArg(args.timeoutMs, 120_000)); break;
        case "test.e2e": result = await this.tests.run("test.e2e", optionalString(args.command), optionalString(args.scope), numberArg(args.timeoutMs, 120_000)); break;
        case "test.watch": result = this.tests.watch(optionalString(args.command), optionalString(args.scope)); break;
        case "test.coverage": result = await this.tests.run("test.coverage", optionalString(args.command), optionalString(args.scope), numberArg(args.timeoutMs, 120_000)); break;
        case "validate": result = await this.validation.validate(optionalString(args.scope), validationCommands(args.commands), numberArg(args.timeoutMs, 120_000)); break;
        case "browser.open": result = await this.browser.open(optionalString(args.url), args.headless !== false); break;
        case "browser.navigate": result = await this.browser.navigate(String(args.url)); break;
        case "browser.click": result = await this.browser.click(String(args.selector)); break;
        case "browser.type": result = await this.browser.type(String(args.selector), String(args.text)); break;
        case "browser.select": result = await this.browser.select(String(args.selector), String(args.value)); break;
        case "browser.screenshot": result = await this.browser.screenshot(optionalString(args.fileName), args.fullPage !== false); break;
        case "browser.console": result = this.browser.console(Boolean(args.clear)); break;
        case "browser.network": result = this.browser.network(Boolean(args.clear)); break;
        case "browser.inspect": result = await this.browser.inspect(optionalString(args.selector)); break;
        case "process.start": result = this.processes.start(processInput(args)); break;
        case "process.stop": result = this.processes.stop(String(args.name), signalArg(args.signal)); break;
        case "process.restart": result = this.processes.restart(processInput(args)); break;
        case "process.status": result = this.processes.status(optionalString(args.name)); break;
        case "process.logs": result = this.processes.logs(String(args.name), numberArg(args.offset, 0), numberArg(args.limit, 1_000_000)); break;
        case "sandbox.create": result = this.sandboxes.create(String(args.name), optionalString(args.image)); break;
        case "sandbox.start": result = this.sandboxes.start(String(args.name)); break;
        case "sandbox.exec": result = await this.sandboxes.exec(String(args.name), String(args.command), numberArg(args.timeoutMs, 120_000)); break;
        case "sandbox.stop": result = this.sandboxes.stop(String(args.name)); break;
        case "sandbox.destroy": result = this.sandboxes.destroy(String(args.name)); break;
        case "sandbox.snapshot": result = this.sandboxes.snapshot(String(args.name)); break;
        case "sandbox.restore": result = this.sandboxes.restore(String(args.name), String(args.snapshotId)); break;
        case "package.install": result = await this.dependencies.install(packageList(args.packages), managerArg(args.manager), optionalString(args.workspace), Boolean(args.dev)); break;
        case "package.remove": result = await this.dependencies.remove(packageList(args.packages), managerArg(args.manager), optionalString(args.workspace)); break;
        case "package.update": result = await this.dependencies.update(packageList(args.packages), managerArg(args.manager), optionalString(args.workspace)); break;
        case "package.inspect": result = await this.dependencies.inspect(optionalString(args.workspace), optionalString(args.packageName)); break;
        case "package.audit": result = await this.dependencies.audit(managerArg(args.manager), optionalString(args.workspace)); break;
        case "project.scan": result = await this.project.scan(Boolean(args.refresh)); break;
        case "project.index": result = await this.project.index(Boolean(args.refresh)); break;
        case "project.structure": result = await this.project.structure(Boolean(args.refresh)); break;
        case "project.dependencies": result = await this.project.dependencies(Boolean(args.refresh)); break;
        case "project.conventions": result = await this.project.conventions(Boolean(args.refresh)); break;
        case "project.architecture": result = await this.project.architecture(Boolean(args.refresh)); break;
        case "git.status": result = this.git.status(); break;
        case "git.diff": result = this.git.diff(Boolean(args.staged), Array.isArray(args.paths) ? args.paths.map(String) : []); break;
        case "git.log": result = this.git.log(numberArg(args.limit)); break;
        case "git.branch": result = this.git.branch(gitBranchAction(args.action), optionalString(args.name), true); break;
        case "git.checkout": result = this.git.checkout(String(args.name), true); break;
        case "fs.write": result = await this.filesystem.write(String(args.path), String(args.content)); break;
        case "fs.edit": result = await this.filesystem.edit(String(args.path), args.edits as never); break;
        case "fs.patch": result = await this.filesystem.patch(args.patches as never); break;
        case "fs.delete": result = await this.filesystem.remove(String(args.path), Boolean(args.recursive), true); break;
        case "git.add": result = this.git.add((args.paths as unknown[]).map(String), true); break;
        case "git.commit": result = this.git.commit(String(args.message), true); break;
        case "git.create_checkpoint": result = this.git.createCheckpoint(true); break;
        case "git.reset": result = this.git.reset(gitResetMode(args.mode), optionalString(args.target), true, Boolean(args.confirmHard)); break;
        case "git.stash": result = this.git.stash(gitStashAction(args.action), optionalString(args.message), true); break;
        case "git.rollback": result = this.git.rollback(String(args.id), true); break;
        case "git.create_agent_branch": result = this.git.createAgentBranch(String(args.name), true); break;
        case "git.commit_task": result = this.git.commitTask(String(args.message), (args.paths as unknown[]).map(String), true); break;
        case "memory.task_state": result = this.memory.taskState(ownerId, String(args.taskId), recordArg(args.value)); break;
        case "memory.project_state": result = this.memory.projectState(ownerId, String(args.projectId), recordArg(args.value)); break;
        case "memory.decisions": result = this.memory.decisions(ownerId, String(args.projectId), decisionArg(args)); break;
        default: return { tool: call.name, callId: call.id, status: "failed", durationMs: Date.now() - started, result: { error: `Unknown tool ${call.name}.` } };
      }
      return { tool: call.name, callId: call.id, status: "completed", durationMs: Date.now() - started, result };
    } catch (error) {
      return { tool: call.name, callId: call.id, status: "failed", durationMs: Date.now() - started, result: { error: error instanceof Error ? error.message : String(error) } };
    }
  }
}

function tool(name: string, description: string, properties: Record<string, unknown>): AgentToolDefinition { return { type: "function", function: { name, description, parameters: { type: "object", properties, additionalProperties: false } } }; }
function requiresApproval(call: AgentToolCall): boolean {
  const mutationTools = ["fs.write", "fs.edit", "fs.patch", "fs.delete", "fs.move", "fs.copy", "terminal.exec", "test.run", "test.unit", "test.integration", "test.e2e", "test.watch", "test.coverage", "validate", "browser.click", "browser.type", "browser.select", "process.start", "process.stop", "process.restart", "sandbox.create", "sandbox.start", "sandbox.exec", "sandbox.stop", "sandbox.destroy", "sandbox.snapshot", "sandbox.restore", "package.install", "package.remove", "package.update", "git.checkout", "git.add", "git.commit", "git.reset", "git.rollback", "git.create_agent_branch", "git.commit_task", "memory.task_state", "memory.project_state", "memory.decisions"];
  if (mutationTools.includes(call.name)) return true;
  if (call.name === "git.branch") return call.arguments.action !== "list";
  if (call.name === "git.stash") return call.arguments.action !== "list";
  return false;
}
function numberArg(value: unknown, fallback = 200): number { return typeof value === "number" && Number.isFinite(value) ? value : fallback; }
function optionalString(value: unknown): string | undefined { return typeof value === "string" && value.trim() ? value : undefined; }
function validationCommands(value: unknown): ValidationCommands { if (!value || typeof value !== "object" || Array.isArray(value)) return {}; return Object.fromEntries(Object.entries(value).filter(([, command]) => typeof command === "string")) as ValidationCommands; }
function processInput(args: Record<string, unknown>): ProcessStartInput { return { name: String(args.name), command: String(args.command), cwd: optionalString(args.cwd), env: stringRecord(args.env) }; }
function stringRecord(value: unknown): Record<string, string> | undefined { if (!value || typeof value !== "object" || Array.isArray(value)) return undefined; return Object.fromEntries(Object.entries(value).filter(([, item]) => typeof item === "string")) as Record<string, string>; }
function signalArg(value: unknown): "SIGTERM" | "SIGKILL" | undefined { return value === "SIGKILL" ? "SIGKILL" : value === "SIGTERM" ? "SIGTERM" : undefined; }
function packageList(value: unknown): string[] { return Array.isArray(value) ? value.map(String) : []; }
function managerArg(value: unknown): PackageManager | undefined { return value === "npm" || value === "pnpm" || value === "yarn" || value === "bun" ? value : undefined; }
function gitBranchAction(value: unknown): "list" | "create" | "delete" { return value === "create" || value === "delete" ? value : "list"; }
function gitResetMode(value: unknown): "soft" | "mixed" | "hard" { return value === "soft" || value === "hard" ? value : "mixed"; }
function gitStashAction(value: unknown): "list" | "push" | "pop" | "apply" | "drop" { return value === "push" || value === "pop" || value === "apply" || value === "drop" ? value : "list"; }
function recordArg(value: unknown): Record<string, unknown> | undefined { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined; }
function decisionArg(args: Record<string, unknown>): { decision: string; rationale?: string } | undefined { const decision = optionalString(args.decision); return decision ? { decision, rationale: optionalString(args.rationale) } : undefined; }
