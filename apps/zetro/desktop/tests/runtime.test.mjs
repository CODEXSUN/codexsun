import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import test from 'node:test'
import { verifyScriptTask } from './script-runtime.helper.mjs'

const root = resolve(import.meta.dirname, '../../../..')

test(
  'packaged API authenticates supervisor calls and drains through desktop stdin',
  { timeout: 30_000 },
  async () => {
    const directory = await mkdtemp(join(tmpdir(), 'zetro-release-runtime-'))
    const port = await reservePort()
    const token = randomBytes(32).toString('hex')
    const sessionToken = randomBytes(32).toString('hex')
    const child = spawn(
      resolve(root, 'dist/apps/zetro/desktop/runtime/node.exe'),
      [resolve(root, 'dist/apps/zetro/desktop/runtime/zetro-api.mjs')],
      {
        cwd: directory,
        env: {
          ...process.env,
          HOST: '127.0.0.1',
          APP_ENV: 'production',
          LOG_PRETTY: 'false',
          ZETRO_API_PORT: String(port),
          ZETRO_DB_DRIVER: 'sqlite',
          ZETRO_QUEUE_DRIVER: 'local',
          ZETRO_SUPERVISOR_TOKEN: token,
          ZETRO_DESKTOP_SESSION_TOKEN: sessionToken,
          ZETRO_DESKTOP_PARENT_PID: String(process.pid),
          ZETRO_PROJECT_ROOT: directory,
          ZETRO_CODEX_API_KEY: '',
          STORAGE_ROOT: join(directory, 'storage'),
          ZETRO_SQLITE_PATH: 'private/zetro/zetro.sqlite',
          ZETRO_WORKTREE_ROOT: join(directory, 'worktrees'),
        },
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
      },
    )
    let output = ''
    child.stdout.on('data', (data) => {
      output += data.toString()
    })
    child.stderr.on('data', (data) => {
      output += data.toString()
    })
    const exited = new Promise((resolveExit, reject) => {
      child.once('error', reject)
      child.once('exit', (code) => resolveExit(code))
    })
    try {
      const origin = `http://127.0.0.1:${port}`
      await waitForHealth(origin).catch((error) => {
        throw new Error(`${error.message}\n${output.replaceAll(token, '[redacted]')}`)
      })
      assert.equal((await fetch(`${origin}/health/ready`)).status, 200)
      assert.equal((await fetch(`${origin}/api/v1/supervisor/capabilities`)).status, 401)
      const headers = { Authorization: `Bearer ${token}` }
      const response = await fetch(`${origin}/api/v1/supervisor/capabilities`, { headers })
      assert.equal(response.status, 200)
      assert.equal((await response.json()).replay, 'disabled')
      assert.equal((await fetch(`${origin}/api/v1/projects`, { headers })).status, 401)
      await verifyScriptTask(origin, directory, sessionToken)
      child.stdin.end('zetro:shutdown\n')
      assert.equal(await Promise.race([exited, deadline(8_000)]), 0)
      assert.match(output, /desktop-stdin/)
      assert.equal(output.includes(token), false)
      assert.equal(output.includes(sessionToken), false)
      await assert.rejects(fetch(`${origin}/health/live`))
    } finally {
      if (child.exitCode === null) child.kill()
      await exited
      await rm(directory, { recursive: true, force: true })
    }
  },
)

async function reservePort() {
  const server = createServer()
  await new Promise((resolveListen, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolveListen)
  })
  const port = server.address().port
  await new Promise((resolveClose) => server.close(resolveClose))
  return port
}

async function waitForHealth(origin) {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(`${origin}/health/live`)).ok) return
    } catch {
      /* Startup is not ready. */
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100))
  }
  throw new Error('Packaged Zetro API did not become healthy.')
}

function deadline(milliseconds) {
  return new Promise((_, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Desktop API shutdown timed out.')),
      milliseconds,
    )
    timer.unref()
  })
}
