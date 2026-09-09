import { basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PlatformConfiguration, PlatformEnvironmentLoader } from '@codexsun/platform-core-api'
import { z } from 'zod'

const sourceProjectRoot = resolve(fileURLToPath(new URL('../../../../', import.meta.url)))
const environmentSource = PlatformEnvironmentLoader.load({
  path: resolve(sourceProjectRoot, '.env'),
})
const projectRoot = resolve(environmentSource.ZETRO_PROJECT_ROOT ?? sourceProjectRoot)

const environmentSchema = z
  .object({
    APP_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DB_DRIVER: z.enum(['mariadb', 'sqlite']).default('sqlite'),
    DB_HOST: z.string().min(1).default('127.0.0.1'),
    DB_MASTER_NAME: z.string().min(1).default('codexsun'),
    DB_PASSWORD: z.string().default(''),
    DB_PORT: z.coerce.number().int().min(1).max(65_535).default(3306),
    DB_USER: z.string().min(1).default('codexsun'),
    HOST: z.string().default('127.0.0.1'),
    REDIS_URL: z.string().url().optional(),
    STORAGE_ROOT: z.string().default('storage/app'),
    ZETRO_ALLOWED_ORIGINS: z
      .string()
      .default('http://127.0.0.1:6060,http://tauri.localhost,https://tauri.localhost'),
    ZETRO_API_PORT: z.coerce.number().int().min(6000).max(6999).default(6050),
    ZETRO_CONNECTED_APP_TOKEN: z.string().min(32).optional(),
    ZETRO_DESKTOP_SESSION_TOKEN: z.string().min(32).optional(),
    ZETRO_QUEUE_DRIVER: z.enum(['bullmq', 'local']).default('local'),
    ZETRO_SQLITE_PATH: z.string().min(1).default('private/zetro/zetro.sqlite'),
    ZETRO_WEB_PORT: z.coerce.number().int().min(6000).max(6999).default(6060),
    ZETRO_CODEX_API_KEY: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.string().min(1).optional(),
    ),
    ZETRO_CODEX_BASE_URL: z.string().url().default('https://api.openai.com/v1'),
    ZETRO_CODEX_COMMAND: z.string().min(1).default('codex'),
    ZETRO_CODEX_MODEL: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.string().min(1).optional(),
    ),
    ZETRO_WORKTREE_ROOT: z
      .string()
      .min(1)
      .default(resolve(projectRoot, '..', '.zetro-worktrees', basename(projectRoot))),
  })
  .superRefine((value, context) => {
    if (value.DB_DRIVER === 'mariadb' && value.APP_ENV === 'production' && !value.DB_PASSWORD) {
      context.addIssue({
        code: 'custom',
        message: 'DB_PASSWORD is required for production MariaDB storage.',
        path: ['DB_PASSWORD'],
      })
    }
    if (value.ZETRO_QUEUE_DRIVER === 'bullmq' && !value.REDIS_URL) {
      context.addIssue({
        code: 'custom',
        message: 'REDIS_URL is required when the BullMQ queue is enabled.',
        path: ['REDIS_URL'],
      })
    }
  })

export type ZetroEnvironment = z.infer<typeof environmentSchema>

export function readEnvironment(source: NodeJS.ProcessEnv = environmentSource): ZetroEnvironment {
  return PlatformConfiguration.parse(environmentSchema, {
    ...source,
    DB_DRIVER: source.ZETRO_DB_DRIVER ?? 'sqlite',
  }).values
}

export function getProjectRoot(): string {
  return projectRoot
}
