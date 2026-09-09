import { z } from 'zod'

const environmentSchema = z.object({
  AGENT_CREW_API_HOST: z.string().default('127.0.0.1'),
  AGENT_CREW_API_PORT: z.coerce.number().int().min(6000).max(6999).default(6100),
  AGENT_CREW_ALLOWED_ORIGINS: z.string().default('http://127.0.0.1:6110'),
  AGENT_CREW_RUNNER_TOKEN: z.string().min(16).default('local-agent-crew-token'),
  AGENT_CREW_WORKER_URL: z.string().url().default('http://127.0.0.1:6120'),
})

export type AgentCrewEnvironment = z.infer<typeof environmentSchema>

export function readEnvironment(): AgentCrewEnvironment {
  return environmentSchema.parse(process.env)
}
