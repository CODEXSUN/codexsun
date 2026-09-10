import type { CodexToolActivity } from './codex-connection.types.js'

export function toToolActivity(item: Record<string, unknown>): CodexToolActivity | null {
  if (item.type === 'commandExecution' && typeof item.command === 'string') {
    const status = readActivityStatus(item)
    const details =
      status === 'failed' && typeof item.aggregatedOutput === 'string'
        ? item.aggregatedOutput
            .replace(
              /(authorization|api[-_]?key|password|token)\s*[:=]\s*[^\s]+/giu,
              '$1=[redacted]',
            )
            .slice(-2_000)
        : undefined
    return { kind: 'command', label: limitLabel(item.command), status, details }
  }
  if (item.type === 'fileChange') {
    const count = Array.isArray(item.changes) ? item.changes.length : 0
    return {
      kind: 'file_change',
      label: `${count} file ${count === 1 ? 'change' : 'changes'}`,
      status: readActivityStatus(item),
    }
  }
  if (item.type === 'mcpToolCall' && typeof item.tool === 'string') {
    const server = typeof item.server === 'string' ? `${item.server}: ` : ''
    return {
      kind: 'mcp',
      label: limitLabel(`${server}${item.tool}`),
      status: readActivityStatus(item),
    }
  }
  return null
}

function readActivityStatus(item: Record<string, unknown>): string {
  return typeof item.status === 'string' ? item.status : 'completed'
}

function limitLabel(value: string): string {
  return value.length <= 500 ? value : `${value.slice(0, 499)}…`
}
