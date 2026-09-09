import { z } from 'zod'

export const createRunSchema = z.object({
  model: z.string().trim().max(160).optional(),
  prompt: z.string().trim().min(1).max(20_000),
  provider: z.enum(['codex', 'opencode', 'ollama']),
  workspaceId: z.string().regex(/^[a-z0-9][a-z0-9-]{0,62}$/),
})

export type CreateRunInput = z.infer<typeof createRunSchema>
