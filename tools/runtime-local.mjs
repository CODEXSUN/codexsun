import { spawn, spawnSync } from 'node:child_process'
import { config as loadDotenv } from 'dotenv'
import { join } from 'node:path'
import { hiddenWindowsProcessOptions } from './service-lifecycle.mjs'

export async function startLocalDeployment(plan, projectRoot) {
  loadDotenv({ path: join(projectRoot, '.env'), quiet: true })
  const children = new Map()
  let stopping = false

  const shutdown = async (exitCode) => {
    if (stopping) return
    stopping = true
    process.stdout.write(`[runtime] stopping profile ${plan.profile.id}.\n`)
    await Promise.all([...children.values()].map(stopChild))
    process.exitCode = exitCode
    if (process.connected && typeof process.disconnect === 'function') {
      process.disconnect()
    }
  }

  try {
    for (const component of plan.components) {
      const child = startComponent(component, projectRoot)
      children.set(component.id, child)
      await waitForStart(component, child)
      await waitForHealth(component, child)
    }
    process.stdout.write(`[runtime] profile ${plan.profile.id} is ready.\n`)
  } catch (error) {
    process.stderr.write(`[runtime] ${message(error)}\n`)
    await shutdown(1)
    return
  }

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => void shutdown(0))
  }
  process.on('message', (message) => {
    if (message?.type === 'codexsun:shutdown') void shutdown(0)
  })
}

function startComponent(component, projectRoot) {
  const environment = {
    ...process.env,
    [component.portEnvironmentKey]: String(component.port),
  }
  const child = spawn(process.execPath, ['tools/preflight.mjs', component.id], {
    cwd: projectRoot,
    detached: process.platform === 'win32',
    env: environment,
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    windowsHide: true,
  })
  child.stdout.pipe(process.stdout)
  child.stderr.pipe(process.stderr)
  return child
}

function waitForStart(component, child) {
  return new Promise((resolveStart, rejectStart) => {
    const timer = setTimeout(() => rejectStart(new Error(`${component.id} did not start.`)), 10_000)
    child.once('exit', () => {
      clearTimeout(timer)
      rejectStart(new Error(`${component.id} exited during startup.`))
    })
    child.on('message', (event) => {
      if (event?.type !== 'codexsun:service-started' || event.service !== component.id) return
      clearTimeout(timer)
      resolveStart()
    })
  })
}

async function waitForHealth(component, child) {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`${component.id} exited before health passed.`)
    try {
      const response = await fetch(`http://127.0.0.1:${component.port}${component.healthPath}`, {
        signal: AbortSignal.timeout(2_000),
      })
      if (response.ok) return
    } catch {
      // The component can need several attempts during startup.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250))
  }
  throw new Error(`${component.id} did not pass its health check.`)
}

async function stopChild(child) {
  if (child.exitCode !== null || !child.pid) return
  const exited = waitForExit(child, 6_000)
  if (child.connected) child.send({ type: 'codexsun:shutdown' })
  else child.kill('SIGTERM')
  if (await exited) return

  if (process.platform === 'win32') {
    spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {
      ...hiddenWindowsProcessOptions,
      stdio: 'ignore',
    })
    if (child.exitCode === null) await waitForExit(child, 5_000)
  } else {
    child.kill('SIGKILL')
  }
}

function waitForExit(child, timeoutMilliseconds) {
  return new Promise((resolveWait) => {
    const timer = setTimeout(() => resolveWait(false), timeoutMilliseconds)
    child.once('exit', () => {
      clearTimeout(timer)
      resolveWait(true)
    })
  })
}

function message(error) {
  return error instanceof Error ? error.message : String(error)
}
