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
})

export const documentListResponseSchema = z.object({
  documents: z.array(documentSummarySchema),
  mode: z.enum(['database', 'filesystem', 'hybrid']),
})

export const documentResponseSchema = z.object({ document: documentSchema })
export const syncResponseSchema = z.object({ indexed: z.number(), status: z.literal('ok') })

export type Document = z.infer<typeof documentSchema>
export type DocumentSummary = z.infer<typeof documentSummarySchema>
export type DocumentListResponse = z.infer<typeof documentListResponseSchema>
