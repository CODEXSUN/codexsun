import { z } from "zod";
export const taskSchema = z
  .object({
    title: z.string().trim().min(1, "Task title is required.").max(255),
    description: z.string().trim().max(10000),
    listInId: z.number().int().positive().nullable(),
    priorityId: z.number().int().positive("Choose a priority."),
    statusId: z.number().int().positive("Choose a status."),
    assignedUserId: z.number().int().positive().nullable(),
    dueDate: z.iso.date().nullable()
  })
  .strict();
