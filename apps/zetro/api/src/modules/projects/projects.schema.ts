import { z } from 'zod'

export const createProjectSchema = z.strictObject({
  name: z.string().trim().min(1).max(80),
  repositoryPath: z.string().trim().min(1).max(1_024),
})

export const updateProjectSchema = z
  .strictObject({
    archived: z.boolean().optional(),
    name: z.string().trim().min(1).max(80).optional(),
  })
  .refine((input) => input.archived !== undefined || input.name !== undefined, {
    message: 'Provide a project change.',
  })

export const projectListQuerySchema = z.strictObject({
  archived: z
    .enum(['false', 'true'])
    .default('false')
    .transform((value) => value === 'true'),
})

export const projectParametersSchema = z.strictObject({
  projectId: z.string().uuid(),
})
