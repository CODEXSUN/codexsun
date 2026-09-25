import { AddonService, createAddonProvider as createProvider, type AddonDefinition } from "@codexsun/addon-runtime";
export { routes } from "./api.js";

export const definition: AddonDefinition = {
  "id": "taskez",
  "label": "Taskez",
  "purpose": "Structured task management with assignments, priorities, status, dependencies, and execution tracking",
  "areas": [
    "tasks",
    "assignments",
    "execution"
  ],
  "contracts": [
    "taskez.v1"
  ],
  "publishedEvents": [
    "taskez.task.created",
    "taskez.task.assigned",
    "taskez.task.completed"
  ]
};

export function createAddonProvider() {
  return createProvider(definition);
}

export class TaskezService extends AddonService {
  constructor() {
    super(definition);
  }

  createTask(input: { assigneeId: string; priority: "low" | "medium" | "high"; title: string }) {
    return { ...this.create({ title: input.title, ownerId: input.assigneeId, metadata: { priority: input.priority } }), assigneeId: input.assigneeId, priority: input.priority };
  }
}

export function createTaskezService() {
  return new TaskezService();
}
