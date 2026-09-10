import { z } from 'zod'
import { codexModels, codexReasoningEfforts } from '../codex-connection/index.js'

export const supervisorJobSchema = z
  .object({
    projectId: z.string().uuid(),
    prompt: z.string().trim().min(1).max(20_000),
    scope: z
      .object({
        application: z.string().trim().min(1).max(100),
        folderPath: z.string().trim().min(1).max(500),
        module: z.string().trim().min(1).max(100),
      })
      .strict(),
    workflow: z.enum(['develop', 'document', 'review', 'test']).default('review'),
    model: z.enum(codexModels).optional(),
    reasoningEffort: z.enum(codexReasoningEfforts).default('medium'),
    approved: z.literal(true),
  })
  .strict()

export const supervisorTaskParams = z.object({ taskId: z.string().uuid() }).strict()
export const supervisorProjectSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    repositoryPath: z.string().trim().min(1).max(1000),
    approved: z.literal(true),
  })
  .strict()
export type SupervisorJobInput = z.infer<typeof supervisorJobSchema>

export const supervisorExecutionSchema = supervisorJobSchema.extend({
  conversationId: z.string().uuid(),
})
