import type { FastifyInstance, FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import type { CodexWorktreeService } from '../codex-connection/index.js'
import { removeWorktreeSchema, sweepWorktreesSchema } from './worktrees.schema.js'

export async function registerWorktreeRoutes(
  server: FastifyInstance,
  worktrees: CodexWorktreeService,
): Promise<void> {
  server.get('/api/v1/worktrees', async () => ({ worktrees: await worktrees.list() }))
  server.post('/api/v1/worktrees/remove', async (request, reply) =>
    handle(reply, async () => {
      const input = removeWorktreeSchema.parse(request.body)
      await worktrees.remove(input.path)
      return { removed: true }
    }),
  )
  server.post('/api/v1/worktrees/sweep', async (request, reply) =>
    handle(reply, async () => {
      const input = sweepWorktreesSchema.parse(request.body)
      return { removed: await worktrees.sweep(input.retentionDays) }
    }),
  )
}

async function handle(reply: FastifyReply, action: () => Promise<unknown>) {
  try {
    return await action()
  } catch (error) {
    if (error instanceof ZodError) return reply.code(400).send({ error: error.message })
    if (error instanceof Error) return reply.code(409).send({ error: error.message })
    throw error
  }
}
