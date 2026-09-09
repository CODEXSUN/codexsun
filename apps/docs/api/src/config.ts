import { PlatformConfiguration, PlatformEnvironmentLoader } from '@codexsun/platform-core-api'
import { resolve } from 'node:path'
import { z } from 'zod'

const projectRoot = resolve(import.meta.dirname, '../../../..')
const environmentSource = PlatformEnvironmentLoader.load({
  path: resolve(projectRoot, '.env'),
})

const environmentSchema = z.object({
  DB_DRIVER: z.literal('mariadb').default('mariadb'),
  DB_HOST: z.string().min(1).default('127.0.0.1'),
  DB_MASTER_NAME: z.string().min(1).default('codexsun'),
  DB_PASSWORD: z.string().default(''),
  DB_PORT: z.coerce.number().int().min(1).max(65_535).default(3306),
  DB_USER: z.string().min(1).default('codexsun'),
  DOCS_INDEX_MODE: z.enum(['database', 'filesystem', 'hybrid']).default('hybrid'),
  DOCS_VAULT_PATH: z.string().default('apps/docs/content'),
  DOCS_API_HOST: z.string().default('127.0.0.1'),
  DOCS_API_PORT: z.coerce.number().int().min(6000).max(6999).default(6030),
  DOCS_WEB_PORT: z.coerce.number().int().min(6000).max(6999).default(6040),
})

export type DocsEnvironment = z.infer<typeof environmentSchema>

export function getProjectRoot(): string {
  return projectRoot
}

export function readEnvironment(source: NodeJS.ProcessEnv = environmentSource): DocsEnvironment {
  return PlatformConfiguration.parse(environmentSchema, source).values
}
