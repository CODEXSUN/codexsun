import { config as loadDotenv } from 'dotenv'
import { resolve } from 'node:path'
import { z } from 'zod'

const projectRoot = resolve(import.meta.dirname, '../../../..')
loadDotenv({ path: resolve(projectRoot, '.env'), quiet: true })

const environmentSchema = z.object({
  ORSHIP_API_HOST: z.string().default('127.0.0.1'),
  ORSHIP_API_PORT: z.coerce.number().int().min(6000).max(6999).default(6090),
  ORSHIP_CONTROL_ENABLED: z.enum(['true', 'false']).default('true'),
  ORSHIP_WEB_PORT: z.coerce.number().int().min(6000).max(6999).default(6091),
})

export type OrshipEnvironment = z.infer<typeof environmentSchema>
export const getProjectRoot = () => projectRoot
export const readEnvironment = (): OrshipEnvironment => environmentSchema.parse(process.env)
