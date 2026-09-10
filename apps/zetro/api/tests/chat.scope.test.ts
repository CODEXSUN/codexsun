import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { validateChatWorkspaceScope } from '../src/modules/chat/chat.scope.js'
import { chatWorkspaceScopeSchema } from '../src/modules/chat/chat.schema.js'

test('binds Platform and explicit documentation roots while rejecting stale or escaped scope', async () => {
  const root = await mkdtemp(join(tmpdir(), 'zetro-scope-'))
  try {
    for (const path of ['apps/platform', 'apps/zetro', 'assist/records/platform', 'assist/tasks']) {
      await mkdir(join(root, path), { recursive: true })
    }
    const scope = {
      application: 'platform',
      module: 'identity',
      folderPath: 'apps/platform',
      documentationPaths: ['assist/records/platform', 'assist/tasks'],
    }
    assert.deepEqual(
      await validateChatWorkspaceScope(root, chatWorkspaceScopeSchema.parse(scope)),
      scope,
    )
    await assert.rejects(
      validateChatWorkspaceScope(root, { ...scope, folderPath: 'apps/zetro' }),
      /Application must match/,
    )
    for (const path of [
      '.',
      'assist',
      '../outside',
      'apps/zetro',
      'assist/../apps/zetro',
      'assist/missing',
    ]) {
      await assert.rejects(
        validateChatWorkspaceScope(root, { ...scope, documentationPaths: [path] }),
      )
    }
    await symlink(
      join(root, 'apps/zetro'),
      join(root, 'assist/redirect'),
      process.platform === 'win32' ? 'junction' : 'dir',
    )
    await assert.rejects(
      validateChatWorkspaceScope(root, { ...scope, documentationPaths: ['assist/redirect'] }),
      /redirected/,
    )
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
