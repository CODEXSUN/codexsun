import assert from 'node:assert/strict'
import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runInNewContext } from 'node:vm'
import test from 'node:test'
import Fastify from 'fastify'
import { registerCodexConnectionRoutes } from '../src/modules/codex-connection/codex-connection.routes.js'
import type { CodexConnectionService } from '../src/modules/codex-connection/codex-connection.service.js'
import { CodexProbeScript } from '../src/modules/codex-connection/codex-probe-script.js'
import {
  CodexSandbox,
  workspaceSandboxPolicy,
} from '../src/modules/codex-connection/codex-sandbox.js'
import { CodexAppServerClient } from '../src/modules/codex-connection/codex-app-server.client.js'
import type { CodexTurnInput } from '../src/modules/codex-connection/codex-connection.types.js'
import type { CodexWorktreeService } from '../src/modules/codex-connection/codex-worktree.service.js'
import { readEnvironment } from '../src/config.js'

test('sandbox storage override is optional and preserves an explicit desktop path', () => {
  assert.equal(readEnvironment({}).ZETRO_SANDBOX_ROOT, undefined)
  assert.equal(readEnvironment({ ZETRO_SANDBOX_ROOT: '' }).ZETRO_SANDBOX_ROOT, undefined)
  const path = join(tmpdir(), 'zetro-home', 'storage', 'app', 'private', 'sandbox')
  assert.equal(readEnvironment({ ZETRO_SANDBOX_ROOT: path }).ZETRO_SANDBOX_ROOT, path)
})

