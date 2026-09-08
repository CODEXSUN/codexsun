import { basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { z } from 'zod'

const projectRoot = resolve(fileURLToPath(new URL('../../../../', import.meta.url)))

dotenv.config({ path: resolve(projectRoot, '.env') })

const environmentSchema = z.object({
  HOST: z.string().default('127.0.0.1'),
  STORAGE_ROOT: z.string().default('storage/app'),
  ZETRO_API_PORT: z.coerce.number().int().min(6000).max(6999).default(6050),
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

export type ZetroEnvironment = z.infer<typeof environmentSchema>

export function readEnvironment(): ZetroEnvironment {
  return environmentSchema.parse(process.env)
}

export function getProjectRoot(): string {
  return projectRoot
}
