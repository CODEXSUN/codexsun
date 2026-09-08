import { config as loadDotenv } from 'dotenv'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const projectRoot = fileURLToPath(new URL('../../../../', import.meta.url))

loadDotenv({ path: new URL('../../../../.env', import.meta.url), quiet: true })

const environmentSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PLATFORM_API_HOST: z.string().min(1).default('127.0.0.1'),
  PLATFORM_API_PORT: z.coerce.number().int().min(6000).max(6999).default(6010),
  PLATFORM_WEB_ORIGIN: z.url().default('http://127.0.0.1:6021'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  LOG_PRETTY: z.enum(['true', 'false']).optional(),
  SHUTDOWN_GRACE_MS: z.coerce.number().int().min(1_000).max(60_000).default(10_000),
  BODY_LIMIT_BYTES: z.coerce.number().int().min(1_024).max(10_000_000).default(1_048_576),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(100_000).default(1_000),
  DATABASE_HOST: z.string().default('127.0.0.1'),
  DATABASE_PORT: z.coerce.number().int().min(1).max(65_535).default(3306),
  DATABASE_NAME: z.string().min(1).default('codexsun'),
  DATABASE_USER: z.string().min(1).default('codexsun'),
  DATABASE_PASSWORD: z.string().default(''),
  MODULE_RUNTIME_ENABLED: z.enum(['true', 'false']).default('true'),
  STORAGE_ROOT: z.literal('storage/app').default('storage/app'),
})

export type Environment = z.infer<typeof environmentSchema>

export function readEnvironment(source: NodeJS.ProcessEnv = process.env): Environment {
  return environmentSchema.parse(source)
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
