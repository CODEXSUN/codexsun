import type {
  RuntimeFailure,
  RuntimeFailureOverview,
  ServiceAction,
  ServiceLogsResponse,
  ServiceSnapshot,
} from '@codexsun/orship-contracts'
import { spawn, spawnSync } from 'node:child_process'
import { closeSync, existsSync, openSync } from 'node:fs'
import { mkdir, open, readFile, readdir, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type {
  OrchestrationProcessGateway,
  OrchestrationTarget,
} from '../domain/orchestration.ports.js'

type ProcessMetric = {
  cpuSeconds: number | null
  memoryBytes: number | null
  pid: number
  startedAt: string | null
}

type ProcessMarker = {
  pid: number
  port: number
  projectRoot: string
  serviceId: string
}

export class LocalProcessGateway implements OrchestrationProcessGateway {
  private readonly failureRoot: string
  private readonly logRoot: string

  constructor(private readonly projectRoot: string) {
    this.failureRoot = join(projectRoot, 'storage/app/private/runtime/failures')
    this.logRoot = join(projectRoot, 'storage/app/private/runtime/logs')
  }

  async inspect(targets: readonly OrchestrationTarget[]): Promise<ServiceSnapshot[]> {
    const listeners = readListeners()
    const metrics = readProcessMetrics([...new Set(listeners.values())])
    return Promise.all(
      targets.map((target) => this.inspectTarget(target, listeners.get(target.port), metrics)),
    )
  }

  async act(target: OrchestrationTarget, action: ServiceAction): Promise<void> {
    if (action === 'start') await this.start(target)
    else await this.stop(target)
  }

  async readLogs(target: OrchestrationTarget, limit: number): Promise<ServiceLogsResponse> {
    const path = this.logPath(target.id)
    if (!existsSync(path)) {
      return { lines: [], serviceId: target.id, updatedAt: new Date().toISOString() }
    }

    const file = await open(path, 'r')
    try {
      const size = (await stat(path)).size
      const length = Math.min(size, 128_000)
      const buffer = Buffer.alloc(length)
      await file.read(buffer, 0, length, size - length)
      const lines = stripAnsi(buffer.toString('utf8')).split(/\r?\n/u).filter(Boolean).slice(-limit)
      return { lines, serviceId: target.id, updatedAt: new Date().toISOString() }
    } finally {
      await file.close()
    }
  }

  async readFailures(limit: number): Promise<RuntimeFailureOverview> {
    const files = await this.failureFiles()
    const records = await Promise.all(
      files.map(async (file) =>
        parseFailureRecords(
          await readFile(join(this.failureRoot, file), 'utf8'),
          file.replace(/\.jsonl$/u, ''),
        ),
      ),
    )
    const allFailures = records.flat().sort((left, right) => right.time.localeCompare(left.time))
    return {
      failures: allFailures.slice(0, limit),
      total: allFailures.length,
      updatedAt: new Date().toISOString(),
    }
  }

  private async inspectTarget(
    target: OrchestrationTarget,
    pid: number | undefined,
    metrics: ReadonlyMap<number, ProcessMetric>,
  ): Promise<ServiceSnapshot> {
    const health = await probeHealth(target)
    const metric = pid ? metrics.get(pid) : undefined
    const marker = pid ? await this.readMarker(target.id) : undefined
    const owned = Boolean(
      marker &&
      marker.pid === pid &&
      marker.port === target.port &&
      resolve(marker.projectRoot) === resolve(this.projectRoot),
    )
    const uptimeSeconds = metric?.startedAt
      ? Math.max(0, Math.floor((Date.now() - Date.parse(metric.startedAt)) / 1000))
      : null
    const running = pid !== undefined || health.healthy
    return {
      applicationId: target.applicationId,
      checkedAt: new Date().toISOString(),
      controllable: target.controllable && (!running || owned),
      cpuSeconds: metric?.cpuSeconds ?? null,
      healthUrl: health.url,
      healthy: health.healthy,
      id: target.id,
      kind: target.kind,
      latencyMs: health.latencyMs,
      logsAvailable: existsSync(this.logPath(target.id)),
      memoryBytes: metric?.memoryBytes ?? null,
      pid: pid ?? null,
      port: target.port,
      protected: target.protected,
      state: health.healthy ? 'online' : running ? 'degraded' : 'offline',
      uptimeSeconds,
    }
  }

  private async start(target: OrchestrationTarget): Promise<void> {
    if (readListeners().has(target.port)) return
    await mkdir(this.logRoot, { recursive: true })
    const descriptor = openSync(this.logPath(target.id), 'a')
    const preflight = resolve(this.projectRoot, 'tools/preflight.mjs')
    const child = spawn(process.execPath, [preflight, target.id], {
      cwd: this.projectRoot,
      detached: true,
      env: process.env,
      stdio: ['ignore', descriptor, descriptor],
      windowsHide: true,
    })
    child.unref()
    closeSync(descriptor)
    await waitForHealth(target, 30_000)
  }

  private async stop(target: OrchestrationTarget): Promise<void> {
    const pid = readListeners().get(target.port)
    if (!pid) return
    const marker = await this.readMarker(target.id)
    if (
      marker?.pid !== pid ||
      marker.port !== target.port ||
      resolve(marker.projectRoot) !== resolve(this.projectRoot)
    ) {
      throw new Error('The listener is not owned by this workspace.')
    }

    stopProcess(pid, false)
    if (await waitForPortRelease(target.port, 5_000)) return
    stopProcess(pid, true)
    if (!(await waitForPortRelease(target.port, 5_000))) {
      throw new Error(`Port ${target.port} did not release.`)
    }
  }

  private logPath(serviceId: string): string {
    return join(this.logRoot, `${serviceId}.log`)
  }

  private async failureFiles(): Promise<readonly string[]> {
    try {
      return (await readdir(this.failureRoot)).filter((file) => file.endsWith('.jsonl'))
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return []
      throw error
    }
  }

  private async readMarker(serviceId: string): Promise<ProcessMarker | undefined> {
    try {
      const value: unknown = JSON.parse(
        await readFile(
          join(this.projectRoot, 'storage/app/private/runtime/processes', `${serviceId}.json`),
          'utf8',
        ),
      )
      return isProcessMarker(value) ? value : undefined
    } catch {
      return undefined
    }
  }
}

function parseFailureRecords(content: string, fallbackComponent: string): RuntimeFailure[] {
  return content
    .split(/\r?\n/u)
    .filter(Boolean)
    .flatMap((line) => {
      try {
        const value = JSON.parse(line) as Record<string, unknown>
        const failure = normalizeFailure(value, fallbackComponent)
        return failure ? [failure] : []
      } catch {
        return []
      }
    })
}

function normalizeFailure(
  value: Record<string, unknown>,
  fallbackComponent: string,
): RuntimeFailure | undefined {
  const level = Number(value.level)
  if (!Number.isFinite(level) || level < 40 || typeof value.msg !== 'string') return undefined
  const component = typeof value.component === 'string' ? value.component : fallbackComponent
  const application =
    typeof value.application === 'string' ? value.application : component.split('-')[0]
  const date = new Date(typeof value.time === 'number' ? value.time : String(value.time))
  if (!application || Number.isNaN(date.valueOf())) return undefined
  return {
    application,
    component,
    ...(typeof value.correlationId === 'string' ? { correlationId: value.correlationId } : {}),
    event: typeof value.event === 'string' ? value.event : 'runtime.failure',
    level,
    msg: value.msg,
    ...(typeof value.requestId === 'string' ? { requestId: value.requestId } : {}),
    time: date.toISOString(),
  }
}

function readListeners(): Map<number, number> {
  if (process.platform !== 'win32') return new Map()
  const result = spawnSync('netstat.exe', ['-ano', '-p', 'tcp'], { encoding: 'utf8' })
  const listeners = new Map<number, number>()
  for (const line of result.stdout.split(/\r?\n/u)) {
    if (!line.includes('LISTENING')) continue
    const values = line.trim().split(/\s+/u)
    const port = Number(values[1]?.match(/:(\d+)$/u)?.[1])
    const pid = Number(values.at(-1))
    if (Number.isInteger(port) && Number.isInteger(pid)) listeners.set(port, pid)
  }
  return listeners
}

function readProcessMetrics(processIds: readonly number[]): Map<number, ProcessMetric> {
  if (process.platform !== 'win32' || processIds.length === 0) return new Map()
  const ids = processIds.filter(Number.isInteger).join(',')
  const command = [
    `$ids = @(${ids})`,
    'Get-CimInstance Win32_Process | Where-Object { $ids -contains [int]$_.ProcessId } | ForEach-Object {',
    '$process = Get-Process -Id $_.ProcessId -ErrorAction SilentlyContinue',
    '[PSCustomObject]@{ cpuSeconds = $process.CPU; memoryBytes = [long]$process.WorkingSet64; pid = [int]$_.ProcessId; startedAt = if ($process) { $process.StartTime.ToUniversalTime().ToString("o") } else { $null } }',
    '} | ConvertTo-Json -Compress',
  ].join('; ')
  const powershell = `${process.env.SystemRoot ?? 'C:\\Windows'}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`
  const result = spawnSync(powershell, ['-NoProfile', '-Command', command], {
    encoding: 'utf8',
    timeout: 5_000,
  })
  if (result.status !== 0 || !result.stdout.trim()) return new Map()
  const parsed: unknown = JSON.parse(result.stdout)
  const values = Array.isArray(parsed) ? parsed : [parsed]
  return new Map(
    values
      .filter((value): value is ProcessMetric => isProcessMetric(value))
      .map((value) => [value.pid, value]),
  )
}

async function probeHealth(target: OrchestrationTarget) {
  const url = `http://127.0.0.1:${target.port}${target.healthPath}`
  const startedAt = Date.now()
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1_500) })
    return { healthy: response.ok, latencyMs: Date.now() - startedAt, url }
  } catch {
    return { healthy: false, latencyMs: null, url }
  }
}

