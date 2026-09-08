import { z } from 'zod'

export const projectSchema = z.strictObject({
  archived: z.boolean(),
  createdAt: z.iso.datetime(),
  id: z.uuid(),
  name: z.string().min(1),
  repositoryPath: z.string().min(1),
  updatedAt: z.iso.datetime(),
})

export const projectListResponseSchema = z.strictObject({ projects: z.array(projectSchema) })
export const projectResponseSchema = z.strictObject({ project: projectSchema })
