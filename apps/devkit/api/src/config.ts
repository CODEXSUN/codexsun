import { config as loadDotenv } from 'dotenv'
import { resolve } from 'node:path'
import { z } from 'zod'

const projectRoot = resolve(process.cwd(), '../../..')
loadDotenv({ path: resolve(projectRoot, '.env'), quiet: true })

const environmentSchema = z.object({
  DEVKIT_API_HOST: z.string().default('127.0.0.1'),
  DEVKIT_API_PORT: z.coerce.number().int().min(6000).max(6999).default(6070),
  DEVKIT_REGISTRY_PATH: z.string().default('storage/app/private/devkit/project-registry.json'),
  DEVKIT_WEB_PORT: z.coerce.number().int().min(6000).max(6999).default(6080),
})

export type DevkitEnvironment = z.infer<typeof environmentSchema>
export const getProjectRoot = () => projectRoot
export const readEnvironment = (): DevkitEnvironment => environmentSchema.parse(process.env)
