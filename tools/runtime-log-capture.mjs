import { createWriteStream } from 'node:fs'
import { mkdir, rename, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { finished } from 'node:stream/promises'

const ansiPattern = new RegExp(`${String.fromCodePoint(27)}\\[[0-?]*[ -/]*[@-~]`, 'gu')
const baseFields = new Set([
  'application',
  'component',
  'environment',
  'hostname',
  'level',
  'msg',
  'pid',
  'service',
  'time',
  'version',
])
const levelNames = new Map([
  [10, 'TRACE'],
  [20, 'DEBUG'],
  [30, 'INFO'],
  [40, 'WARN'],
  [50, 'ERROR'],
  [60, 'FATAL'],
])

export async function createRuntimeLogCapture({ componentId, projectRoot, source = process.env }) {
  const logRoot = join(projectRoot, 'storage/app/private/runtime/logs')
  const failureRoot = join(projectRoot, 'storage/app/private/runtime/failures')
  await mkdir(logRoot, { recursive: true })
  await mkdir(failureRoot, { recursive: true })

  const paths = {
    clean: join(logRoot, `${componentId}.log`),
    failures: join(failureRoot, `${componentId}.jsonl`),
    structured: join(logRoot, `${componentId}.jsonl`),
  }
  const maxBytes = readMaxBytes(source.RUNTIME_LOG_MAX_BYTES)
  await Promise.all(Object.values(paths).map((path) => rotateWhenFull(path, maxBytes)))

  return new RuntimeLogCapture(componentId, paths)
}

export function formatRuntimeLogLine(componentId, line, channel = 'stdout') {
  const cleaned = stripTerminalCodes(line).trim()
  if (!cleaned) return undefined
  const record = parseRecord(cleaned)
  if (record) return formatRecord(componentId, record)

  const level = looksLikeFailure(cleaned) ? 50 : 30
  const rawRecord = createOutputRecord(componentId, cleaned, channel, level)
  return {
    clean: formatCleanLine(componentId, level, cleaned),
    failure: level >= 40 ? rawRecord : undefined,
    level,
    record: rawRecord,
  }
}

class RuntimeLogCapture {
  #buffers = { stderr: '', stdout: '' }
  #closed = false

  constructor(componentId, paths) {
    this.componentId = componentId
    this.clean = createWriteStream(paths.clean, { flags: 'a' })
    this.failures = createWriteStream(paths.failures, { flags: 'a' })
    this.structured = createWriteStream(paths.structured, { flags: 'a' })
  }

  write(channel, chunk) {
    if (this.#closed) return
    const source = channel === 'stderr' ? 'stderr' : 'stdout'
    const content = this.#buffers[source] + String(chunk)
    const lines = content.split(/\r?\n/u)
    this.#buffers[source] = lines.pop() ?? ''
    for (const line of lines) this.#writeLine(source, line)
  }

  recordFailure({ error, event = 'runtime.failure', message }) {
    const record = {
      application: applicationFromComponent(this.componentId),
      component: this.componentId,
      error: serializeError(error),
      event,
      level: 50,
      msg: message,
      time: new Date().toISOString(),
    }
    this.#writeRecord(record, true)
  }

  async close() {
    if (this.#closed) return
    this.#closed = true
    for (const channel of ['stdout', 'stderr']) {
      const remaining = this.#buffers[channel]
      if (remaining) this.#writeLine(channel, remaining)
    }
    this.clean.end()
    this.failures.end()
    this.structured.end()
    await Promise.all([finished(this.clean), finished(this.failures), finished(this.structured)])
  }

  #writeLine(channel, line) {
    const formatted = formatRuntimeLogLine(this.componentId, line, channel)
    if (!formatted) return
    this.structured.write(`${JSON.stringify(formatted.record)}\n`)
    this.clean.write(`${formatted.clean}\n`)
    const target = formatted.level >= 40 ? process.stderr : process.stdout
    target.write(`${formatted.clean}\n`)
    if (formatted.failure) this.failures.write(`${JSON.stringify(formatted.failure)}\n`)
  }

  #writeRecord(record, failure) {
    const formatted = formatRecord(this.componentId, record)
    this.structured.write(`${JSON.stringify(record)}\n`)
    this.clean.write(`${formatted.clean}\n`)
    process.stderr.write(`${formatted.clean}\n`)
    if (failure) this.failures.write(`${JSON.stringify(record)}\n`)
  }
}

function formatRecord(componentId, record) {
  const level = numericLevel(record.level)
  const message = formatMessage(record)
  return {
    clean: formatCleanLine(componentId, level, message, record.time),
    failure: level >= 40 ? record : undefined,
    level,
    record,
  }
}

function formatMessage(record) {
  if (record.event === 'http.request.completed') {
    const duration = formatDuration(record.durationSeconds)
    return `${record.method ?? 'HTTP'} ${record.route ?? '/'} -> ${record.statusCode ?? '?'} ${duration}${formatRequest(record)}`
  }
  if (record.event === 'http.request.started') {
    return `${record.method ?? 'HTTP'} ${record.url ?? '/'} started${formatRequest(record)}`
  }

  const error = record.err ?? record.error
  const errorMessage = error && typeof error === 'object' ? error.message : undefined
  const core = errorMessage
    ? `${record.msg ?? 'failure'}: ${errorMessage}`
    : String(record.msg ?? 'event')
  const details = Object.entries(record)
    .filter(
      ([key, value]) =>
        !baseFields.has(key) && key !== 'err' && key !== 'error' && value !== undefined,
    )
    .map(([key, value]) => `${key}=${formatValue(value)}`)
    .join(' ')
  return details ? `${core} | ${details}` : core
}

function formatCleanLine(componentId, level, message, timestamp = new Date().toISOString()) {
  const time = formatTime(timestamp)
  const scope = formatScope(componentId).padEnd(16)
  const levelName = (levelNames.get(level) ?? 'INFO').padEnd(5)
  return `${time} ${levelName} [${scope}] ${message}`
}

function formatScope(componentId) {
  const application = applicationFromComponent(componentId)
  const suffix = componentId.startsWith(`${application}-`)
    ? componentId.slice(application.length + 1)
    : componentId
  return `${application}/${suffix}`
}

function formatRequest(record) {
  const requestId =
    typeof record.requestId === 'string' ? ` req=${record.requestId.slice(0, 8)}` : ''
  const correlationId =
    typeof record.correlationId === 'string' && record.correlationId !== record.requestId
      ? ` corr=${record.correlationId.slice(0, 8)}`
      : ''
  return `${requestId}${correlationId}`
}

function formatDuration(seconds) {
  const milliseconds = Number(seconds) * 1_000
  return Number.isFinite(milliseconds) ? `${milliseconds.toFixed(milliseconds < 10 ? 1 : 0)}ms` : ''
}

function formatTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return '--:--:--.---'
  const local = date.toLocaleTimeString('en-GB', { hour12: false })
  return `${local}.${String(date.getMilliseconds()).padStart(3, '0')}`
}

