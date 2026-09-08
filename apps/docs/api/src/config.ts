import { config as loadDotenv } from 'dotenv'
import { resolve } from 'node:path'
import { z } from 'zod'

const projectRoot = resolve(process.cwd(), '../../..')

loadDotenv({ path: resolve(projectRoot, '.env') })

const environmentSchema = z.object({
  DATABASE_HOST: z.string().default('127.0.0.1'),
  DATABASE_NAME: z.string().min(1).default('codexsun'),
  DATABASE_PASSWORD: z.string().default(''),
  DATABASE_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
  DATABASE_USER: z.string().min(1).default('codexsun'),
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

export function readEnvironment(): DocsEnvironment {
  return environmentSchema.parse(process.env)
}
