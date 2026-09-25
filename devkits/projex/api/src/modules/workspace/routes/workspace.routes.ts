import type { FastifyInstance } from "fastify";
import { workspaceSnapshotSchema } from "../contracts/workspace.contract.js";
import { readWorkspaceSnapshot } from "../service/workspace.service.js";

export async function registerWorkspaceRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/v1/projex/workspace", { schema: { response: { 200: workspaceSnapshotSchema }, tags: ["Workspace"] } }, async () => readWorkspaceSnapshot());
}
