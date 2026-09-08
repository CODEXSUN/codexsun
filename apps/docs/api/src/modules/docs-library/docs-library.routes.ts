import {
  documentListResponseSchema,
  documentResponseSchema,
  syncResponseSchema,
} from '@codexsun/docs-contracts'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { DocsEnvironment } from '../../config.js'
import { DocsLibraryService } from './docs-library.service.js'

const documentParamsSchema = z.object({
  '*': z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9/-]+$/),
})

export async function registerDocsLibraryRoutes(
  server: FastifyInstance,
  environment: DocsEnvironment,
  service: DocsLibraryService,
): Promise<void> {
  server.get('/api/docs/v1/documents', async () => {
    return documentListResponseSchema.parse({
      documents: await service.listDocuments(),
      mode: environment.DOCS_INDEX_MODE,
    })
  })

  server.get('/api/docs/v1/documents/*', async (request, reply) => {
    const { '*': slug } = documentParamsSchema.parse(request.params)
    const document = await service.getDocument(slug)
    return document
      ? documentResponseSchema.parse({ document })
      : reply.code(404).send({ error: 'Document not found.' })
  })

  server.post('/api/docs/v1/index/sync', async () => {
    return syncResponseSchema.parse({ indexed: await service.syncIndex(), status: 'ok' })
  })
}
