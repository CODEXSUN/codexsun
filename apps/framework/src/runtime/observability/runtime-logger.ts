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

function writeRecord(
  sink: RuntimeLoggerSink,
  level: LogLevel,
  record: RuntimeLogRecord
) {
  const serialized = JSON.stringify(record)

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

    writeRecord(sink, level, {
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
