import { z } from 'zod'

const schema = z.object({
  AGENT_CREW_OLLAMA_URL: z.string().url().default('http://host.docker.internal:11434'),
  AGENT_CREW_RUNNER_TOKEN: z.string().min(16).default('local-agent-crew-token'),
  AGENT_CREW_RUNNER_PORT: z.coerce.number().int().min(6000).max(6999).default(6120),
  AGENT_CREW_WORKSPACE_ROOT: z.string().default('/workspaces'),
  CODEX_MODEL: z.string().optional(),
  OPENCODE_MODEL: z.string().default('opencode/nemotron-3.5-lightning-free'),
})

export type RunnerEnvironment = z.infer<typeof schema>
export const readEnvironment = () => schema.parse(process.env)
