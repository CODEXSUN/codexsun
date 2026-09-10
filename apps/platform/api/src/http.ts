import type { FastifyInstance, FastifyRequest } from 'fastify'
import {
  anonymousPlatformActor,
  PlatformAuthorizationError,
  type PlatformActor,
  type PlatformRequestContextStore,
} from '@codexsun/platform-core-api'
import { randomUUID } from 'node:crypto'
import { ZodError } from 'zod'

const correlationIdPattern = /^[a-zA-Z0-9._:-]{1,128}$/

export function registerHttpLifecycle(
  server: FastifyInstance,
  requestContext: PlatformRequestContextStore,
  resolveActor: (request: FastifyRequest) => Promise<PlatformActor> | PlatformActor = () =>
    anonymousPlatformActor,
): void {
  const requestControllers = new Map<string, AbortController>()

  server.addHook('onRequest', (request, reply, done) => {
    const correlationId = getCorrelationId(request)
    const controller = new AbortController()
    requestControllers.set(request.id, controller)
    reply.header('x-correlation-id', correlationId)
    reply.header('x-request-id', request.id)
    Promise.resolve(resolveActor(request)).then(
      (actor) =>
        requestContext.run(
          {
            actor,
            correlationId,
            locale: getLocale(request),
            requestId: request.id,
            signal: controller.signal,
          },
          done,
        ),
      done,
    )
  })

  server.addHook('onResponse', async (request) => {
    requestControllers.get(request.id)?.abort('request complete')
    requestControllers.delete(request.id)
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
    if (error instanceof PlatformAuthorizationError) {
      await reply.status(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'The account lacks the required permission.' },
        meta: createResponseMeta(request),
      })
      return
    }
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

function getLocale(request: FastifyRequest): string | undefined {
  const header = request.headers['accept-language']
  const value = Array.isArray(header) ? header[0] : header
  return value?.split(',')[0]?.trim() || undefined
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
