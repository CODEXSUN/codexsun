#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process'
import { config as loadDotenv } from 'dotenv'
import { resolve } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '..')
loadDotenv({ path: resolve(projectRoot, '.env'), quiet: true })

const platformServices = [
  {
    healthUrl: `http://${process.env.PLATFORM_API_HOST || '127.0.0.1'}:${process.env.PLATFORM_API_PORT || '6010'}/health`,
    label: 'api',
    name: 'platform-api',
  },
  {
    healthUrl: `http://${process.env.PLATFORM_WEB_HOST || '127.0.0.1'}:${process.env.PLATFORM_WEB_PORT || '6021'}/`,
    label: 'web',
    name: 'platform-web',
  },
]

const docsServices = [
  {
    healthUrl: `http://${process.env.DOCS_API_HOST || '127.0.0.1'}:${process.env.DOCS_API_PORT || '6030'}/health`,
    label: 'Docs API',
    name: 'docs-api',
  },
  {
    healthUrl: `http://${process.env.DOCS_WEB_HOST || '127.0.0.1'}:${process.env.DOCS_WEB_PORT || '6040'}/`,
    label: 'Docs web',
    name: 'docs-web',
  },
]

const zetroServices = [
  {
    healthUrl: `http://${process.env.HOST || '127.0.0.1'}:${process.env.ZETRO_API_PORT || '6050'}/health/live`,
    label: 'Zetro API',
    name: 'zetro-api',
  },
  {
    healthUrl: `http://${process.env.HOST || '127.0.0.1'}:${process.env.ZETRO_WEB_PORT || '6060'}/`,
    label: 'Zetro web',
    name: 'zetro-web',
  },
]

const devkitServices = [
  {
    healthUrl: `http://${process.env.DEVKIT_API_HOST || '127.0.0.1'}:${process.env.DEVKIT_API_PORT || '6070'}/health`,
    label: 'DevKit API',
    name: 'devkit-api',
  },
  {
    healthUrl: `http://${process.env.DEVKIT_WEB_HOST || '127.0.0.1'}:${process.env.DEVKIT_WEB_PORT || '6080'}/`,
    label: 'DevKit web',
    name: 'devkit-web',
  },
]

const orshipServices = [
  {
    healthUrl: `http://${process.env.ORSHIP_API_HOST || '127.0.0.1'}:${process.env.ORSHIP_API_PORT || '6090'}/health`,
    label: 'Orship API',
    name: 'orship-api',
  },
  {
    healthUrl: `http://${process.env.ORSHIP_WEB_HOST || '127.0.0.1'}:${process.env.ORSHIP_WEB_PORT || '6091'}/`,
    label: 'Orship web',
    name: 'orship-web',
  },
]

const stackName = process.argv[2] ?? 'platform'
const services =
  stackName === 'docs'
    ? docsServices
    : stackName === 'zetro'
      ? zetroServices
      : stackName === 'devkit'
        ? devkitServices
        : stackName === 'orship'
          ? orshipServices
          : platformServices

if (!['platform', 'docs', 'zetro', 'devkit', 'orship'].includes(stackName))
  throw new Error('Use "platform", "docs", "zetro", "devkit", or "orship" as the stack name.')

if (stackName === 'docs' && (await areServicesHealthy())) {
  await restartExistingDocsStack()
}

const children = new Map()
let stopping = false

try {
  for (const service of services) {
    const child = startService(service)
    children.set(service.name, child)
    await waitForServiceStart(service, child)
    await waitForHealth(service, child)
  }

  process.stdout.write(`[stack] ${stackName} services are ready.\n`)
} catch (error) {
  process.stderr.write(`[stack] ${errorMessage(error)}\n`)
  await shutdown(1)
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => void shutdown(0))
}

function startService(service) {
  const child = spawn(process.execPath, ['tools/preflight.mjs', service.name], {
    cwd: projectRoot,
    env: process.env,
    stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
  })

  child.once('exit', (code, signal) => {
    if (stopping) return
    const reason = signal ? `signal ${signal}` : `code ${code ?? 1}`
    process.stderr.write(`[stack] ${service.label} exited with ${reason}\n`)
    void shutdown(1)
  })

  return child
}

function waitForServiceStart(service, child) {
  return new Promise((resolveStart, rejectStart) => {
    const timer = setTimeout(
      () => rejectStart(new Error(`${service.label} preflight did not start the service.`)),
      10_000,
    )
    const onExit = () => {
      clearTimeout(timer)
      rejectStart(new Error(`${service.label} preflight exited before service startup.`))
    }
    const onMessage = (message) => {
      if (message?.type !== 'codexsun:service-started' || message.service !== service.name) return
      clearTimeout(timer)
      child.off('exit', onExit)
      child.off('message', onMessage)
      resolveStart()
    }

    child.once('exit', onExit)
    child.on('message', onMessage)
  })
}

async function waitForHealth(service, child) {
  const deadline = Date.now() + 30_000
  let lastResult = 'not reachable'

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`${service.label} exited before it became ready.`)
    }

    try {
      const response = await fetch(service.healthUrl, { signal: AbortSignal.timeout(2_000) })
      lastResult = `HTTP ${response.status}`
      if (response.ok) return
    } catch (error) {
      lastResult = errorMessage(error)
    }

    await delay(250)
  }

  throw new Error(`${service.label} did not become ready: ${lastResult}`)
}

async function areServicesHealthy() {
  const checks = await Promise.all(
    services.map(async (service) => {
      try {
        return (await fetch(service.healthUrl, { signal: AbortSignal.timeout(500) })).ok
      } catch {
        return false
      }
    }),
  )

  return checks.every(Boolean)
}

async function restartExistingDocsStack() {
  const query = [
    'Get-CimInstance Win32_Process |',
    'Where-Object { $_.Name -eq "node.exe" -and $_.CommandLine -match "tools[\\\\/]dev-stack\\.mjs docs" } |',
    'ForEach-Object { $_.ProcessId } | ConvertTo-Json -Compress',
  ].join(' ')
  const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', query], {
    encoding: 'utf8',
  })
  const processIds = result.stdout.trim() ? JSON.parse(result.stdout) : []
  const priorProcessIds = (Array.isArray(processIds) ? processIds : [processIds]).filter(
    (processId) => processId !== process.pid,
  )

  for (const processId of priorProcessIds) {
    process.stdout.write(`[stack] stopping previous Docs stack ${processId}\n`)
    spawnSync('taskkill.exe', ['/PID', String(processId), '/T', '/F'], { stdio: 'ignore' })
  }

  const deadline = Date.now() + 10_000
  while ((await areServicesHealthy()) && Date.now() < deadline) {
    await delay(200)
  }
}

async function shutdown(exitCode) {
  if (stopping) return
  stopping = true
  process.stdout.write(`[stack] stopping ${stackName} services\n`)

  await Promise.all([...children.values()].map(stopChild))
  process.exitCode = exitCode
}

async function stopChild(child) {
  if (child.exitCode !== null || !child.pid) return

  const exited = waitForExit(child, 6_000)
  if (child.connected) child.send({ type: 'codexsun:shutdown' })
  else child.kill('SIGTERM')
  if (await exited) return

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
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

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds))
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}
