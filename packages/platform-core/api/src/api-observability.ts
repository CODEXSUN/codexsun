import {
  context,
  isSpanContextValid,
  metrics,
  propagation,
  SpanKind,
  SpanStatusCode,
  trace,
  type Span,
} from '@opentelemetry/api'
import { LogController, type FastifyInstance, type FastifyServerOptions } from 'fastify'
import { randomUUID } from 'node:crypto'
import type { IncomingMessage } from 'node:http'
import { performance } from 'node:perf_hooks'
import { createPlatformLogger, resolvePlatformServiceIdentity } from './logging.js'
import type { PlatformServiceIdentity } from './logging.js'
import { PlatformTelemetry } from './telemetry.js'

interface RequestTelemetry {
  method: string
  span: Span
  startedAt: number
}

export class PlatformApiObservability {
  readonly logger
  private readonly identity
  private readonly telemetry

  constructor(
    identity: PlatformServiceIdentity,
    private readonly source: NodeJS.ProcessEnv = process.env,
  ) {
    this.identity = resolvePlatformServiceIdentity(identity, source)
    this.logger = createPlatformLogger(identity, source)
    this.telemetry = new PlatformTelemetry(identity, source)
  }

  start(): void {
    const started = this.telemetry.start()
    this.logger.info(
      { event: 'observability.ready', telemetryEnabled: started },
      'observability initialized',
    )
  }

  fastifyOptions(): Pick<FastifyServerOptions, 'genReqId' | 'loggerInstance' | 'logController'> {
    return {
      genReqId: createRequestId,
      loggerInstance: this.logger,
      logController: new LogController({
        disableRequestLogging: true,
        requestIdLogLabel: 'requestId',
      }),
    }
  }

  register(server: FastifyInstance): void {
    registerHttpTelemetry(server, this.identity)
  }

  reportStartupFailure(error: unknown): void {
    this.logger.fatal(
      { err: error, event: 'runtime.startup.failed' },
      `${this.identity.component} startup failed`,
    )
  }

  shutdown(): Promise<void> {
    return this.telemetry.shutdown()
  }
}

function registerHttpTelemetry(
  server: FastifyInstance,
  identity: ReturnType<typeof resolvePlatformServiceIdentity>,
): void {
  const tracer = trace.getTracer(identity.component, identity.version)
  const meter = metrics.getMeter(identity.component, identity.version)
  const requestCount = meter.createCounter('http.server.request.count')
  const requestDuration = meter.createHistogram('http.server.request.duration', { unit: 's' })
  const requests = new WeakMap<object, RequestTelemetry>()

  server.addHook('onRequest', (request, reply, done) => {
    const correlationId = readHeader(request.headers['x-correlation-id']) ?? request.id
    const parentContext = propagation.extract(context.active(), request.headers)
    const span = tracer.startSpan(
      `HTTP ${request.method}`,
      {
        attributes: {
          'http.request.method': request.method,
          'server.address': request.hostname,
          'url.path': request.url.split('?')[0] ?? request.url,
        },
        kind: SpanKind.SERVER,
      },
      parentContext,
    )
    const spanContext = span.spanContext()
    request.log = request.log.child({ correlationId, ...readTraceFields(spanContext) })
    reply.header('x-correlation-id', correlationId)
    reply.header('x-request-id', request.id)
    requests.set(request, { method: request.method, span, startedAt: performance.now() })
    request.log.debug(
      { event: 'http.request.started', method: request.method, url: request.url },
      'request started',
    )
    context.with(trace.setSpan(parentContext, span), done)
  })

  server.addHook('onError', (request, _reply, error, done) => {
    const active = requests.get(request)
    active?.span.recordException(error)
    active?.span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
    request.log.error({ err: error, event: 'http.request.failed' }, 'request failed')
    done()
  })

  server.addHook('onResponse', (request, reply, done) => {
    const active = requests.get(request)
    if (!active) return done()
    const route = request.routeOptions.url || 'unmatched'
    const attributes = {
      'http.request.method': active.method,
      'http.response.status_code': reply.statusCode,
      'http.route': route,
    }
    active.span.updateName(`${active.method} ${route}`)
    active.span.setAttributes(attributes)
    if (reply.statusCode >= 500) active.span.setStatus({ code: SpanStatusCode.ERROR })
    requestCount.add(1, attributes)
    const durationSeconds = (performance.now() - active.startedAt) / 1_000
    requestDuration.record(durationSeconds, attributes)
    logCompletedRequest(request.log, {
      durationSeconds,
      event: 'http.request.completed',
      method: active.method,
      route,
      statusCode: reply.statusCode,
    })
    active.span.end()
    requests.delete(request)
    done()
  })
}

function logCompletedRequest(
  logger: FastifyInstance['log'],
  details: {
    durationSeconds: number
    event: string
    method: string
    route: string
    statusCode: number
  },
) {
  if (details.statusCode >= 500) logger.warn(details, 'request completed with failure')
  else if (details.route.startsWith('/health')) logger.debug(details, 'health request completed')
  else logger.info(details, 'request completed')
}

function readTraceFields(spanContext: ReturnType<Span['spanContext']>) {
  return isSpanContextValid(spanContext)
    ? { spanId: spanContext.spanId, traceId: spanContext.traceId }
    : {}
}

function createRequestId(request: IncomingMessage): string {
  return readHeader(request.headers['x-request-id']) ?? randomUUID()
}

function readHeader(value: string | readonly string[] | undefined): string | undefined {
  const candidate = Array.isArray(value) ? value[0] : value
  if (!candidate || candidate.length > 128) return undefined
  return /^[a-zA-Z0-9._:/-]+$/u.test(candidate) ? candidate : undefined
}
