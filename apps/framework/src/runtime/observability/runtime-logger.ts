import type { LogLevel, ServerConfig } from "../config/server-config.js"

type RuntimeLogRecord = {
  timestamp: string
  level: LogLevel
  event: string
} & Record<string, unknown>

type RuntimeLoggerSink = Pick<Console, "debug" | "info" | "warn" | "error">

const logLevelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

function shouldLog(configuredLevel: LogLevel, candidateLevel: LogLevel) {
  return logLevelOrder[candidateLevel] >= logLevelOrder[configuredLevel]
}

function formatTimestampForDevelopment(timestamp: string) {
  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) {
    return timestamp
  }

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

function formatContextValue(value: unknown): string {
  if (value == null) {
    return String(value)
  }

  if (typeof value === "string") {
    return value.includes(" ") ? JSON.stringify(value) : value
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }

  return JSON.stringify(value)
}

function formatDevelopmentRecord(record: RuntimeLogRecord) {
  const {
    timestamp,
    level,
    event,
    environment: _environment,
    appName: _appName,
    ...context
  } = record
  const prefix = `[${formatTimestampForDevelopment(timestamp)}] ${level.toUpperCase()} ${event}`
  const contextEntries = Object.entries(context)

  if (contextEntries.length === 0) {
    return prefix
  }

  return `${prefix} ${contextEntries
    .map(([key, value]) => `${key}=${formatContextValue(value)}`)
    .join(" ")}`
}

function writeRecord(
  config: ServerConfig,
  sink: RuntimeLoggerSink,
  level: LogLevel,
  record: RuntimeLogRecord
) {
  const serialized =
    config.environment === "development"
      ? formatDevelopmentRecord(record)
      : JSON.stringify(record)

  switch (level) {
    case "debug":
      sink.debug(serialized)
      return
    case "warn":
      sink.warn(serialized)
      return
    case "error":
      sink.error(serialized)
      return
    default:
      sink.info(serialized)
  }
}

export function createRuntimeLogger(
  config: ServerConfig,
  sink: RuntimeLoggerSink = console
) {
  function log(level: LogLevel, event: string, context: Record<string, unknown> = {}) {
    if (!shouldLog(config.observability.logLevel, level)) {
      return
    }

    writeRecord(config, sink, level, {
      timestamp: new Date().toISOString(),
      level,
      event,
      environment: config.environment,
      appName: config.appName,
      ...context,
    })
  }

  return {
    debug: (event: string, context?: Record<string, unknown>) =>
      log("debug", event, context),
    info: (event: string, context?: Record<string, unknown>) =>
      log("info", event, context),
    warn: (event: string, context?: Record<string, unknown>) =>
      log("warn", event, context),
    error: (event: string, context?: Record<string, unknown>) =>
      log("error", event, context),
  }
}

export function resolveRequestId(headerValue: string | string[] | undefined) {
  const value = Array.isArray(headerValue) ? headerValue[0] : headerValue
  const normalized = value?.trim()

  return normalized && normalized.length > 0 ? normalized : null
}
