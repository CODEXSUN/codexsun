import { spawnSync } from 'node:child_process'
import { createServer } from 'node:net'

export async function preparePort({ healthUrl, host, label, port, workspacePath }) {
  if (await isPortAvailable(host, port)) return

  const owner = getWindowsPortOwner(port)
  const isHealthyService = healthUrl ? await isHealthy(healthUrl) : false
  if (!owner || (!isWorkspaceProcess(owner.commandLine, workspacePath) && !isHealthyService)) {
    const ownerState = owner ? 'listener owner found' : 'listener owner lookup failed'
    const healthState = isHealthyService ? 'health check passed' : 'health check failed'
    throw new Error(
      `Port ${host}:${port} is owned by another process and was not stopped (${ownerState}, ${healthState}).`,
    )
  }

  process.stdout.write(`[preflight] stopping existing ${label} process ${owner.stopProcessId}\n`)
  stopProcessTree(owner.stopProcessId, false)
  if (await waitForPort(host, port, 5_000)) return

  process.stdout.write(`[preflight] force-stopping ${label} process ${owner.stopProcessId}\n`)
  stopProcessTree(owner.stopProcessId, true)
  if (!(await waitForPort(host, port, 5_000))) {
    throw new Error(`Port ${host}:${port} did not release after stopping ${label}.`)
  }
}

async function isHealthy(url) {
  try {
    return (await fetch(url, { signal: AbortSignal.timeout(500) })).ok
  } catch {
    return false
  }
}

async function isPortAvailable(host, port) {
  return new Promise((resolve) => {
    const reservation = createServer()
    reservation.unref()
    reservation.once('error', () => resolve(false))
    reservation.listen({ exclusive: true, host, port }, () => {
      reservation.close(() => resolve(true))
    })
  })
}

function getWindowsPortOwner(port) {
  if (process.platform !== 'win32') return undefined
  const listing = spawnSync('netstat.exe', ['-ano', '-p', 'tcp'], { encoding: 'utf8' })
  const line = listing.stdout
    .split(/\r?\n/)
    .find((value) => value.includes(`:${port}`) && value.includes('LISTENING'))
  const processId = Number(line?.trim().split(/\s+/).at(-1))
  if (!Number.isInteger(processId) || processId < 1) return undefined

  const result = spawnSync(
    `${process.env.SystemRoot ?? 'C:\\Windows'}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`,
    [
      '-NoProfile',
      '-Command',
      [
        `$listener = Get-CimInstance Win32_Process -Filter 'ProcessId = ${processId}'`,
        '[PSCustomObject]@{ commandLine = $listener.CommandLine; stopProcessId = [int]$listener.ProcessId } | ConvertTo-Json -Compress',
      ].join('; '),
    ],
    { encoding: 'utf8' },
  )
  if (result.status !== 0 || !result.stdout.trim()) return undefined
  return JSON.parse(result.stdout)
}

function isWorkspaceProcess(commandLine, workspacePath) {
  return (
    typeof commandLine === 'string' &&
    commandLine.toLowerCase().includes(workspacePath.toLowerCase())
  )
}

function stopProcessTree(processId, force) {
  const argumentsList = ['/PID', String(processId), '/T']
  if (force) argumentsList.push('/F')
  spawnSync('taskkill.exe', argumentsList, { stdio: 'ignore' })
}

async function waitForPort(host, port, timeoutMilliseconds) {
  const deadline = Date.now() + timeoutMilliseconds
  while (Date.now() < deadline) {
    if (await isPortAvailable(host, port)) return true
    await new Promise((resolve) => setTimeout(resolve, 150))
  }

  return false
}
