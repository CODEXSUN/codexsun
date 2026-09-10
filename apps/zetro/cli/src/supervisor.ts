import { readFile } from 'node:fs/promises'
import type { CliContext } from './commands.js'

export async function runSupervisorCommand(args: string[], context: CliContext): Promise<void> {
  const [action = 'capabilities', value] = args
  const prefix = '/api/v1/supervisor'
  if (['capabilities', 'projects', 'jobs'].includes(action)) {
    return context.write(await context.client.get(`${prefix}/${action}`))
  }
  if (action === 'job' || action === 'stop') {
    if (!value || !/^[a-f0-9-]{36}$/iu.test(value)) throw new Error('A task UUID is required.')
    const path = `${prefix}/jobs/${value}`
    return context.write(
      action === 'stop'
        ? await context.client.post(`${path}/stop`)
        : await context.client.get(path),
    )
  }
  if (action === 'submit' || action === 'connect') {
    if (!value || !args.includes('--confirm'))
      throw new Error('Review the request file and add --confirm.')
    const request: unknown = JSON.parse(await readFile(value, 'utf8'))
    if (!request || typeof request !== 'object' || Array.isArray(request))
      throw new Error('Use a JSON request object.')
    return context.write(
      await context.client.post(`${prefix}/${action === 'connect' ? 'projects' : 'jobs'}`, {
        ...request,
        approved: true,
      }),
    )
  }
  throw new Error('Use supervisor capabilities, projects, connect, jobs, job, stop, or submit.')
}
