import type { FastifyInstance, FastifyRequest } from 'fastify'
import { randomUUID } from 'node:crypto'
import { ZodError } from 'zod'

const correlationIdPattern = /^[a-zA-Z0-9._:-]{1,128}$/

export function registerHttpLifecycle(server: FastifyInstance): void {
  server.addHook('onRequest', async (request, reply) => {
    const correlationId = getCorrelationId(request)
    reply.header('x-correlation-id', correlationId)
    reply.header('x-request-id', request.id)
  })

  server.setNotFoundHandler(async (request, reply) => {
    await reply.status(404).send({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'The requested API route does not exist.',
      },
      meta: createResponseMeta(request),
    })
  })

  server.setErrorHandler(async (error, request, reply) => {
    request.log.error({ err: error }, 'request failed')

    if (error instanceof ZodError) {
      await reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          details: error.flatten().fieldErrors,
          message: 'The request is invalid.',
        },
        meta: createResponseMeta(request),
      })
      return
    }

    const statusCode = normalizeStatusCode(getStatusCode(error))
    await reply.status(statusCode).send({
      success: false,
      error: {
        code: statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR',
        message:
          statusCode >= 500 ? 'The server could not complete the request.' : getErrorMessage(error),
      },
      meta: createResponseMeta(request),
    })
  })
}

export function createResponseMeta(request: FastifyRequest) {
  return {
    correlationId: getCorrelationId(request),
    requestId: request.id,
    timestamp: new Date().toISOString(),
  }
}

function getCorrelationId(request: FastifyRequest): string {
  const value = request.headers['x-correlation-id']
  const candidate = Array.isArray(value) ? value[0] : value

  if (candidate && correlationIdPattern.test(candidate)) {
    return candidate
  }

  return request.id || randomUUID()
}

function normalizeStatusCode(statusCode: number | undefined): number {
  if (statusCode && statusCode >= 400 && statusCode <= 599) {
    return statusCode
  }

  return 500
}

function getStatusCode(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('statusCode' in error)) {
    return undefined
  }

  return typeof error.statusCode === 'number' ? error.statusCode : undefined
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'The request could not be completed.'
}
