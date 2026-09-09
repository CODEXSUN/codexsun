import {
  documentationScanResponseSchema,
  documentListResponseSchema,
  documentResponseSchema,
  documentUpdateRequestSchema,
  documentUpdateResponseSchema,
  syncResponseSchema,
} from '@codexsun/docs-contracts'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { DocsEnvironment } from '../../config.js'
import { DocsLibraryService } from './docs-library.service.js'
import { DocsDocumentConflictError } from './docs-library.source.js'

const documentParamsSchema = z.object({
  '*': z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9/-]+$/),
})
const assetParamsSchema = z.object({
  '*': z
    .string()
    .min(1)
    .max(500)
    .regex(/^[a-zA-Z0-9._/-]+$/),
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

  server.get('/api/docs/v1/scan', async () => {
    return documentationScanResponseSchema.parse(await service.scanDocumentation())
  })

  server.get('/api/docs/v1/assets/*', async (request, reply) => {
    const { '*': assetPath } = assetParamsSchema.parse(request.params)
    const asset = await service.getAsset(assetPath)
    return asset
      ? reply.type(asset.contentType).send(asset.content)
      : reply.code(404).send({ error: 'Document asset not found.' })
  })

  server.get('/api/docs/v1/documents/*', async (request, reply) => {
    const { '*': slug } = documentParamsSchema.parse(request.params)
    const document = await service.getDocument(slug)
    return document
      ? documentResponseSchema.parse({ document })
      : reply.code(404).send({ error: 'Document not found.' })
  })

  server.put('/api/docs/v1/documents/*', async (request, reply) => {
    const { '*': slug } = documentParamsSchema.parse(request.params)
    const input = documentUpdateRequestSchema.parse(request.body)
    try {
      const document = await service.updateDocument(slug, input)
      return document
        ? documentUpdateResponseSchema.parse({ document })
        : reply.code(404).send({ error: 'Document not found.' })
    } catch (error) {
      if (error instanceof DocsDocumentConflictError) {
        return reply.code(409).send({ error: error.message })
      }
      throw error
    }
  })

  server.post('/api/docs/v1/index/sync', async () => {
    return syncResponseSchema.parse({ indexed: await service.syncIndex(), status: 'ok' })
  })
}
