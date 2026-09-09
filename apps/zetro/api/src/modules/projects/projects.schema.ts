import { z } from 'zod'

export const createProjectSchema = z.strictObject({
  name: z.string().trim().min(1).max(80),
  repositoryPath: z.string().trim().min(1).max(1_024),
})

export const updateProjectSchema = z
  .strictObject({
    archived: z.boolean().optional(),
    githubUrl: z
      .string()
      .trim()
      .max(2_048)
      .refine(isOptionalHttpUrl, 'Use a valid URL.')
      .optional(),
    logoColor: z
      .string()
      .trim()
      .regex(/^#[0-9a-f]{6}$/i, 'Use a six-digit hex color.')
      .optional(),
    logoText: z.string().trim().min(1).max(3).optional(),
    name: z.string().trim().min(1).max(80).optional(),
    repositoryPath: z.string().trim().min(1).max(1_024).optional(),
    tagline: z.string().trim().max(160).optional(),
  })
  .refine((input) => Object.values(input).some((value) => value !== undefined), {
    message: 'Provide a project change.',
  })

export const projectListQuerySchema = z.strictObject({
  archived: z
    .enum(['false', 'true'])
    .default('false')
    .transform((value) => value === 'true'),
})

export const projectDirectoryQuerySchema = z.strictObject({
  path: z.string().trim().min(1).max(1_024),
})

export const projectParametersSchema = z.strictObject({
  projectId: z.string().uuid(),
})

function isOptionalHttpUrl(value: string) {
  if (!value) return true
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
