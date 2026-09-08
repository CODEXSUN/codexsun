#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process'
import { config as loadDotenv } from 'dotenv'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { preparePort } from './service-lifecycle.mjs'

const projectRoot = resolve(import.meta.dirname, '..')
const serviceName = process.argv[2]
const services = {
  'platform-api': {
    args: [
      '--watch',
      '--watch-path=src',
      '--import',
      'tsx',
      resolve(projectRoot, 'apps/platform/api/src/server.ts'),
    ],
    command: process.execPath,
    cwd: resolve(projectRoot, 'apps/platform/api'),
    defaultPort: 6010,
    hostKey: 'PLATFORM_API_HOST',
    label: 'api',
    portKey: 'PLATFORM_API_PORT',
    healthPath: '/health',
  },
  'platform-web': {
    args: [resolve(projectRoot, 'node_modules/vite/bin/vite.js'), '--strictPort'],
    command: process.execPath,
    cwd: resolve(projectRoot, 'apps/platform/web'),
    defaultPort: 6021,
    hostKey: 'PLATFORM_WEB_HOST',
    label: 'web',
    portKey: 'PLATFORM_WEB_PORT',
    healthPath: '/',
  },
  'docs-api': {
    args: ['--import', 'tsx', resolve(projectRoot, 'apps/docs/api/src/server.ts')],
    command: process.execPath,
    cwd: resolve(projectRoot, 'apps/docs/api'),
    hostKey: 'DOCS_API_HOST',
    label: 'Docs API',
    portKey: 'DOCS_API_PORT',
    defaultPort: 6030,
    healthPath: '/health',
  },
  'docs-web': {
    args: [resolve(projectRoot, 'node_modules/vite/bin/vite.js'), '--strictPort'],
    command: process.execPath,
    cwd: resolve(projectRoot, 'apps/docs/web'),
    hostKey: 'DOCS_WEB_HOST',
    label: 'Docs web',
    portKey: 'DOCS_WEB_PORT',
    defaultPort: 6040,
    healthPath: '/',
  },
  'devkit-api': {
    args: ['--import', 'tsx', resolve(projectRoot, 'apps/devkit/api/src/server.ts')],
    command: process.execPath,
    cwd: resolve(projectRoot, 'apps/devkit/api'),
    defaultPort: 6070,
    hostKey: 'DEVKIT_API_HOST',
    label: 'DevKit API',
    portKey: 'DEVKIT_API_PORT',
    healthPath: '/health',
  },
  'devkit-web': {
    args: [resolve(projectRoot, 'node_modules/vite/bin/vite.js'), '--strictPort'],
    command: process.execPath,
    cwd: resolve(projectRoot, 'apps/devkit/web'),
    defaultPort: 6080,
    hostKey: 'DEVKIT_WEB_HOST',
    label: 'DevKit web',
    portKey: 'DEVKIT_WEB_PORT',
    healthPath: '/',
  },
  'zetro-api': {
    args: ['--import', 'tsx', resolve(projectRoot, 'apps/zetro/api/src/server.ts')],
    command: process.execPath,
    cwd: resolve(projectRoot, 'apps/zetro/api'),
    defaultPort: 6050,
    hostKey: 'HOST',
    label: 'Zetro API',
    portKey: 'ZETRO_API_PORT',
    healthPath: '/health/live',
  },
  'zetro-web': {
    args: [resolve(projectRoot, 'node_modules/vite/bin/vite.js'), '--strictPort'],
    command: process.execPath,
    cwd: resolve(projectRoot, 'apps/zetro/web'),
    defaultPort: 6060,
    hostKey: 'HOST',
    label: 'Zetro web',
    portKey: 'ZETRO_WEB_PORT',
    healthPath: '/',
  },
  'orship-api': {
    args: ['--import', 'tsx', resolve(projectRoot, 'apps/orship/api/src/server.ts')],
    command: process.execPath,
    cwd: resolve(projectRoot, 'apps/orship/api'),
    defaultPort: 6090,
    hostKey: 'ORSHIP_API_HOST',
    label: 'Orship API',
    portKey: 'ORSHIP_API_PORT',
    healthPath: '/health',
  },
  'orship-web': {
    args: [resolve(projectRoot, 'node_modules/vite/bin/vite.js'), '--strictPort'],
    command: process.execPath,
    cwd: resolve(projectRoot, 'apps/orship/web'),
    defaultPort: 6091,
    hostKey: 'ORSHIP_WEB_HOST',
    label: 'Orship web',
    portKey: 'ORSHIP_WEB_PORT',
    healthPath: '/',
  },
}

