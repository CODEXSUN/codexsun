import { zetroAgentTaskListResponseSchema, zetroAgentTaskResponseSchema, zetroApiVersion, zetroCreateAgentTaskSchema } from "@codexsun/zetro-contracts";
import type { FastifyInstance } from "fastify";
import { AgentTaskNotFoundError, AgentTaskService } from "./task-service";

export async function registerAgentTaskRoutes(app: FastifyInstance, service: AgentTaskService): Promise<void> {
  app.get("/api/zetro/v1/tasks", async () =>
    zetroAgentTaskListResponseSchema.parse({ data: { tasks: service.listTasks() }, version: zetroApiVersion }),
  );

  app.post<{ Body: unknown }>("/api/zetro/v1/tasks", async (request, reply) => {
    const input = zetroCreateAgentTaskSchema.safeParse(request.body);
    if (!input.success) return reply.code(400).send({ error: input.error.issues[0]?.message ?? "The prepared task is invalid.", code: "zetro.task-invalid" });
    try {
      const task = service.createTask(input.data);
      return zetroAgentTaskResponseSchema.parse({ data: { task }, version: zetroApiVersion });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Zetro could not create the agent task.";
      return reply.code(400).send({ error: message, code: "zetro.task-handover" });
    }
  });

  app.post<{ Params: { id: string } }>("/api/zetro/v1/tasks/:id/deliver", async (request, reply) => {
    try {
      const task = await service.deliverTask(request.params.id);
      return zetroAgentTaskResponseSchema.parse({ data: { task }, version: zetroApiVersion });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Zetro could not deliver the task to Zuno.";
      if (error instanceof AgentTaskNotFoundError) return reply.code(404).send({ error: message, code: "zetro.task-not-found" });
      return reply.code(502).send({ error: message, code: "zetro.task-delivery" });
    }
  });
}
