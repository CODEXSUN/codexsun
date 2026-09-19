import { zetroAgentTaskListResponseSchema, zetroAgentTaskResponseSchema, zetroApiVersion, zetroCreateAgentTaskSchema } from "@codexsun/zetro-contracts";
import type { FastifyInstance } from "fastify";
import { AgentTaskService } from "./task-service.js";

export async function registerAgentTaskRoutes(app: FastifyInstance, service: AgentTaskService): Promise<void> {
  app.get("/api/zetro/v1/tasks", async () =>
    zetroAgentTaskListResponseSchema.parse({ data: { tasks: service.listTasks() }, version: zetroApiVersion }),
  );

  app.post<{ Body: unknown }>("/api/zetro/v1/tasks", async (request, reply) => {
    try {
      const task = service.createTask(zetroCreateAgentTaskSchema.parse(request.body));
      return zetroAgentTaskResponseSchema.parse({ data: { task }, version: zetroApiVersion });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Zetro could not create the agent task.";
      return reply.code(400).send({ error: message, code: "zetro.task-handover" });
    }
  });
}
