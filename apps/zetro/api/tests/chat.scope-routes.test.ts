import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import Fastify from 'fastify'
import { registerChatRoutes } from '../src/modules/chat/chat.routes.js'
import type { ChatService } from '../src/modules/chat/chat.service.js'
import type { ChatConversationService } from '../src/modules/chat/chat.conversation.service.js'
import type { ProjectService } from '../src/modules/projects/projects.service.js'
import { supervisorJobSchema } from '../src/modules/supervisor/supervisor.schema.js'

test('validates a draft scope over HTTP without creating a conversation or starting a turn', async () => {
  const root = await mkdtemp(join(tmpdir(), 'zetro-scope-http-'))
  const server = Fastify()
  try {
    await mkdir(join(root, 'apps/platform'), { recursive: true })
    await mkdir(join(root, 'assist/tasks'), { recursive: true })
    const projectId = '00000000-0000-4000-8000-000000000001'
    const projects = {
      get: () => ({ id: projectId, repositoryPath: root, archived: false }),
    } as unknown as ProjectService
    await registerChatRoutes(server, {} as ChatService, {} as ChatConversationService, projects)
    const scope = {
      application: 'platform',
      module: 'identity',
      folderPath: 'apps/platform',
      documentationPaths: ['assist/tasks'],
    }
    const url = '/api/v1/chat/workspace-scope/validate'
    const response = await server.inject({ method: 'POST', url, payload: { projectId, scope } })
    assert.equal(response.statusCode, 200)
    assert.deepEqual(response.json(), { scope })
    for (const invalid of [
      { ...scope, folderPath: 'apps/platform/../zetro' },
      { ...scope, documentationPaths: ['assist/missing'] },
    ]) {
      assert.equal(
        (await server.inject({ method: 'POST', url, payload: { projectId, scope: invalid } }))
          .statusCode,
        400,
      )
    }
    assert.equal(
      (await server.inject({ method: 'POST', url, payload: { projectId, scope, unknown: true } }))
        .statusCode,
      400,
    )
    assert.deepEqual(
      supervisorJobSchema.parse({ projectId, prompt: 'Inspect scope', scope, approved: true }).scope
        .documentationPaths,
      ['assist/tasks'],
    )
  } finally {
    await server.close()
    await rm(root, { recursive: true, force: true })
  }
})
