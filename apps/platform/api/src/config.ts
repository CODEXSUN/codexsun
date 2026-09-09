import { PlatformConfiguration, PlatformEnvironmentLoader } from '@codexsun/platform-core-api'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const projectRoot = fileURLToPath(new URL('../../../../', import.meta.url))
const environmentSource = PlatformEnvironmentLoader.load({
  path: resolve(projectRoot, '.env'),
})

const environmentSchema = z
  .object({
    APP_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PLATFORM_API_HOST: z.string().min(1).default('127.0.0.1'),
    PLATFORM_API_PORT: z.coerce.number().int().min(6000).max(6999).default(6010),
    PLATFORM_WEB_ORIGIN: z.url().default('http://127.0.0.1:6021'),
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
    LOG_PRETTY: z.enum(['true', 'false']).optional(),
    SHUTDOWN_GRACE_MS: z.coerce.number().int().min(1_000).max(60_000).default(10_000),
    BODY_LIMIT_BYTES: z.coerce.number().int().min(1_024).max(10_000_000).default(1_048_576),
    RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(100_000).default(1_000),
    DB_DRIVER: z.literal('mariadb').default('mariadb'),
    DB_HOST: z.string().min(1).default('127.0.0.1'),
    DB_PORT: z.coerce.number().int().min(1).max(65_535).default(3306),
    DB_USER: z.string().min(1).default('codexsun'),
    DB_PASSWORD: z.string().default(''),
    DB_MASTER_NAME: z.string().min(1).default('codexsun'),
    MODULE_RUNTIME_ENABLED: z.enum(['true', 'false']).default('true'),
    STORAGE_ROOT: z.literal('storage/app').default('storage/app'),
  })
  .superRefine((value, context) => {
    if (value.APP_ENV === 'production' && value.DB_PASSWORD.length === 0) {
      context.addIssue({
        code: 'custom',
        message: 'DB_PASSWORD is required in production.',
        path: ['DB_PASSWORD'],
      })
    }
  })

export type Environment = z.infer<typeof environmentSchema>

export function readEnvironment(source: NodeJS.ProcessEnv = environmentSource): Environment {
  return PlatformConfiguration.parse(environmentSchema, source).values
}

export function getProjectRoot(): string {
  return projectRoot
}

export function shouldUsePrettyLogs(environment: Environment): boolean {
  if (environment.LOG_PRETTY !== undefined) {
    return environment.LOG_PRETTY === 'true'
  }

  return environment.APP_ENV === 'development'
}