if (!serviceName || !(serviceName in services)) {
  process.stderr.write(`Usage: node tools/preflight.mjs <${Object.keys(services).join('|')}>\n`)
  process.exit(1)
}

loadDotenv({ path: resolve(projectRoot, '.env'), quiet: true })

const service = services[serviceName]
const host = process.env[service.hostKey] || '127.0.0.1'
let child
let port

try {
  port = readPort(service.portKey, service.defaultPort)
  await preparePort({
    healthUrl: service.healthPath ? `http://${host}:${port}${service.healthPath}` : undefined,
    host,
    label: service.label,
    port,
    workspacePath: projectRoot,
  })
  child = startService(service, host, port)
} catch (error) {
  process.stderr.write(`[preflight] ${errorMessage(error)}\n`)
  process.exit(1)
}
function startService(serviceDefinition, hostName, portNumber) {
  process.stdout.write(
    `[preflight] ${serviceDefinition.label} reserved ${hostName}:${portNumber}\n`,
  )
  const serviceArgs = [...serviceDefinition.args]
  if (serviceName.endsWith('-web')) {
    serviceArgs.push('--host', hostName, '--port', String(portNumber))
  }

  return spawn(serviceDefinition.command, serviceArgs, {
    cwd: serviceDefinition.cwd,
    detached: process.platform === 'win32',
    env: process.env,
    stdio: 'inherit',
    windowsHide: true,
  })
}

let stopping = false

child.once('spawn', () => {
  void writeProcessMarker(child.pid, port)
  if (typeof process.send === 'function') {
    process.send({ service: serviceName, type: 'codexsun:service-started' })
  }
})

child.once('exit', async (code, signal) => {
  await removeProcessMarker(child.pid)
  if (!stopping && code !== 0) {
    process.stderr.write(
      `[preflight] ${service.label} exited with ${signal ? `signal ${signal}` : `code ${code}`}\n`,
    )
  }
  process.exitCode = stopping ? 0 : (code ?? (signal ? 1 : 0))
  if (process.connected && typeof process.disconnect === 'function') {
    process.disconnect()
  }
})

process.on('message', (message) => {
  if (message?.type === 'codexsun:shutdown') {
    void stopChild('IPC')
  }
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => void stopChild(signal))
}

function readPort(key, defaultPort) {
  const rawPort = process.env[key] ?? String(defaultPort ?? '')
  const port = Number(rawPort)

  if (!rawPort || !Number.isInteger(port) || port < 6000 || port > 6999) {
    throw new Error(`${key} must contain an integer from 6000 through 6999.`)
  }

  return port
}

async function stopChild(reason) {
  if (stopping || child.exitCode !== null) return
  stopping = true
  process.stdout.write(`[preflight] stopping ${service.label} after ${reason}\n`)

  const exited = waitForExit(child, 5_000)
  child.kill('SIGTERM')

  if (await exited) return

  process.stderr.write(`[preflight] forcing ${service.label} shutdown after timeout\n`)
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
  } else {
    child.kill('SIGKILL')
  }
}

function waitForExit(childProcess, timeoutMilliseconds) {
  return new Promise((resolveWait) => {
    const timer = setTimeout(() => resolveWait(false), timeoutMilliseconds)
    childProcess.once('exit', () => {
      clearTimeout(timer)
      resolveWait(true)
    })
  })
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}

function markerPath() {
  return resolve(projectRoot, 'storage/app/private/runtime/processes', `${serviceName}.json`)
}

async function writeProcessMarker(processId, servicePort) {
  const path = markerPath()
  await mkdir(dirname(path), { recursive: true })
  await writeFile(
    path,
    `${JSON.stringify(
      {
        pid: processId,
        port: servicePort,
        projectRoot,
        serviceId: serviceName,
        startedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
  )
}

async function removeProcessMarker(processId) {
  try {
    const marker = JSON.parse(await readFile(markerPath(), 'utf8'))
    if (marker.pid === processId) await unlink(markerPath())
  } catch (error) {
    if (error?.code !== 'ENOENT') process.stderr.write(`[preflight] marker cleanup failed\n`)
  }
}
