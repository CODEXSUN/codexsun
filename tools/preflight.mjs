#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process'
import { config as loadDotenv } from 'dotenv'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { hiddenWindowsProcessOptions, preparePort } from './service-lifecycle.mjs'
import { createRuntimeLogCapture } from './runtime-log-capture.mjs'

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
    mariaDbSmoke: true,
    prepareWorkspaces: [
      '@codexsun/framework',
      '@codexsun/platform-contracts',
      '@codexsun/platform-core-api',
      '@codexsun/platform-identity-client',
    ],
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
    prepareWorkspaces: [
      '@codexsun/platform-contracts',
      '@codexsun/platform-core-web',
      '@codexsun/platform-identity-client',
      '@codexsun/ui',
    ],
  },
  'uiux-web': {
    args: [resolve(projectRoot, 'node_modules/vite/bin/vite.js'), '--strictPort'],
    command: process.execPath,
    cwd: resolve(projectRoot, 'apps/uiux/web'),
    defaultPort: 6130,
    hostKey: 'UIUX_WEB_HOST',
    label: 'UIUX web',
    portKey: 'UIUX_WEB_PORT',
    healthPath: '/',
    prepareWorkspaces: ['@codexsun/ui'],
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
    prepareWorkspaces: ['@codexsun/docs-contracts', '@codexsun/platform-core-api'],
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
    prepareWorkspaces: ['@codexsun/docs-contracts', '@codexsun/ui'],
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
    prepareWorkspaces: ['@codexsun/devkit-contracts', '@codexsun/platform-core-api'],
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
    prepareWorkspaces: ['@codexsun/devkit-contracts', '@codexsun/ui'],
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
    prepareWorkspaces: ['@codexsun/platform-core-api'],
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
    prepareWorkspaces: ['@codexsun/ui'],
  },
  'agent-crew-api': {
    args: ['--import', 'tsx', resolve(projectRoot, 'apps/agent-crew/api/src/server.ts')],
    command: process.execPath,
    cwd: resolve(projectRoot, 'apps/agent-crew/api'),
    defaultPort: 6100,
    hostKey: 'AGENT_CREW_API_HOST',
    label: 'Agent Crew API',
    portKey: 'AGENT_CREW_API_PORT',
    healthPath: '/health',
    prepareWorkspaces: ['@codexsun/platform-core-api'],
  },
  'agent-crew-web': {
    args: [resolve(projectRoot, 'node_modules/vite/bin/vite.js'), '--strictPort'],
    command: process.execPath,
    cwd: resolve(projectRoot, 'apps/agent-crew/web'),
    defaultPort: 6110,
    hostKey: 'AGENT_CREW_WEB_HOST',
    label: 'Agent Crew web',
    portKey: 'AGENT_CREW_WEB_PORT',
    healthPath: '/',
    prepareWorkspaces: ['@codexsun/ui'],
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
    prepareWorkspaces: [
      '@codexsun/framework',
      '@codexsun/orship-contracts',
      '@codexsun/platform-core-api',
    ],
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
    prepareWorkspaces: ['@codexsun/orship-contracts', '@codexsun/ui'],
  },
}

if (!serviceName || !(serviceName in services)) {
  process.stderr.write(`Usage: node tools/preflight.mjs <${Object.keys(services).join('|')}>\n`)
  process.exit(1)
}

loadDotenv({ path: resolve(projectRoot, '.env'), quiet: true })

const service = services[serviceName]
const host = process.env[service.hostKey] || '127.0.0.1'
const capture = await createRuntimeLogCapture({ componentId: serviceName, projectRoot })
let child
let port

try {
  prepareWorkspaceDependencies(service.prepareWorkspaces ?? [])
  if (service.mariaDbSmoke) runMariaDbSmoke()
  port = readPort(service.portKey, service.defaultPort)
  const ownedProcessId = await readOwnedProcessId(port)
  await preparePort({
    healthUrl: service.healthPath ? `http://${host}:${port}${service.healthPath}` : undefined,
    host,
    label: service.label,
    ownedProcessId,
    port,
    workspacePath: projectRoot,
  })
  child = startService(service, host, port)
} catch (error) {
  capture.recordFailure({ error, event: 'runtime.preflight.failed', message: 'preflight failed' })
  await capture.close()
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
    env: { ...process.env, LOG_PRETTY: 'false' },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    windowsHide: true,
  })
}

