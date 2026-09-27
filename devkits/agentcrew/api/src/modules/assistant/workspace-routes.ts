import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { WorkspaceTools } from "./workspace-tools.js";

const queryPath = z.object({ path: z.string().max(1000).default("") });

export function registerWorkspaceRoutes(app: FastifyInstance, tools: WorkspaceTools): void {
  const prefix = "/api/v1/agentcrew/workspace";
  app.get(`${prefix}/files`, async (request) => {
    const query = z.object({
      path: z.string().max(1000).default(""),
      recursive: z.coerce.boolean().default(true),
      limit: z.coerce.number().int().min(1).max(1000).default(200),
    }).parse(request.query);
    return tools.list(query.path, query.recursive, query.limit);
  });
  app.get(`${prefix}/file`, async (request) => {
    const query = z.object({ path: z.string().min(1).max(1000), maxBytes: z.coerce.number().int().min(1).max(200_000).default(200_000) }).parse(request.query);
    return tools.read(query.path, query.maxBytes);
  });
  app.get(`${prefix}/stat`, async (request) => tools.stat(queryPath.extend({ path: z.string().min(1).max(1000) }).parse(request.query).path));
}
