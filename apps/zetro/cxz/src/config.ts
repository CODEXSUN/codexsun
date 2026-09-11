import { z } from 'zod'

const schema = z.object({
  CXZ_HOST: z.string().default('0.0.0.0'),
  CXZ_PORT: z.coerce.number().int().min(6000).max(6999).default(6155),
  ZETRO_API_URL: z.string().url().default('http://127.0.0.1:6050'),
})

export type CxzEnvironment = z.infer<typeof schema>
export const readEnvironment = (source: NodeJS.ProcessEnv = process.env) => schema.parse(source)
