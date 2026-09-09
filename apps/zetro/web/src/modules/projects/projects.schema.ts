import { z } from 'zod'

export const projectSchema = z.strictObject({
  archived: z.boolean(),
  createdAt: z.iso.datetime(),
  githubUrl: z.string(),
  id: z.uuid(),
  logoColor: z.string(),
  logoText: z.string(),
  name: z.string().min(1),
  repositoryPath: z.string().min(1),
  tagline: z.string(),
  updatedAt: z.iso.datetime(),
})

export const projectListResponseSchema = z.strictObject({ projects: z.array(projectSchema) })
export const projectResponseSchema = z.strictObject({ project: projectSchema })

export const projectDirectoryListingSchema = z.strictObject({
  directories: z.array(z.strictObject({ name: z.string(), path: z.string() })),
  parentPath: z.string().nullable(),
  path: z.string(),
})
