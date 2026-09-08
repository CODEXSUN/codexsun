import type { FastifyServerOptions } from 'fastify'
import type { Environment } from './config.js'
import { shouldUsePrettyLogs } from './config.js'

export function createLoggerOptions(environment: Environment): FastifyServerOptions['logger'] {
  const baseOptions = {
    base: {
      environment: environment.APP_ENV,
      service: 'platform-api',
    },
    level: environment.LOG_LEVEL,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'request.headers.authorization',
        'request.headers.cookie',
      ],
      censor: '[REDACTED]',
    },
  }

  if (!shouldUsePrettyLogs(environment)) {
    return baseOptions
  }

  return {
    ...baseOptions,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        singleLine: true,
        translateTime: 'SYS:standard',
      },
    },
  }
}
