import { appendFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, relative, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";
import { loadRegistry, verifyRegistry } from "../../../../packages/app-cli/src/registry.mjs";

const writableRoles = new Set(["admin", "super-admin"]);
const privilegedRoles = new Set(["super-admin"]);
const blockedNames = new Set(["node_modules", "dist", ".turbo", ".git"]);
const secretName = /(^|[._-])(secret|credential|password|token|key)([._-]|$)/iu;

export function createZunoMcpGateway({ appMode = "development", auditPath, repositoryRoot }) {
  const root = resolve(repositoryRoot);
  const audit = async (event) => { await mkdir(dirname(auditPath), { recursive: true }); await appendFile(auditPath, `${JSON.stringify({ timestamp: new Date().toISOString(), ...event })}\n`, "utf8"); };
  const requireRole = (actor, roles) => { if (!roles.some((role) => actor.roles.includes(role)) && !actor.permissions.includes("*")) throw new Error("Access denied."); };
  const owner = (applicationId) => {
    const application = loadRegistry(root).applications.find((item) => item.id === applicationId);
    if (!application) throw new Error("Application is not registered.");
    const path = resolve(root, application.owner);
    if (!inside(root, path)) throw new Error("Workspace is outside the repository.");
    return { application, path };
  };
  const file = (applicationId, requestedPath = "") => {
    const workspace = owner(applicationId);
    const candidate = resolve(workspace.path, requestedPath);
    if (!inside(workspace.path, candidate) || relative(workspace.path, candidate).split(/[\\/]/u).some((part) => blockedNames.has(part))) throw new Error("Path is not available.");
    return { ...workspace, path: candidate, relativePath: relative(workspace.path, candidate) };
  };
  const tools = {
    "registry.listApplications": async () => loadRegistry(root).applications.map((item) => ({ id: item.id, label: item.label, owner: item.owner, category: item.category, enabled: true })),
    "registry.getApplication": async ({ applicationId }) => owner(applicationId).application,
    "workspace.open": async ({ applicationId }) => { const workspace = owner(applicationId); return { applicationId, owner: workspace.application.owner, workspace: workspace.application.owner }; },
    "workspace.readFile": async ({ applicationId, path }) => { const target = file(applicationId, path); if (secretName.test(target.relativePath) && !target.relativePath.endsWith(".example")) throw new Error("Sensitive files are not available."); return { path: target.relativePath, content: redact(await readFile(target.path, "utf8")) }; },
    "workspace.writeFile": async ({ applicationId, path, content }, actor) => { requireRole(actor, [...writableRoles]); const target = file(applicationId, path); if (secretName.test(target.relativePath) || !target.relativePath || typeof content !== "string") throw new Error("This file cannot be written."); await mkdir(dirname(target.path), { recursive: true }); await writeFile(target.path, content, "utf8"); return { path: target.relativePath, written: true }; },
    "workspace.search": async ({ applicationId, query }) => { const workspace = owner(applicationId); if (typeof query !== "string" || !query.trim() || query.length > 200) throw new Error("Invalid search query."); return { matches: await search(workspace.path, query, workspace.path) }; },
    "app.verify": async () => verifyRegistry(root),
    "app.create": async (input, actor) => runConfirmed(input, actor, [...writableRoles], ["create", input.id, "--category", input.category, "--label", input.label]),
    "app.install": async (input, actor) => runConfirmed(input, actor, ["admin", "super-admin"], ["install", input.kind, input.id]),
    "app.disable": async (input, actor) => runConfirmed(input, actor, [...writableRoles], ["disable", input.kind, input.id]),
    "app.uninstall": async (input, actor) => runConfirmed(input, actor, [...privilegedRoles], ["uninstall", input.kind, input.id]),
    "test.run": async ({ applicationId, command = "test" }) => { const workspace = owner(applicationId); return run(process.execPath, ["--run", "npm", "run", command], workspace.path); },
    "migration.status": async () => ({ mode: appMode, status: "Platform migration execution is owned by Zuno deployment operations." }),
    "migration.run": async (input, actor) => { requireRole(actor, [...privilegedRoles]); if (!input.confirmed || (appMode === "production" && !input.productionApproved)) throw new Error("Migration confirmation is required."); return { accepted: true, mode: appMode }; },
    "runtime.status": async () => ({ api: "managed by Zuno", web: "managed by Zuno", queue: "not configured", database: "managed by platform", worker: "managed by CXForge" }),
    "terminal.exec": async ({ applicationId, command, args = [] }, actor) => { requireRole(actor, [...writableRoles]); if (!allowed(command, args)) throw new Error("Command is not allowed."); return run(command, args, owner(applicationId).path); },
  };
  async function runConfirmed(input, actor, roles, args) { requireRole(actor, roles); if (!input.confirmed) throw new Error("Explicit confirmation is required."); return run(process.execPath, [resolve(root, "packages/app-cli/src/main.mjs"), ...args], root); }
  return {
    async handle(request, actor) {
      const requestId = request.id ?? randomUUID();
      try {
        if (request.method === "initialize") return result(requestId, { protocolVersion: "2025-03-26", serverInfo: { name: "zuno", version: "1.0.0" }, capabilities: { tools: {}, resources: {} } });
        if (request.method === "tools/list") return result(requestId, { tools: Object.keys(tools).map((name) => ({ name, description: `Zuno controlled ${name}` })) });
        if (request.method === "resources/list") return result(requestId, { resources: [{ uri: "zuno://registry/applications", name: "Application registry" }] });
        if (request.method === "resources/read") return result(requestId, { contents: [{ uri: "zuno://registry/applications", mimeType: "application/json", text: JSON.stringify(await tools["registry.listApplications"]()) }] });
        if (request.method !== "tools/call" || !tools[request.params?.name]) throw new Error("Method not found.");
        const name = request.params.name; const value = await tools[name](request.params.arguments ?? {}, actor); await audit({ requestId, userId: actor.id, applicationId: request.params.arguments?.applicationId, tool: name, result: "success" });
        return result(requestId, { content: [{ type: "text", text: JSON.stringify(value) }] });
      } catch (error) { await audit({ requestId, userId: actor?.id, applicationId: request.params?.arguments?.applicationId, tool: request.params?.name ?? request.method, result: "failure", failure: "Access denied or operation failed." }); return { jsonrpc: "2.0", id: requestId, error: { code: -32001, message: "Request denied or failed." } }; }
    },
  };
}

function inside(parent, child) { const value = relative(parent, child); return value === "" || (!value.startsWith(`..${sep}`) && value !== ".." && !value.includes(`..${sep}`)); }
function redact(value) { return value.replace(/((?:password|secret|token|api[_-]?key)\s*[=:]\s*)[^\s"']+/giu, "$1[REDACTED]"); }
async function search(path, query, root, matches = []) { if (matches.length >= 100) return matches; for (const entry of await readdir(path, { withFileTypes: true })) { if (blockedNames.has(entry.name) || secretName.test(entry.name)) continue; const target = resolve(path, entry.name); if (entry.isDirectory()) await search(target, query, root, matches); else if (entry.isFile() && (await stat(target)).size < 1_000_000 && (await readFile(target, "utf8")).includes(query)) matches.push(relative(root, target)); } return matches; }
function allowed(command, args) { return (command === "git" && args.join(" ") === "status") || (command === "npm" && ["test", "run test", "run check", "run lint", "run build"].includes(args.join(" "))) || (command === "cargo" && ["test", "check"].includes(args.join(" "))); }
function run(command, args, cwd) { return new Promise((resolve, reject) => { const child = spawn(command, args, { cwd, shell: false, windowsHide: true }); let output = ""; child.stdout.on("data", (data) => { output += data; }); child.stderr.on("data", (data) => { output += data; }); child.on("error", reject); child.on("close", (exitCode) => resolve({ exitCode, output: output.slice(-100_000) })); }); }
function result(id, value) { return { jsonrpc: "2.0", id, result: value }; }
