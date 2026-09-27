import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { TerminalTools, TerminalToolError } from "./terminal-tools.js";

const commandSchema = z.string().min(1).max(10_000);
const cwdSchema = z.string().max(1000).optional();
const processIdSchema = z.string().min(1).max(200);

export function registerTerminalRoutes(app: FastifyInstance, tools: TerminalTools): void {
  const prefix = "/api/v1/codeloop/terminal";

  // Capabilities
  app.get(`${prefix}/capabilities`, async () => tools.capabilities());

  // List all tracked processes
  app.get(`${prefix}/processes`, async () => ({ processes: tools.listProcesses() }));

  // terminal.exec direct route
  app.post(`${prefix}/exec`, async (request, reply) => run(reply, () => {
    const body = z.object({
      command: commandSchema,
      cwd: cwdSchema,
      timeoutMs: z.number().int().min(1000).max(120_000).optional(),
      env: z.record(z.string()).optional(),
    }).parse(request.body);
    return tools.exec(body.command, body.cwd, body.timeoutMs, body.env);
  }));

  // terminal.background direct route
  app.post(`${prefix}/background`, async (request, reply) => run(reply, () => {
    const body = z.object({
      command: commandSchema,
      cwd: cwdSchema,
      env: z.record(z.string()).optional(),
    }).parse(request.body);
    return tools.background(body.command, body.cwd, body.env);
  }));

  // terminal.kill direct route
  app.post(`${prefix}/kill`, async (request, reply) => run(reply, () => {
    const body = z.object({
      processId: processIdSchema,
      signal: z.enum(["SIGTERM", "SIGKILL"]).optional(),
    }).parse(request.body);
    return tools.kill(body.processId, body.signal);
  }));

  // terminal.output direct route
  app.get(`${prefix}/output/:processId`, async (request, reply) => run(reply, () => {
    const params = z.object({ processId: processIdSchema }).parse(request.params);
    const query = z.object({
      offset: z.coerce.number().int().min(0).optional(),
      limit: z.coerce.number().int().min(1).max(1_000_000).optional(),
    }).parse(request.query);
    return tools.output(params.processId, query.offset, query.limit);
  }));

  // Generic execute endpoint matching discriminated union
  app.post(`${prefix}/execute`, async (request, reply) => run(reply, async () => {
    const body = z.discriminatedUnion("tool", [
      z.object({
        tool: z.literal("terminal.exec"),
        command: commandSchema,
        cwd: cwdSchema,
        timeoutMs: z.number().int().min(1000).max(120_000).optional(),
        env: z.record(z.string()).optional(),
      }),
      z.object({
        tool: z.literal("terminal.background"),
        command: commandSchema,
        cwd: cwdSchema,
        env: z.record(z.string()).optional(),
      }),
      z.object({
        tool: z.literal("terminal.kill"),
        processId: processIdSchema,
        signal: z.enum(["SIGTERM", "SIGKILL"]).optional(),
      }),
      z.object({
        tool: z.literal("terminal.output"),
        processId: processIdSchema,
        offset: z.number().int().min(0).optional(),
        limit: z.number().int().min(1).max(1_000_000).optional(),
      }),
    ]).parse(request.body);

    switch (body.tool) {
      case "terminal.exec":
        return tools.exec(body.command, body.cwd, body.timeoutMs, body.env);
      case "terminal.background":
        return tools.background(body.command, body.cwd, body.env);
      case "terminal.kill":
        return tools.kill(body.processId, body.signal);
      case "terminal.output":
        return tools.output(body.processId, body.offset, body.limit);
    }
  }));
}

async function run(reply: FastifyReply, operation: () => Promise<unknown> | unknown): Promise<unknown> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof TerminalToolError) {
      return reply.code(error.statusCode).send({ error: error.message, code: "terminal.tool" });
    }
    throw error;
  }
}
