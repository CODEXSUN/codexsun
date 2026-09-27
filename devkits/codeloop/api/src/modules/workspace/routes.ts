import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { FilesystemTools, WorkspaceToolError } from "./filesystem-tools.js";
import { CodeTools } from "./code-tools.js";
import { CodeIntelligence } from "./code-intelligence.js";

const pathSchema = z.string().min(1).max(1000);
const editSchema = z.object({ search: z.string().min(1).max(100_000), replace: z.string().max(100_000), expectedMatches: z.number().int().min(0).max(100).optional() });

export function registerFilesystemRoutes(app: FastifyInstance, tools: FilesystemTools, codeTools: CodeTools, intelligence: CodeIntelligence): void {
  const prefix = "/api/v1/codeloop/workspace";
  app.get(`${prefix}/capabilities`, async () => ({ root: ".", ...tools.capabilities(), codeTools: ["code.search", "code.find_symbol", "code.find_references", "code.find_definition", "code.find_files"], intelligenceTools: ["code.diagnostics", "code.symbols", "code.references", "code.definition", "code.ast"] }));
  app.get(`${prefix}/files`, async (request, reply) => run(reply, () => {
    const query = z.object({ path: z.string().max(1000).default("."), recursive: z.coerce.boolean().default(true), limit: z.coerce.number().int().min(1).max(1000).default(200) }).parse(request.query);
    return tools.list(query.path, query.recursive, query.limit);
  }));
  app.get(`${prefix}/file`, async (request, reply) => run(reply, () => {
    const query = z.object({ path: pathSchema, maxBytes: z.coerce.number().int().min(1).max(200_000).default(200_000) }).parse(request.query);
    return tools.read(query.path, query.maxBytes);
  }));
  app.get(`${prefix}/stat`, async (request, reply) => run(reply, () => tools.stat(pathSchema.parse((request.query as { path?: string }).path))));
  app.post(`${prefix}/execute`, async (request, reply) => run(reply, async () => {
    const body = z.discriminatedUnion("tool", [
      z.object({ tool: z.literal("fs.read"), path: pathSchema, maxBytes: z.number().int().min(1).max(200_000).optional() }),
      z.object({ tool: z.literal("fs.write"), path: pathSchema, content: z.string().max(200_000), overwrite: z.boolean().optional() }),
      z.object({ tool: z.literal("fs.edit"), path: pathSchema, edits: z.array(editSchema).min(1).max(50) }),
      z.object({ tool: z.literal("fs.patch"), patches: z.array(z.object({ path: pathSchema, edits: z.array(editSchema).min(1).max(50) })).min(1).max(50) }),
      z.object({ tool: z.literal("fs.delete"), path: pathSchema, recursive: z.boolean().optional(), confirm: z.boolean() }),
      z.object({ tool: z.literal("fs.move"), source: pathSchema, destination: pathSchema, overwrite: z.boolean().optional() }),
      z.object({ tool: z.literal("fs.copy"), source: pathSchema, destination: pathSchema, overwrite: z.boolean().optional() }),
      z.object({ tool: z.literal("fs.list"), path: z.string().max(1000).optional(), recursive: z.boolean().optional(), limit: z.number().int().min(1).max(1000).optional() }),
      z.object({ tool: z.literal("fs.search"), query: z.string().min(1).max(500), path: z.string().max(1000).optional(), caseSensitive: z.boolean().optional(), limit: z.number().int().min(1).max(1000).optional() }),
      z.object({ tool: z.literal("fs.exists"), path: pathSchema }),
      z.object({ tool: z.literal("code.search"), query: z.string().min(1).max(500), path: z.string().max(1000).optional(), caseSensitive: z.boolean().optional(), limit: z.number().int().min(1).max(1000).optional() }),
      z.object({ tool: z.literal("code.find_symbol"), symbol: z.string().min(1).max(200), path: z.string().max(1000).optional(), limit: z.number().int().min(1).max(1000).optional() }),
      z.object({ tool: z.literal("code.find_references"), symbol: z.string().min(1).max(200), path: z.string().max(1000).optional(), caseSensitive: z.boolean().optional(), limit: z.number().int().min(1).max(1000).optional() }),
      z.object({ tool: z.literal("code.find_definition"), symbol: z.string().min(1).max(200), path: z.string().max(1000).optional(), limit: z.number().int().min(1).max(1000).optional() }),
      z.object({ tool: z.literal("code.find_files"), pattern: z.string().min(1).max(500), path: z.string().max(1000).optional(), limit: z.number().int().min(1).max(1000).optional() }),
      z.object({ tool: z.literal("code.diagnostics"), path: z.string().max(1000).optional() }),
      z.object({ tool: z.literal("code.symbols"), path: z.string().max(1000).optional() }),
      z.object({ tool: z.literal("code.references"), path: pathSchema, line: z.number().int().min(1), column: z.number().int().min(1) }),
      z.object({ tool: z.literal("code.definition"), path: pathSchema, line: z.number().int().min(1), column: z.number().int().min(1) }),
      z.object({ tool: z.literal("code.ast"), path: pathSchema, maxNodes: z.number().int().min(1).max(500).optional() }),
    ]).parse(request.body);
    switch (body.tool) {
      case "fs.read": return tools.read(body.path, body.maxBytes);
      case "fs.write": return tools.write(body.path, body.content, body.overwrite);
      case "fs.edit": return tools.edit(body.path, body.edits);
      case "fs.patch": return tools.patch(body.patches);
      case "fs.delete": return tools.remove(body.path, body.recursive, body.confirm);
      case "fs.move": return tools.move(body.source, body.destination, body.overwrite);
      case "fs.copy": return tools.copy(body.source, body.destination, body.overwrite);
      case "fs.list": return tools.list(body.path, body.recursive, body.limit);
      case "fs.search": return tools.search(body.query, body.path, body.caseSensitive, body.limit);
      case "fs.exists": return tools.exists(body.path);
      case "code.search": return codeTools.search(body.query, body.path, body.caseSensitive, body.limit);
      case "code.find_symbol": return codeTools.findSymbol(body.symbol, body.path, body.limit);
      case "code.find_references": return codeTools.findReferences(body.symbol, body.path, body.caseSensitive, body.limit);
      case "code.find_definition": return codeTools.findDefinition(body.symbol, body.path, body.limit);
      case "code.find_files": return codeTools.findFiles(body.pattern, body.path, body.limit);
      case "code.diagnostics": return intelligence.diagnostics(body.path);
      case "code.symbols": return intelligence.symbols(body.path);
      case "code.references": return intelligence.references(body);
      case "code.definition": return intelligence.definition(body);
      case "code.ast": return intelligence.ast(body.path, body.maxNodes);
    }
  }));
}

async function run(reply: FastifyReply, operation: () => Promise<unknown>): Promise<unknown> {
  try { return await operation(); }
  catch (error) { if (error instanceof WorkspaceToolError) return reply.code(error.statusCode).send({ error: error.message, code: "workspace.tool" }); throw error; }
}
