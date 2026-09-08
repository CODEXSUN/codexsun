import { z } from 'zod'

const runtimeConfigSchema = z.object({
  VITE_PLATFORM_API_URL: z.url().default('http://127.0.0.1:6010'),
})

export const runtimeConfig = runtimeConfigSchema.parse(import.meta.env)