async function waitForHealth(target: OrchestrationTarget, timeout: number): Promise<void> {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if ((await probeHealth(target)).healthy) return
    await delay(250)
  }
  throw new Error(`${target.id} did not pass its health check.`)
}

async function waitForPortRelease(port: number, timeout: number): Promise<boolean> {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (!readListeners().has(port)) return true
    await delay(150)
  }
  return false
}

function stopProcess(pid: number, force: boolean): void {
  if (process.platform === 'win32') {
    const args = ['/PID', String(pid), '/T']
    if (force) args.push('/F')
    spawnSync('taskkill.exe', args, { stdio: 'ignore' })
    return
  }
  process.kill(pid, force ? 'SIGKILL' : 'SIGTERM')
}

function isProcessMetric(value: unknown): value is ProcessMetric {
  return (
    typeof value === 'object' && value !== null && 'pid' in value && Number.isInteger(value.pid)
  )
}

function isProcessMarker(value: unknown): value is ProcessMarker {
  return (
    typeof value === 'object' &&
    value !== null &&
    'pid' in value &&
    Number.isInteger(value.pid) &&
    'port' in value &&
    Number.isInteger(value.port) &&
    'projectRoot' in value &&
    typeof value.projectRoot === 'string' &&
    'serviceId' in value &&
    typeof value.serviceId === 'string'
  )
}

function stripAnsi(value: string): string {
  const escape = String.fromCharCode(27)
  return value.replace(new RegExp(`${escape}\\[[0-?]*[ -/]*[@-~]`, 'gu'), '')
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds))
}
