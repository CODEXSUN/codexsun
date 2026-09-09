import { basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PlatformConfiguration, PlatformEnvironmentLoader } from '@codexsun/platform-core-api'
import { z } from 'zod'

const sourceProjectRoot = resolve(fileURLToPath(new URL('../../../../', import.meta.url)))
const environmentSource = PlatformEnvironmentLoader.load({
  path: resolve(sourceProjectRoot, '.env'),
})
const projectRoot = resolve(environmentSource.ZETRO_PROJECT_ROOT ?? sourceProjectRoot)

const environmentSchema = z.object({
  HOST: z.string().default('127.0.0.1'),
  STORAGE_ROOT: z.string().default('storage/app'),
  ZETRO_ALLOWED_ORIGINS: z
    .string()
    .default('http://127.0.0.1:6060,http://tauri.localhost,https://tauri.localhost'),
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

export function readEnvironment(source: NodeJS.ProcessEnv = environmentSource): ZetroEnvironment {
  return PlatformConfiguration.parse(environmentSchema, source).values
}

export function getProjectRoot(): string {
  return projectRoot
}
