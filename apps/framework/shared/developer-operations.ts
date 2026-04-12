import { z } from "zod"

export const developerOperationActionSchema = z.enum([
  "build_frontend",
  "clear_caches",
  "force_clean_rebuild",
])

export const developerOperationPayloadSchema = z.object({
  action: developerOperationActionSchema,
})

export const developerOperationResponseSchema = z.object({
  action: developerOperationActionSchema,
  completed: z.boolean(),
  restartScheduled: z.boolean(),
  clearedPaths: z.array(z.string()),
  message: z.string().min(1),
  rootPath: z.string().min(1),
})

export type DeveloperOperationAction = z.infer<typeof developerOperationActionSchema>
export type DeveloperOperationPayload = z.infer<typeof developerOperationPayloadSchema>
export type DeveloperOperationResponse = z.infer<typeof developerOperationResponseSchema>
