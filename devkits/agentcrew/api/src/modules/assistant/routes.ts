import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { noteInput, skills, taskInput, type Task } from "./contracts.js";
import type { AssistantService } from "./service.js";

export function registerAssistantRoutes(app: FastifyInstance, service: AssistantService): void {
  const prefix = "/api/v1/agentcrew";
  app.get(`${prefix}/status`, async () => ({ ...(await service.upstream.status()), ...service.state() }));
  app.get(`${prefix}/skills`, async () => ({ items: Object.keys(skills) }));
  app.get(`${prefix}/tasks`, async () => ({
    tasks: service.repository.list("task"),
    runs: service.repository.list("run"),
    ...service.state(),
  }));
  app.get(`${prefix}/logs`, async () => ({ items: service.repository.list("log") }));
  app.post(`${prefix}/tasks`, async (request, reply) => {
    const task = service.repository.create(taskInput.parse(request.body));
    return reply.code(201).send(task);
  });
  app.post(`${prefix}/tasks/:id/:action`, async (request, reply) => {
    const { id, action } = z
      .object({ id: z.string().uuid(), action: z.enum(["run", "pause", "enable"]) })
      .parse(request.params);
    const task = service.repository.find<Task>(id, "task");
    if (!task) return reply.code(404).send({ error: "Task not found." });
    if (action === "pause") service.pause(id);
    else if (action === "run") service.enqueue(id);
    else {
      const state = service.state();
      if (state.active === id || state.queued.includes(id))
        return reply.code(409).send({ error: "Wait for the current run before enabling its schedule." });
      if (!task.intervalMinutes || task.count >= task.maxRuns || task.failures >= 3)
        return reply.code(409).send({ error: "Schedule has no remaining budget. Create a new approved task." });
      service.repository.save("task", { ...task, enabled: true, nextAt: Date.now() });
      service.repository.log("schedule.enabled", id);
    }
    return reply.code(202).send({ accepted: true });
  });
  app.post(`${prefix}/knowledge`, async (request, reply) => {
    const note = noteInput.parse(request.body);
    const chunks = await service.retrieval.add(note.title, note.text);
    service.repository.log("knowledge.indexed");
    return reply.code(201).send({ chunks });
  });
}
