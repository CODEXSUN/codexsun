import { isSpanContextValid, trace } from '@opentelemetry/api'
import pino, { type DestinationStream, type Logger, type LoggerOptions } from 'pino'

export interface PlatformServiceIdentity {
  application: string
  component: string
  version?: string
}

export interface ResolvedPlatformServiceIdentity {
  application: string
  component: string
  environment: string
  version: string
}

const redactedPaths = [
  'password',
  'token',
  'apiKey',
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers.set-cookie',
  'request.headers.authorization',
  'request.headers.cookie',
  'request.headers.set-cookie',
  'headers.authorization',
  'headers.cookie',
  'headers.set-cookie',
]

export function createPlatformLogger(
  identity: PlatformServiceIdentity,
  source: NodeJS.ProcessEnv = process.env,
  destination?: DestinationStream,
): Logger {
  const resolved = resolvePlatformServiceIdentity(identity, source)
  const options: LoggerOptions = {
    base: {
      application: resolved.application,
      component: resolved.component,
      environment: resolved.environment,
      service: resolved.component,
      version: resolved.version,
    },
    level: readLogLevel(source.LOG_LEVEL),
    mixin: activeTraceBindings,
    redact: { censor: '[REDACTED]', paths: redactedPaths },
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  }

  if (shouldUsePrettyLogs(resolved.environment, source.LOG_PRETTY)) {
    options.transport = {
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        singleLine: true,
        translateTime: 'SYS:standard',
      },
      target: 'pino-pretty',
    }
  }

  return destination ? pino(options, destination) : pino(options)
}

export function resolvePlatformServiceIdentity(
  identity: PlatformServiceIdentity,
  source: NodeJS.ProcessEnv = process.env,
): ResolvedPlatformServiceIdentity {
  return {
    application: identity.application,
    component: identity.component,
    environment: source.APP_ENV ?? source.NODE_ENV ?? 'development',
    version: identity.version ?? source.CODEXSUN_VERSION ?? source.npm_package_version ?? 'unknown',
  }
}

function activeTraceBindings(): Record<string, string> {
  const spanContext = trace.getActiveSpan()?.spanContext()
  if (!spanContext || !isSpanContextValid(spanContext)) return {}
  return { spanId: spanContext.spanId, traceId: spanContext.traceId }
}

function shouldUsePrettyLogs(environment: string, configured?: string): boolean {
  if (configured !== undefined) return configured.toLowerCase() === 'true'
  return environment === 'development'
}

function readLogLevel(configured?: string): string {
  return ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'].includes(configured ?? '')
    ? configured!
    : 'info'
}
