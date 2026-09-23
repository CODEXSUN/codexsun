import { appendFile, mkdir } from "node:fs/promises";
import { createInterface } from "node:readline";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { loadRegistry, verifyRegistry } from "../../app-cli/src/registry.mjs";
import { authorize } from "./config.mjs";
import { createSshProvider } from "./ssh-provider.mjs";

const toolDefinitions = [
  { name: "registry.list", description: "List registered applications and addons.", inputSchema: { type: "object", properties: {} } },
  { name: "registry.verify", description: "Validate registry bindings and profiles.", inputSchema: { type: "object", properties: {} } },
  { name: "runtime.status", description: "Return safe local runtime and SSH target status.", inputSchema: { type: "object", properties: {} } },
  { name: "cloud.ssh.status", description: "List configured cloud SSH targets without secrets.", inputSchema: { type: "object", properties: {} } },
  { name: "cloud.ssh.exec", description: "Run one explicitly allowlisted command on a configured SSH target.", inputSchema: { type: "object", required: ["target", "command"], properties: { target: { type: "string" }, command: { type: "string" } } } },
];

export function createMcpServer({ config, sshProvider = createSshProvider(config), registry = { loadRegistry, verifyRegistry }, audit = writeAudit }) {
  async function callTool(name, input) {
    if (name === "registry.list") return registry.loadRegistry(config.repositoryRoot).applications.map(({ id, label, owner, category }) => ({ id, label, owner, category }));
    if (name === "registry.verify") return registry.verifyRegistry(config.repositoryRoot);
    if (name === "runtime.status") return { mode: config.appMode, repositoryRoot: config.repositoryRoot, sshTargets: sshProvider.targets().map((target) => target.id) };
    if (name === "cloud.ssh.status") return sshProvider.targets();
    if (name === "cloud.ssh.exec") return sshProvider.exec(input.target, input.command);
    throw new Error("Tool not found.");
  }

  return {
    async handle(request) {
      const id = request.id ?? null;
      if (request.method === "notifications/initialized") return null;
      if (!authorize(request, config)) return errorResponse(id, -32001, "Unauthorized.");
      try {
        if (request.method === "initialize") return result(id, { protocolVersion: "2025-03-26", serverInfo: { name: "codexsun-remote-ops", version: "1.0.35" }, capabilities: { tools: {}, resources: {} } });
        if (request.method === "tools/list") return result(id, { tools: toolDefinitions });
        if (request.method === "resources/list") return result(id, { resources: [{ uri: "codexsun://registry/applications", name: "Codexsun application registry", mimeType: "application/json" }] });
        if (request.method === "resources/read" && request.params?.uri === "codexsun://registry/applications") return result(id, { contents: [{ uri: request.params.uri, mimeType: "application/json", text: JSON.stringify(await callTool("registry.list", {})) }] });
        if (request.method !== "tools/call") return errorResponse(id, -32601, "Method not found.");
        const name = request.params?.name;
        const value = await callTool(name, request.params?.arguments || {});
        await audit(config.auditPath, { requestId: id || randomUUID(), tool: name, result: "success" });
        return result(id, { content: [{ type: "text", text: JSON.stringify(value) }] });
      } catch (error) {
        await audit(config.auditPath, { requestId: id || randomUUID(), tool: request.params?.name || request.method, result: "failure", failure: "Operation failed." });
        return errorResponse(id, -32002, "Operation failed.");
      }
    },
  };
}

export async function startStdio(server) {
  const input = createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of input) {
    if (!line.trim()) continue;
    let response;
    try { response = await server.handle(JSON.parse(line)); } catch { response = errorResponse(null, -32700, "Invalid JSON."); }
    if (response) process.stdout.write(`${JSON.stringify(response)}\n`);
  }
}

async function writeAudit(path, event) { await mkdir(dirname(path), { recursive: true }); await appendFile(path, `${JSON.stringify({ timestamp: new Date().toISOString(), ...event })}\n`, "utf8"); }
function result(id, value) { return { jsonrpc: "2.0", id, result: value }; }
function errorResponse(id, code, message) { return { jsonrpc: "2.0", id, error: { code, message } }; }
