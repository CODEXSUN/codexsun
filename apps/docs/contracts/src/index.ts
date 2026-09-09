import { z } from 'zod'

export const documentSummarySchema = z.object({
  aliases: z.array(z.string()),
  description: z.string(),
  links: z.array(z.string()),
  path: z.string(),
  slug: z.string(),
  tags: z.array(z.string()),
  title: z.string(),
  updatedAt: z.string(),
})

export const documentSchema = documentSummarySchema.extend({
  html: z.string(),
  source: z.string(),
  sourceHash: z.string().regex(/^[a-f0-9]{64}$/),
})

export const documentListResponseSchema = z.object({
  documents: z.array(documentSummarySchema),
  mode: z.enum(['database', 'filesystem', 'hybrid']),
})

export const documentResponseSchema = z.object({ document: documentSchema })
export const documentUpdateRequestSchema = z
  .object({
    source: z.string().max(1_000_000),
    sourceHash: z.string().regex(/^[a-f0-9]{64}$/),
    title: z.string().trim().min(1).max(255).optional(),
  })
  .strict()
export const documentUpdateResponseSchema = z.object({ document: documentSchema })
export const syncResponseSchema = z.object({ indexed: z.number(), status: z.literal('ok') })

export type Document = z.infer<typeof documentSchema>
export type DocumentSummary = z.infer<typeof documentSummarySchema>
export type DocumentListResponse = z.infer<typeof documentListResponseSchema>
export type DocumentUpdateRequest = z.infer<typeof documentUpdateRequestSchema>
