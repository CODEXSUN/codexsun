import type { AgentCrewEnvironment } from '../../config.js'
import type { CreateRunInput } from './crew-control.schema.js'

export class CrewRunnerClient {
  public constructor(private readonly environment: AgentCrewEnvironment) {}

  public overview() {
    return this.request('/internal/overview')
  }

  public run(input: CreateRunInput) {
    return this.request('/internal/runs', { body: JSON.stringify(input), method: 'POST' })
  }

  private async request(path: string, init: RequestInit = {}) {
    const response = await fetch(`${this.environment.AGENT_CREW_WORKER_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.environment.AGENT_CREW_RUNNER_TOKEN}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
      signal: AbortSignal.timeout(130_000),
    })
    const body: unknown = await response.json().catch(() => null)
    if (!response.ok) throw new Error(readWorkerError(body, response.status))
    return body
  }
}

function readWorkerError(body: unknown, status: number): string {
  if (
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof body.error === 'string'
  ) {
    return body.error
  }
  return `Agent Crew worker returned HTTP ${status}.`
}
