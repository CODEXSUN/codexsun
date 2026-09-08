import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { resolve } from 'node:path'
import test from 'node:test'

const projectRoot = resolve(import.meta.dirname, '../..')
const serverFile = resolve(projectRoot, 'dist/apps/platform/api/server.js')
const host = '127.0.0.1'
const signalPort = 6199
const gracefulPort = 6198
const degradedPort = 6196

test('production API starts, serves health, handles SIGTERM, and releases its port', async () => {
  await assertPortAvailable(signalPort)
  const runtime = startServer(signalPort, false)

  try {
    await assertHealthy(runtime, signalPort)
    runtime.child.kill('SIGTERM')
    const result = await waitForExit(runtime.child, 10_000, 'SIGTERM')
    const cleanSignalExit = result.code === 0 || result.signal === 'SIGTERM'

    assert.equal(cleanSignalExit, true, runtime.readOutput())
    if (process.platform !== 'win32') {
      assert.match(runtime.readOutput(), /platform API shutdown complete/u)
    }
    await assertPortAvailable(signalPort)
  } finally {
    stopOrphan(runtime.child)
  }
})

test('production API completes graceful shutdown through supervisor IPC', async () => {
  await assertPortAvailable(gracefulPort)
  const runtime = startServer(gracefulPort, true)

  try {
    await assertHealthy(runtime, gracefulPort)
    runtime.child.send({ type: 'codexsun:shutdown' })
    const result = await waitForExit(runtime.child, 10_000, 'supervisor IPC')

    assert.equal(result.code, 0, runtime.readOutput())
    assert.match(runtime.readOutput(), /platform API shutdown requested/u)
    assert.match(runtime.readOutput(), /platform API shutdown complete/u)
    await assertPortAvailable(gracefulPort)
  } finally {
    stopOrphan(runtime.child)
  }
})

test('production API keeps liveness available when module runtime preparation fails', async () => {
  await assertPortAvailable(degradedPort)
  const runtime = startServer(degradedPort, false, true)

  try {
    await assertHealthy(runtime, degradedPort)
    const readiness = await fetch(`http://${host}:${degradedPort}/health/ready`, {
      signal: AbortSignal.timeout(1_000),
    })
    const body = await readiness.json()

    assert.equal(readiness.status, 503)
    assert.equal(body.data.status, 'not-ready')
    assert.equal(
      body.data.components.some(
        ({ name, status }) => name === 'module-runtime' && status === 'not-ready',
      ),
      true,
    )
    runtime.child.kill('SIGTERM')
    await waitForExit(runtime.child, 10_000, 'SIGTERM')
    await assertPortAvailable(degradedPort)
  } finally {
    stopOrphan(runtime.child)
  }
})

function startServer(port, useIpc, moduleRuntimeEnabled = false) {
  const child = spawn(process.execPath, [serverFile], {
    cwd: projectRoot,
    env: {
      ...process.env,
      APP_ENV: 'test',
      DATABASE_PORT: moduleRuntimeEnabled ? '1' : process.env.DATABASE_PORT,
      LOG_PRETTY: 'false',
      MODULE_RUNTIME_ENABLED: String(moduleRuntimeEnabled),
      PLATFORM_API_HOST: host,
      PLATFORM_API_PORT: String(port),
      PLATFORM_WEB_ORIGIN: 'http://127.0.0.1:6299',
    },
    stdio: useIpc ? ['ignore', 'pipe', 'pipe', 'ipc'] : ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  child.stdout.setEncoding('utf8').on('data', (chunk) => (output += chunk))
  child.stderr.setEncoding('utf8').on('data', (chunk) => (output += chunk))

  return { child, readOutput: () => output }
}

async function assertHealthy(runtime, port) {
  const response = await waitForHealth(runtime, port)
  const body = await response.json()

  assert.equal(body.success, true)
  assert.equal(body.data.status, 'ok')
  assert.ok(response.headers.get('x-request-id'))
  assert.equal(response.headers.get('x-correlation-id'), 'server-e2e')
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://127.0.0.1:6299')
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')

  const runtimeResponse = await fetch(`http://${host}:${port}/api/system/runtime`, {
    signal: AbortSignal.timeout(1_000),
  })
  const runtimeBody = await runtimeResponse.json()
  assert.equal(runtimeResponse.status, 200)
  assert.deepEqual(
    runtimeBody.data.modules.map(({ id }) => id),
    ['module-runtime', 'system'],
  )

  const missingResponse = await fetch(`http://${host}:${port}/missing`, {
    signal: AbortSignal.timeout(1_000),
  })
  const missingBody = await missingResponse.json()
  assert.equal(missingResponse.status, 404)
  assert.equal(missingBody.error.code, 'ROUTE_NOT_FOUND')
}

async function waitForHealth(runtime, port) {
  const deadline = Date.now() + 20_000

  while (Date.now() < deadline) {
    if (runtime.child.exitCode !== null || runtime.child.signalCode !== null) {
      throw new Error(`API exited before readiness.\n${runtime.readOutput()}`)
    }

    try {
      const response = await fetch(`http://${host}:${port}/health`, {
        headers: {
          origin: 'http://127.0.0.1:6299',
          'x-correlation-id': 'server-e2e',
        },
        signal: AbortSignal.timeout(1_000),
      })
      if (response.ok) return response
    } catch {
      // Startup can take several attempts on slower hosts.
    }

    await delay(100)
  }

  throw new Error(`API did not become ready.\n${runtime.readOutput()}`)
}

function waitForExit(child, timeoutMilliseconds, stopMethod) {
  return new Promise((resolveExit, rejectExit) => {
    const timer = setTimeout(
      () => rejectExit(new Error(`API did not stop after ${stopMethod}.`)),
      timeoutMilliseconds,
    )
    child.once('exit', (code, signal) => {
      clearTimeout(timer)
      resolveExit({ code, signal })
    })
  })
}

function assertPortAvailable(port) {
  return new Promise((resolveCheck, rejectCheck) => {
    const reservation = createServer()
    reservation.once('error', rejectCheck)
    reservation.listen({ exclusive: true, host, port }, () => {
      reservation.close((error) => {
        if (error) rejectCheck(error)
        else resolveCheck()
      })
    })
  })
}

function stopOrphan(child) {
  if (child.exitCode === null && child.signalCode === null) {
    child.kill('SIGKILL')
  }
}

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds))
}