function formatValue(value) {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return JSON.stringify(value)
  }
  const encoded = JSON.stringify(value)
  return encoded.length > 240 ? `${encoded.slice(0, 237)}...` : encoded
}

function parseRecord(line) {
  if (!line.startsWith('{')) return undefined
  try {
    const value = JSON.parse(line)
    return value && typeof value === 'object' && !Array.isArray(value) ? value : undefined
  } catch {
    return undefined
  }
}

function createOutputRecord(componentId, message, channel, level) {
  return {
    application: applicationFromComponent(componentId),
    component: componentId,
    channel,
    event: level >= 40 ? 'process.output.failure' : 'process.output',
    level,
    msg: message,
    time: new Date().toISOString(),
  }
}

function serializeError(error) {
  if (!(error instanceof Error)) return error === undefined ? undefined : { message: String(error) }
  return { message: error.message, name: error.name, stack: error.stack }
}

function numericLevel(value) {
  const parsed = Number(value)
  return levelNames.has(parsed) ? parsed : 30
}

function looksLikeFailure(line) {
  return /(?:\berror\b|\bfail(?:ed|ure)?\b|\bfatal\b|\buncaught\b|\bunhandled\b|\[warn\])/iu.test(
    line,
  )
}

function stripTerminalCodes(value) {
  return value.replace(ansiPattern, '')
}

function applicationFromComponent(componentId) {
  return componentId.split('-')[0] ?? componentId
}

function readMaxBytes(value) {
  const parsed = Number(value ?? 5_242_880)
  return Number.isSafeInteger(parsed) && parsed >= 65_536 ? parsed : 5_242_880
}

async function rotateWhenFull(path, maxBytes) {
  try {
    if ((await stat(path)).size < maxBytes) return
    const previous = `${path}.previous`
    await rm(previous, { force: true })
    await rename(path, previous)
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
}
