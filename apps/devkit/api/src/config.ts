import { PlatformConfiguration, PlatformEnvironmentLoader } from '@codexsun/platform-core-api'
import { resolve } from 'node:path'
import { z } from 'zod'

const projectRoot = resolve(import.meta.dirname, '../../../..')
const environmentSource = PlatformEnvironmentLoader.load({ path: resolve(projectRoot, '.env') })

const environmentSchema = z.object({
  DEVKIT_API_HOST: z.string().default('127.0.0.1'),
  DEVKIT_API_PORT: z.coerce.number().int().min(6000).max(6999).default(6070),
  DEVKIT_REGISTRY_PATH: z.string().default('storage/app/private/devkit/project-registry.json'),
  DEVKIT_WEB_PORT: z.coerce.number().int().min(6000).max(6999).default(6080),
})

export type DevkitEnvironment = z.infer<typeof environmentSchema>
export const getProjectRoot = () => projectRoot
export const readEnvironment = (source: NodeJS.ProcessEnv = environmentSource): DevkitEnvironment =>
  PlatformConfiguration.parse(environmentSchema, source).values