test('agent probe uses a short host-written file and rejects changed code', async () => {
  const root = await mkdtemp(join(tmpdir(), 'zetro-probe-script-'))
  try {
    const cwd = join(root, 'allowed')
    await mkdir(cwd)
    const code = 'console.log("probe")'.repeat(500)
    const script = await CodexProbeScript.create(cwd, Buffer.from(code).toString('base64'))
    assert.equal(script.path.startsWith(cwd), false)
    assert.ok(script.command(process.execPath).length < 1000)
    assert.equal(await script.unchanged(), true)
    await writeFile(script.path, 'changed')
    assert.equal(await script.unchanged(), false)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('setup acceptance is not enforcement proof and failures remain closed', async () => {
  const sandbox = new CodexSandbox(
    async () => ({ started: true }),
    async () => '',
    'unused',
    'win32',
  )
  assert.throws(() => sandbox.assertReady(), /blocked/)
  assert.equal((await sandbox.setup()).state, 'setting-up')
  await assert.rejects(sandbox.setup(), /already running/)
  sandbox.notification('windowsSandbox/setupCompleted', { mode: 'elevated', success: true })
  assert.equal(sandbox.read().state, 'setup-ready')
  assert.throws(() => sandbox.assertReady(), /blocked/)
  await sandbox.setup()
  sandbox.notification('windowsSandbox/setupCompleted', { mode: 'elevated', success: false })
  assert.equal(sandbox.read().state, 'blocked')
  sandbox.invalidate()
})

test('unsupported hosts and failed setup never enable project execution', async () => {
  const sandbox = new CodexSandbox(
    async () => {
      throw new Error('provider failed')
    },
    async () => '',
    'unused',
    'linux',
  )
  assert.equal((await sandbox.setup()).state, 'unsupported')
  assert.throws(() => sandbox.verify(), /Windows/)
  const windows = new CodexSandbox(
    async () => {
      throw new Error('private error')
    },
    async () => '',
    'unused',
    'win32',
  )
  assert.equal((await windows.setup()).state, 'blocked')
  assert.doesNotMatch(windows.read().message, /private error/)
})

test('unverified real project turns stop before creating worktrees or contacting the provider', async () => {
  const client = new CodexAppServerClient('unused', 'unused', {} as CodexWorktreeService)
  await assert.rejects(client.runTurn({} as CodexTurnInput), /Project execution is blocked/)
  await client.close()
})

test('both simulated execution paths must pass and restart invalidates readiness', async () => {
  const root = await mkdtemp(join(tmpdir(), 'zetro-sandbox-test-'))
  let agentCalls = 0
  const sandbox = new CodexSandbox(
    async (_method, input) => {
      const params = input as { command: string[]; sandboxPolicy: unknown }
      const policy = params.sandboxPolicy as ReturnType<typeof workspaceSandboxPolicy>
      assert.equal(policy.type, 'workspaceWrite')
      assert.equal(policy.networkAccess, false)
      assert.equal(policy.writableRoots.length, 2)
      assert.equal(policy.excludeTmpdirEnvVar, true)
      return { exitCode: 0, stdout: simulate(params.command[2]!, true) }
    },
    async (_cwd, _roots, encoded) => {
      agentCalls++
      return simulate(Buffer.from(encoded, 'base64').toString(), true)
    },
    root,
    'win32',
  )
  try {
    sandbox.verify()
    await settled(sandbox)
    assert.equal(sandbox.read().state, 'verified')
    assert.equal(agentCalls, 1)
    assert.equal(sandbox.read().checks.length, 8)
    sandbox.assertReady()
    sandbox.invalidate()
    assert.throws(() => sandbox.assertReady(), /blocked/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('a sibling write stops verification before any agent call', async () => {
  const root = await mkdtemp(join(tmpdir(), 'zetro-sandbox-test-'))
  const sandbox = new CodexSandbox(
    async (_method, input) => ({
      exitCode: 0,
      stdout: simulate((input as { command: string[] }).command[2]!, false),
    }),
    async () => {
      throw new Error('Agent must not run')
    },
    root,
    'win32',
  )
  try {
    sandbox.verify()
    await settled(sandbox)
    assert.equal(sandbox.read().state, 'blocked')
    assert.equal(
      sandbox.read().checks.find((check) => check.name.includes('sibling'))?.passed,
      false,
    )
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('network success blocks verification and never enables a project turn', async () => {
  const root = await mkdtemp(join(tmpdir(), 'zetro-sandbox-test-'))
  const sandbox = new CodexSandbox(
    async (_method, input) => ({
      exitCode: 0,
      stdout: simulate((input as { command: string[] }).command[2]!, true, false),
    }),
    async () => {
      throw new Error('Agent must not run')
    },
    root,
    'win32',
  )
  try {
    assert.equal(sandbox.verify().allowLocalNetwork, false)
    await settled(sandbox)
    assert.equal(sandbox.read().state, 'blocked')
    assert.equal(sandbox.read().checks.at(-1)?.passed, false)
    assert.throws(() => sandbox.assertReady(), /blocked/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('late setup failure cannot overwrite a newer invalidation', async () => {
  let fail: (error: Error) => void = () => undefined
  const sandbox = new CodexSandbox(
    () =>
      new Promise((_resolve, reject) => {
        fail = reject
      }),
    async () => '',
    'unused',
    'win32',
  )
  const pending = sandbox.setup()
  sandbox.invalidate()
  fail(new Error('late provider error'))
  await pending
  assert.equal(sandbox.read().state, 'unverified')
})

test('HTTP sandbox actions require confirmation and expose the explicit localhost choice', async () => {
  const server = Fastify()
  let local = false
  const sandbox = new CodexSandbox(
    async () => ({}),
    async () => '',
    'unused',
    'win32',
  )
  const service = {
    getSandboxStatus: () => sandbox.read(),
    verifySandbox: (allow: boolean) => {
      local = allow
      return { ...sandbox.read(), allowLocalNetwork: allow }
    },
  } as unknown as CodexConnectionService
  await registerCodexConnectionRoutes(server, service)
  try {
    const url = '/api/v1/settings/codex/sandbox'
    assert.equal((await server.inject({ url })).statusCode, 200)
    assert.equal(
      (await server.inject({ method: 'POST', url, payload: { action: 'verify' } })).statusCode,
      400,
    )
    const response = await server.inject({
      method: 'POST',
      url,
      payload: { action: 'verify', confirm: true, allowLocalNetwork: true },
    })
    assert.equal(response.statusCode, 202)
    assert.equal(response.json().sandbox.allowLocalNetwork, true)
    assert.equal(local, true)
    await server.inject({ method: 'POST', url, payload: { action: 'verify', confirm: true } })
    assert.equal(local, false)
  } finally {
    await server.close()
  }
})

test('redirected fixture paths are canonical on both execution paths', async () => {
  const root = await mkdtemp(join(tmpdir(), 'zetro-sandbox-path-'))
  const physical = join(root, 'physical')
  const alias = join(root, 'alias')
  await mkdir(physical)
  await symlink(physical, alias, process.platform === 'win32' ? 'junction' : 'dir')
  const seen: string[] = []
  const sandbox = new CodexSandbox(
    async (_method, input) => {
      const params = input as {
        cwd: string
        command: string[]
        sandboxPolicy: { writableRoots: string[] }
      }
      seen.push(params.cwd)
      assert.equal(params.cwd, await realpath(params.cwd))
      for (const path of params.sandboxPolicy.writableRoots)
        assert.equal(path, await realpath(path))
      return { exitCode: 0, stdout: simulate(params.command[2]!, true) }
    },
    async (cwd, roots, encoded) => {
      seen.push(cwd)
      assert.equal(cwd, await realpath(cwd))
      for (const path of roots) assert.equal(path, await realpath(path))
      return simulate(Buffer.from(encoded, 'base64').toString(), true)
    },
    alias,
    'win32',
  )
  try {
    sandbox.verify()
    await settled(sandbox)
    assert.equal(sandbox.read().state, 'verified')
    assert.equal(seen.length, 2)
    assert.equal(seen[0], seen[1])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('invalid Windows cwd reports a safe error and keeps execution blocked', async () => {
  const root = await mkdtemp(join(tmpdir(), 'zetro-sandbox-error-'))
  const sandbox = new CodexSandbox(
    async () => {
      throw new Error('private-token CreateProcessWithLogonW failed: 267')
    },
    async () => {
      throw new Error('Agent must not run')
    },
    root,
    'win32',
  )
  try {
    sandbox.verify()
    await settled(sandbox)
    assert.equal(sandbox.read().state, 'blocked')
    assert.match(sandbox.read().message, /Windows error 267/)
    assert.doesNotMatch(sandbox.read().message, /private-token/)
    assert.throws(() => sandbox.assertReady(), /blocked/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

async function settled(sandbox: CodexSandbox) {
  for (let index = 0; index < 100 && sandbox.read().state === 'verifying'; index++)
    await new Promise((resolve) => setTimeout(resolve, 10))
  assert.notEqual(sandbox.read().state, 'verifying')
}

// Simulates denied OS operations. This is not live sandbox evidence.
function simulate(code: string, denySibling: boolean, denyNetwork = true): string {
  let output = ''
  const socket = {
    destroy() {},
    setTimeout() {},
    once(event: string, callback: (error: { code: string }) => void) {
      if (event === (denyNetwork ? 'error' : 'connect')) callback({ code: 'EACCES' })
    },
  }
  runInNewContext(code, {
    Buffer,
    console: {
      log: (value: string) => {
        output = value
      },
    },
    require: (name: string) =>
      name === 'node:net'
        ? { createConnection: () => socket }
        : {
            writeFileSync: (path: string, data: string) => {
              if (denySibling && path.endsWith('sentinel.txt'))
                throw Object.assign(new Error('denied'), { code: 'EPERM' })
              writeFileSync(path, data)
            },
          },
  })
  return output
}
