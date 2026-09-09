import Fastify from 'fastify'
import { pathToFileURL } from 'node:url'
import { readEnvironment } from './config.js'
import { registerCrewRunner } from './modules/crew-runner/index.js'

export async function createServer() {
  const environment = readEnvironment()
  const server = Fastify({ bodyLimit: 1_000_000, logger: true })
  await registerCrewRunner(server, environment)
  return { environment, server }
}

export async function startServer() {
  const { environment, server } = await createServer()
  await server.listen({ host: '0.0.0.0', port: environment.AGENT_CREW_RUNNER_PORT })
  let closing = false
  const close = async () => {
    if (!closing) {
      closing = true
      await server.close()
    }
  }
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => void close())
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  startServer().catch((error: unknown) => {
    console.error('Agent Crew worker failed to start.', error)
    process.exitCode = 1
  })
}
