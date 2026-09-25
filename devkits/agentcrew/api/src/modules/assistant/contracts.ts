import { z } from "zod";

export const taskInput = z
  .object({
    title: z.string().trim().min(1).max(100),
    prompt: z.string().trim().min(1).max(12000),
    skill: z.enum(["coding", "personal"]).default("coding"),
    think: z.boolean().default(false),
    rag: z.boolean().default(true),
    intervalMinutes: z.number().int().min(5).max(10080).nullable().default(null),
    maxRuns: z.number().int().min(1).max(20).default(1),
  })
  .strict();

export type TaskInput = z.infer<typeof taskInput>;
export type Task = TaskInput & { id: string; enabled: boolean; nextAt: number; count: number; failures: number };
export type Run = {
  id: string;
  taskId: string;
  status: string;
  answer: string;
  error: string;
  startedAt: number;
  finishedAt?: number;
};
export const noteInput = z
  .object({ title: z.string().trim().min(1).max(120), text: z.string().trim().min(1).max(24000) })
  .strict();

export const skills = {
  coding:
    "You are a coding assistant. State assumptions, suggest minimal patches and tests. Never claim to have read files or executed commands. You have no execution tools.",
  personal:
    "You are a personal assistant. Help organize plans, notes and checklists. Never claim to have sent messages, set reminders outside this app, or taken external actions.",
};
