import { PlatformConfiguration, PlatformEnvironmentLoader } from '@codexsun/platform-core-api'
import { resolve } from 'node:path'
import { z } from 'zod'

const projectRoot = resolve(import.meta.dirname, '../../../..')
const environmentSource = PlatformEnvironmentLoader.load({ path: resolve(projectRoot, '.env') })

const environmentSchema = z.object({
  ORSHIP_API_HOST: z.string().default('127.0.0.1'),
  ORSHIP_API_PORT: z.coerce.number().int().min(6000).max(6999).default(6090),
  ORSHIP_CLOUD_SSH_KEY_PATH: z.string().min(1).optional(),
  ORSHIP_CONTROL_ENABLED: z.enum(['true', 'false']).default('true'),
  ORSHIP_DOCKER_CONTROL_ENABLED: z.enum(['true', 'false']).default('false'),
  ORSHIP_DOCKER_MANAGED_LABEL: z
    .string()
    .regex(/^[A-Za-z0-9._/-]+=[A-Za-z0-9._/-]+$/u)
    .default('codexsun.orship.manage=true'),
  ORSHIP_DOCKER_SOCKET_PATH: z.string().min(1).default('/var/run/docker.sock'),
  ORSHIP_WEB_PORT: z.coerce.number().int().min(6000).max(6999).default(6091),
})

export type OrshipEnvironment = z.infer<typeof environmentSchema>
export const getProjectRoot = () => projectRoot
export const readEnvironment = (source: NodeJS.ProcessEnv = environmentSource): OrshipEnvironment =>
  PlatformConfiguration.parse(environmentSchema, source).values
