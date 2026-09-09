import assert from 'node:assert/strict'
import test from 'node:test'
import { CrewRunnerService } from '../src/modules/crew-runner/crew-runner.service.js'

test('runner reports unconfigured command providers without executing a workspace', async () => {
  const runner = new CrewRunnerService({
    AGENT_CREW_OLLAMA_URL: 'http://127.0.0.1:9',
    AGENT_CREW_RUNNER_PORT: 6120,
    AGENT_CREW_RUNNER_TOKEN: 'local-agent-crew-token',
    AGENT_CREW_WORKSPACE_ROOT: '/not-mounted',
    OPENCODE_MODEL: 'opencode/test',
  })
  const overview = await runner.overview()
  assert.equal(overview.providers.length, 3)
})
