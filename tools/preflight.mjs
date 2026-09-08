#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process'
import { config as loadDotenv } from 'dotenv'
import { resolve } from 'node:path'
import { preparePort } from './service-lifecycle.mjs'

const projectRoot = resolve(import.meta.dirname, '..')
const serviceName = process.argv[2]
const services = {
  'platform-api': {
    args: ['--watch', '--watch-path=src', '--import', 'tsx', 'src/server.ts'],
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
    args: ['--import', 'tsx', 'src/server.ts'],
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
  'zetro-api': {
    args: ['--import', 'tsx', 'src/server.ts'],
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
}

if (!serviceName || !(serviceName in services)) {
  process.stderr.write(`Usage: node tools/preflight.mjs <${Object.keys(services).join('|')}>\n`)
  process.exit(1)
}

loadDotenv({ path: resolve(projectRoot, '.env'), quiet: true })

const service = services[serviceName]
const host = process.env[service.hostKey] || '127.0.0.1'
let child

try {
  const port = readPort(service.portKey, service.defaultPort)
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
    env: process.env,
    stdio: 'inherit',
  })
}

let stopping = false

child.once('spawn', () => {
  if (typeof process.send === 'function') {
    process.send({ service: serviceName, type: 'codexsun:service-started' })
  }
})

child.once('exit', (code, signal) => {
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
