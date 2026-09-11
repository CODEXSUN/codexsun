import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import Fastify from 'fastify'
import type { ProviderRunner } from '../../providers/index.js'
import { ChatService } from '../application/chat.service.js'
import { ChatRepository } from '../infrastructure/chat.repository.js'
import { registerChatRoutes } from './chat.routes.js'

test('conversation registry API creates, lists, renames, archives, and restores', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'zetro-chat-routes-test-'))
  const repository = new ChatRepository(join(directory, 'zetro.sqlite'))
  const service = new ChatService(repository, new IdleRunner())
  const server = Fastify()
  try {
    await registerChatRoutes(server, service)
    const createdResponse = await server.inject({
      method: 'POST',
      payload: { title: 'First workspace' },
      url: '/api/zetro/v1/chat/conversations',
    })
    assert.equal(createdResponse.statusCode, 201)
    const created = createdResponse.json<{ id: string; title: string }>()
    assert.equal(created.title, 'First workspace')

    const listResponse = await server.inject({
      method: 'GET',
      url: '/api/zetro/v1/chat/conversations',
    })
    assert.equal(listResponse.statusCode, 200)
    assert.equal(listResponse.json<{ conversations: unknown[] }>().conversations.length, 1)

    const archiveResponse = await server.inject({
      method: 'PATCH',
      payload: { archived: true, title: 'Saved workspace' },
      url: `/api/zetro/v1/chat/conversations/${created.id}`,
    })
    assert.equal(archiveResponse.statusCode, 200)
    assert.equal(archiveResponse.json<{ title: string }>().title, 'Saved workspace')

    const activeResponse = await server.inject({
      method: 'GET',
      url: '/api/zetro/v1/chat/conversations?scope=active',
    })
    assert.equal(activeResponse.json<{ conversations: unknown[] }>().conversations.length, 0)
    const archivedResponse = await server.inject({
      method: 'GET',
      url: '/api/zetro/v1/chat/conversations?scope=archived',
    })
    assert.equal(archivedResponse.json<{ conversations: unknown[] }>().conversations.length, 1)

    const restoreResponse = await server.inject({
      method: 'PATCH',
      payload: { archived: false },
      url: `/api/zetro/v1/chat/conversations/${created.id}`,
    })
    assert.equal(restoreResponse.statusCode, 200)
    assert.equal(restoreResponse.json<{ archivedAt?: number }>().archivedAt, undefined)
  } finally {
    await server.close()
    await service.close()
    rmSync(directory, { force: true, maxRetries: 3, recursive: true, retryDelay: 20 })
  }
})

class IdleRunner implements ProviderRunner {
  close() {
    return Promise.resolve()
  }

  getActiveConnection() {
    return {
      authStatus: 'authenticated',
      enabled: true,
      id: 'codex-local',
      kind: 'codex-app-server',
      label: 'Codex',
      model: 'test-model',
      reasoningEffort: 'low',
      updatedAt: 0,
    } as const
  }

  run(): never {
    throw new Error('The registry test does not run Codex.')
  }

  stop() {
    return Promise.resolve()
  }
}
