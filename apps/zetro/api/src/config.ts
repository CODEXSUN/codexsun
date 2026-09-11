import { PlatformConfiguration, PlatformEnvironmentLoader } from '@codexsun/platform-core-api'
import { resolve } from 'node:path'
import { z } from 'zod'

const projectRoot = resolve(import.meta.dirname, '../../../..')
const environmentSource = PlatformEnvironmentLoader.load({ path: resolve(projectRoot, '.env') })

const environmentSchema = z.object({
  ZETRO_API_HOST: z.string().default('127.0.0.1'),
  ZETRO_API_PORT: z.coerce.number().int().min(6000).max(6999).default(6050),
  ZETRO_DATABASE_PATH: z.string().default('storage/app/private/zetro/chat-v2.sqlite'),
  ZETRO_WEB_ORIGIN: z.string().url().default('http://127.0.0.1:6060'),
})

export type ZetroEnvironment = z.infer<typeof environmentSchema>
export const getProjectRoot = () => projectRoot
export const readEnvironment = (source: NodeJS.ProcessEnv = environmentSource): ZetroEnvironment =>
  PlatformConfiguration.parse(environmentSchema, source).values