child.stdout.on('data', (chunk) => capture.write('stdout', chunk))
child.stderr.on('data', (chunk) => capture.write('stderr', chunk))
child.once('error', (error) => {
  capture.recordFailure({
    error,
    event: 'runtime.process.spawn-failed',
    message: 'service spawn failed',
  })
})

let stopping = false

child.once('spawn', () => {
  void writeProcessMarker(child.pid, port)
  if (typeof process.send === 'function') {
    process.send({ service: serviceName, type: 'codexsun:service-started' })
  }
})

child.once('close', async (code, signal) => {
  if (!stopping && (code !== 0 || signal)) {
    capture.recordFailure({
      event: 'runtime.process.exited',
      message: `${service.label} exited with ${signal ? `signal ${signal}` : `code ${code ?? 1}`}`,
    })
  }
  await removeProcessMarker(child.pid)
  await capture.close()
  if (!stopping && code !== 0) {
    process.exitCode = code ?? 1
  }
  process.exitCode = stopping ? 0 : (process.exitCode ?? code ?? (signal ? 1 : 0))
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

function prepareWorkspaceDependencies(workspaces) {
  for (const workspace of workspaces) {
    const command = npmCommand(['run', 'build', '--workspace', workspace])
    const result = spawnSync(command.executable, command.argumentsList, {
      ...hiddenWindowsProcessOptions,
      cwd: projectRoot,
      stdio: 'inherit',
    })
    if (result.status !== 0) {
      throw new Error(`Could not prepare development dependency "${workspace}".`)
    }
  }
}

function runMariaDbSmoke() {
  const result = spawnSync(process.execPath, [resolve(projectRoot, 'tools/mariadb-smoke.mjs')], {
    ...hiddenWindowsProcessOptions,
    cwd: projectRoot,
    stdio: 'inherit',
  })
  if (result.status !== 0) {
    throw new Error('MariaDB preflight smoke test failed.')
  }
}

function npmCommand(argumentsList) {
  if (process.platform !== 'win32') return { argumentsList, executable: 'npm' }
  return {
    argumentsList: ['/d', '/s', '/c', 'npm.cmd', ...argumentsList],
    executable: process.env.ComSpec ?? 'cmd.exe',
  }
}

async function stopChild(reason) {
  if (stopping || child.exitCode !== null) return
  stopping = true
  process.stdout.write(`[preflight] stopping ${service.label} after ${reason}\n`)

  if (process.platform === 'win32') {
    spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {
      ...hiddenWindowsProcessOptions,
      stdio: 'ignore',
    })
    if (child.exitCode === null) await waitForExit(child, 5_000)
    return
  }

  const exited = waitForExit(child, 5_000)
  child.kill('SIGTERM')

  if (await exited) return

  process.stderr.write(`[preflight] forcing ${service.label} shutdown after timeout\n`)
  child.kill('SIGKILL')
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

function markerPath() {
  return resolve(projectRoot, 'storage/app/private/runtime/processes', `${serviceName}.json`)
}

async function readOwnedProcessId(servicePort) {
  try {
    const marker = JSON.parse(await readFile(markerPath(), 'utf8'))
    if (
      marker.serviceId === serviceName &&
      marker.port === servicePort &&
      resolve(marker.projectRoot) === projectRoot &&
      Number.isInteger(marker.pid) &&
      marker.pid > 0
    ) {
      return Number.isInteger(marker.controllerPid) && marker.controllerPid > 0
        ? marker.controllerPid
        : marker.pid
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') process.stderr.write(`[preflight] marker read failed\n`)
  }
  return undefined
}

async function writeProcessMarker(processId, servicePort) {
  const path = markerPath()
  await mkdir(dirname(path), { recursive: true })
  await writeFile(
    path,
    `${JSON.stringify(
      {
        controllerPid: process.pid,
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
