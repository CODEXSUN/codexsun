import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { GitTools, GitToolError } from "./git-tools.js";

export function registerGitRoutes(app: FastifyInstance, tools: GitTools): void {
  const prefix = "/api/v1/codeloop/git";
  app.get(`${prefix}/capabilities`, async () => tools.capabilities());
  app.post(`${prefix}/execute`, async (request, reply) => run(reply, async () => {
    const body = z.discriminatedUnion("tool", [
      z.object({ tool: z.literal("git.status") }),
      z.object({ tool: z.literal("git.diff"), staged: z.boolean().optional(), paths: z.array(z.string().max(1000)).max(100).optional() }),
      z.object({ tool: z.literal("git.log"), limit: z.number().int().min(1).max(100).optional() }),
      z.object({ tool: z.literal("git.branch"), action: z.enum(["list", "create", "delete"]).optional(), name: z.string().max(200).optional(), confirm: z.boolean().optional() }),
      z.object({ tool: z.literal("git.checkout"), name: z.string().max(200), confirm: z.boolean() }),
      z.object({ tool: z.literal("git.add"), paths: z.array(z.string().max(1000)).min(1).max(100), confirm: z.boolean() }),
      z.object({ tool: z.literal("git.commit"), message: z.string().max(200), confirm: z.boolean() }),
      z.object({ tool: z.literal("git.reset"), mode: z.enum(["soft", "mixed", "hard"]).optional(), target: z.string().max(200).optional(), confirm: z.boolean(), confirmHard: z.boolean().optional() }),
      z.object({ tool: z.literal("git.stash"), action: z.enum(["list", "push", "pop", "apply", "drop"]).optional(), message: z.string().max(200).optional(), confirm: z.boolean().optional() }),
      z.object({ tool: z.literal("git.create_checkpoint"), confirm: z.boolean() }),
      z.object({ tool: z.literal("git.rollback"), id: z.string().max(100), confirm: z.boolean() }),
      z.object({ tool: z.literal("git.create_agent_branch"), name: z.string().max(200), confirm: z.boolean() }),
      z.object({ tool: z.literal("git.commit_task"), message: z.string().max(200), paths: z.array(z.string().max(1000)).min(1).max(100), confirm: z.boolean() }),
    ]).parse(request.body);
    switch (body.tool) {
      case "git.status": return tools.status();
      case "git.diff": return tools.diff(body.staged, body.paths);
      case "git.log": return tools.log(body.limit);
      case "git.branch": return tools.branch(body.action, body.name, body.confirm);
      case "git.checkout": return tools.checkout(body.name, body.confirm);
      case "git.add": return tools.add(body.paths, body.confirm);
      case "git.commit": return tools.commit(body.message, body.confirm);
      case "git.reset": return tools.reset(body.mode, body.target, body.confirm, body.confirmHard);
      case "git.stash": return tools.stash(body.action, body.message, body.confirm);
      case "git.create_checkpoint": return tools.createCheckpoint(body.confirm);
      case "git.rollback": return tools.rollback(body.id, body.confirm);
      case "git.create_agent_branch": return tools.createAgentBranch(body.name, body.confirm);
      case "git.commit_task": return tools.commitTask(body.message, body.paths, body.confirm);
    }
  }));
}

async function run(reply: FastifyReply, operation: () => Promise<unknown>): Promise<unknown> {
  try { return await operation(); }
  catch (error) { if (error instanceof GitToolError) return reply.code(error.statusCode).send({ error: error.message, code: "git.tool" }); throw error; }
}
