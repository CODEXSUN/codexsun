import assert from 'node:assert/strict'
import test from 'node:test'
import { runCommand } from '../src/commands.js'

test('requires confirmation before a push', async () => {
  await assert.rejects(
    runCommand(['git', 'push', 'project-id'], context()),
    /Review the preview, then add --confirm/,
  )
})

test('maps a repository script to the durable script-task route', async () => {
  const calls: Array<{ body?: unknown; path: string }> = []
  await runCommand(['run', 'project-id', 'test'], context(calls))
  assert.deepEqual(calls, [
    {
      body: { script: 'test' },
      path: '/api/v1/projects/project-id/developer-tools/script-tasks',
    },
  ])
})

test('requires confirmation for cleanup and release scripts', async () => {
  await assert.rejects(runCommand(['run', 'project-id', 'clean'], context()), /--confirm/)
  await assert.rejects(runCommand(['run', 'project-id', 'release:github'], context()), /--confirm/)
})

function context(calls: Array<{ body?: unknown; path: string }> = []) {
  return {
    client: {
      download: async () => ({ output: '', size: 0 }),
      get: async (path: string) => {
        calls.push({ path })
        return {}
      },
      post: async (path: string, body?: unknown) => {
        calls.push({ body, path })
        return { accepted: true }
      },
    },
    write: () => undefined,
  }
}
